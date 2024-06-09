import { Express } from "express"
import { PrismaClient } from "@prisma/client";
import { accessTokenGenerate, refreshTokenGenerate } from "../utilities/token_generate";
import TokenVerify from "../middlewares/token_verify";
import { refreshAccessToken } from "../middlewares/token_verify";
import bcrypt from "bcrypt";
import UserEventEmitter from "../utilities/user_event_emit";
import { Decipher, Encipher } from "../utilities/cipherman";
import redis from "../utilities/redis_client";

export default (app: Express, prisma: PrismaClient) => {

    app.get('/users', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User']
           #swagger.security = [{
                   "bearerAuth": []
           }] */
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 10;

        console.log(`page=${page}   count=${count}`)

        const users = await prisma.user.findMany({
            skip: (page - 1) * count,
            take: count,
            orderBy: {
                id: 'desc',
            },
            include: {
                profile: true,
            },
        });

        res.json({ status: true, message: "Query successfull", data: users });
    });

    app.get('/users/:id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User']
           #swagger.security = [{
                   "bearerAuth": []
           }] */
        try {
            const uid = req.params.id
            const user = await prisma.user.findUnique({
                where: {
                    id: Number(uid)
                },
            });

            if (!user) {
                throw new Error(`No such User by the ${uid}`)
            }

            res.json({ status: true, message: "Query successfull", data: user });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/users/sign-up', async (req, res) => {
        /* #swagger.tags = ['User'] */
        const { name, email, country_code, phone, passwd } = req.body

        if (passwd === undefined || email === undefined || name === undefined) {
            res.status(400).json({ status: false, message: "Missing data. name, email, password are required." });
        }

        try {
            const hashed_passwd = await bcrypt.hash(passwd, 10);
            const user = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    type: 'KOL',
                    country_code: country_code,
                    phone: phone,
                    password: hashed_passwd
                },
            })
            console.log(`User created ID: ${user.id}`);
            // sending confirmation mail with 6 digits code by async event
            // SignUpEventEmitter.emit('USER_SIGNUP_DONE', user)
            UserEventEmitter.emit('USER_SIGNUP_DONE', user);

            res.json({ status: true, message: "Sign-up successfull", data: { userId: user.id, userType: 'KOL' } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(409).json({ status: false, message: "Email already exists." });
        }
    })

    /** after social log in, the frontend shall call this api to add new user.
     *  1. check if the email already existed
     *  2. if no, create new user
     *  3. if yes, update the account_id, and auth_by (such as Google, FB, IG)
     */
    app.post('/users/social-signin', async (req, res) => {
        /* #swagger.tags = ['User'] */
        const { name, acct_id, email, auth_by } = req.body
        try {
            const user: { id: number, email: string, auth_by: string | null } | null = await prisma.user.findUnique({
                where: {
                    email: email
                },
                select: {
                    id: true,
                    email: true,
                    auth_by: true
                }
            });

            if (user) {
                if (user.auth_by != auth_by) { //update
                    const updateUser = await prisma.user.update({
                        where: {
                            id: user.id
                        },
                        data: {
                            account_id: acct_id,
                            auth_by: auth_by,
                        }
                    });

                    console.log(`User updated ${updateUser}`);
                }
                const accessToken = accessTokenGenerate(user.id, user.email, 'KOL');
                const refreshToken = refreshTokenGenerate(user.id, user.email, 'KOL');
                res.json(
                    {
                        status: true,
                        message: `${auth_by} sign-in successfull`,
                        data: { "userId": user.id, "userName": name, "userType": "KOL", "accessToken": accessToken, "refreshToken": refreshToken }
                    });
            } else { // create
                const newuser = await prisma.user.create({
                    data: {
                        name: name,
                        account_id: acct_id,
                        email: email,
                        auth_by: auth_by,
                        type: 'KOL',
                        active: true
                    },
                });

                console.log(`User created ${newuser}`);

                const accessToken = accessTokenGenerate(newuser.id, newuser.email, 'KOL');
                const refreshToken = refreshTokenGenerate(newuser.id, newuser.email, 'KOL');
                res.json(
                    {
                        status: true,
                        message: `${auth_by} sign-in successfull`,
                        data: { "userId": newuser.id, "userName": name, "userType": "KOL", "accessToken": accessToken, "refreshToken": refreshToken }
                    });
            }
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }

    });

    app.post('/users/sign-in', async (req, res) => {
        /* #swagger.tags = ['User', 'Brand'] */
        const { email, passwd } = req.body
        try {
            const user: { id: number, email: string, name: string, type: string, password: string | null, active: boolean } | null = await prisma.user.findUnique({
                where: {
                    email: email
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    type: true,
                    password: true,
                    active: true,
                }
            });
            if (!user) {
                throw new Error('no such Email registed ')
            } else if (!user.password) {
                throw new Error('the email is from social media')
            }

            const result = await bcrypt.compare(passwd, user.password)

            if (!result) {
                throw new Error('incorrect password')
            }

            if (!user.active) {
                throw new Error('sign-up email unconfirmed')
            }

            const accessToken = accessTokenGenerate(user.id, user.email, user.type);
            const refreshToken = refreshTokenGenerate(user.id, user.email, user.type);
            res.json(
                {
                    status: true,
                    message: 'sign-in by email/password successfull',
                    data: { "userId": user.id, "userName": user.name, "userType": user.type, "accessToken": accessToken, "refreshToken": refreshToken }
                });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message }
            )
        }
    });

    app.post('/users/sign-up/confirm', async (req, res) => {
        /* #swagger.tags = ['User', 'Brand'] */
        const { crypted_email, confirm_code } = req.body

        const email = Decipher(crypted_email);

        const code = await redis.get(email);
        if (code && code === confirm_code) {
            const updateUser = await prisma.user.update({
                where: {
                    email: email
                },
                data: {
                    active: true
                }
            });

            // redis delete
            return res.json({ status: true, message: "Sign-up confirmed", data: { "userId": updateUser.id, "email": updateUser.email } });
        }

        res.status(500).json({ status: false, message: "Sign-up confirmation failed" });
    });


    app.post('/users/forget-password', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User', 'Brand'] */
        const { email } = req.body
        try {
            const user: { id: number, email: string } | null = await prisma.user.findUnique({
                where: {
                    email: email
                },
                select: {
                    id: true,
                    email: true,
                }
            });

            if (user) {
                UserEventEmitter.emit('USER_RESET_PASSWORD', user);
                return res.json({ status: true, message: "Request for password reset successfull", data: { "userId": user.id, "email": user.email } });
            }

            return res.json({ status: false, message: "No such email registered" });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message }
            )
        }
    });

    app.post('/users/reset-password', async (req, res) => {
        /* #swagger.tags = ['User', 'Brand'] */
        const { new_password, token } = req.body
        const encrypted_token = Encipher(token);

        const email = await redis.get(encrypted_token);

        const hashed_passwd = await bcrypt.hash(new_password, 10);
        if (email) {
            //update with the new_password db where email= email
            await prisma.user.update({
                where: {
                    email: email
                },
                data: {
                    password: hashed_passwd
                }
            });

        } else {
            res.status(500).json({ status: false, message: "The link of reset password expired or invalid" });
        }

        res.json({ status: true, message: "Re-set password successful" });
    });

    app.post('/users/refresh-token', async (req, res) => {
        /* #swagger.tags = ['User', 'Brand'] */
        try {
            const refreshToken = req.body.refresh_token;
            const accessToken = refreshAccessToken(refreshToken);
            res.json(
                {
                    status: true,
                    message: 'access token refresh successfull',
                    data: { "accessToken": accessToken }
                });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message });
        }
    });

    app.post('/users/change-password/:id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User']
           #swagger.security = [{
                   "bearerAuth": []
                   }] 
        */
        const uid = req.params.id
        const { old_password, new_password } = req.body

        try {
            const user = await prisma.user.findUnique({
                select: {
                    id: true,
                    email: true,
                    password: true
                },
                where: {
                    id: Number(uid)
                },
            });

            if (!user) {
                throw new Error(`No such User by ID ${uid}`)
            }

            if (old_password) {
                const result = await bcrypt.compare(old_password, user.password!)
                if (!result) {
                    throw new Error('incorrect current password')
                }
            }

            const hashed_passwd = await bcrypt.hash(new_password, 10);
            await prisma.user.update({
                where: {
                    id: Number(uid)
                },
                data: {
                    password: hashed_passwd
                }
            });
            res.json({ status: true, message: "Password changed successfull" });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/users/change-phone/:id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User']
                  #swagger.security = [{
                          "bearerAuth": []
                  }] 
        */
        const uid = req.params.id
        const { new_phone, new_country_code } = req.body
        try {
            const user = await prisma.user.findUnique({
                select: {
                    id: true,
                    email: true,
                },
                where: {
                    id: Number(uid)
                },
            });

            if (!user) {
                throw new Error(`No such User by ID ${uid}`)
            }

            await prisma.user.update({
                where: {
                    id: Number(uid)
                },
                data: {
                    phone: new_phone,
                    country_code: new_country_code
                }
            });
            res.json({ status: true, message: "Phone number changed successfull" });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/users/account-details/:id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['User']
                 #swagger.security = [{
                         "bearerAuth": []
                    }] 
        */
        const uid = req.params.id
        // response  email, address, password, country_code, phone, total earned, total withdraw, balance= total earned - total withdraw
        try {
            const account_info = await prisma.user.findUnique({
                select: {
                    id: true,
                    email: true,
                    address: true,
                    password: true,
                    country_code: true,
                    phone: true
                },
                where: {
                    id: Number(uid)
                },
            });

            if (!account_info) {
                throw new Error(`No such User by ID ${uid}`)
            }

            const total_earn = await prisma.txn_Record.groupBy({
                by: ['user_id', 'type'],
                where: {
                    user_id: Number(uid),
                    type: 'Earn'
                },
                _sum: {
                    amount: true
                }
            });

            const total_wdraw = await prisma.txn_Record.groupBy({
                by: ['user_id', 'type'],
                where: {
                    user_id: Number(uid),
                    type: 'Withdraw'
                },
                _sum: {
                    amount: true
                }
            });
            const balance = Number(total_earn) - Number(total_wdraw)

            const account_data = {
                user_id: uid,
                email: account_info?.email,
                address: account_info?.address,
                country_code: account_info.country_code,
                phone: account_info.phone,
                total_earned: Number(total_earn),
                total_withdrawn: Number(total_wdraw),
                balance: Number(total_earn) - Number(total_wdraw)
            }

            res.json({ status: true, message: "Query successfull", data: account_data });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    // app.get('/users/account-/:id', async (req, res) => {
    //     /* #swagger.tags = ['User']
    //              #swagger.security = [{
    //                      "bearerAuth": []
    //                 }] 
    //     */
    //     const uid = req.params.id

    //     try {

    //     } catch (error) {
    //         console.error((error as Error).message);
    //         res.status(500).json({ status: false, message: (error as Error).message })
    //     }
    // })

    app.get('/users/test/:user_id/:campaign_id', async (req, res) => {

        const { user_id, campaign_id } = req.params
        // console.log(`name: ${name}`);

        const notification = {
            user_id: Number(user_id),
            campaign_id: Number(campaign_id),
            message: "Campaign has been approved by brand",
        };

        const notifications = [
            { id: 12, message: "Campaign has been approved by brand", date: new Date() },
            { id: 19, message: "Post draft approved", date: new Date() },
            { id: 23, message: "Test notification", date: new Date() },

        ]

        UserEventEmitter.emit('WS_TEST', JSON.stringify(notifications), user_id);
        res.json({ status: true, message: "Query successfull" });
    })
}