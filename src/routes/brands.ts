// API for brand to manipulate campaigns
import { Express } from "express"
import { PrismaClient } from "@prisma/client";
import UserEventEmitter from "../utilities/user_event_emit";
import TokenVerify from "../middlewares/token_verify";
import bcrypt from "bcrypt";
import { MessageNotifier, EventsToKOL } from "../utilities/msg_notifier";

export default (app: Express, prisma: PrismaClient) => {

    app.post('/brands/sign-up', async (req, res) => {
        /* #swagger.tags = ['Brand'] 
        */
        const { name, company, email, country_code, phone, passwd } = req.body
        const hashed_passwd = await bcrypt.hash(passwd, 10);
        try {
            const user = await prisma.user.create({
                data: {
                    name: name,
                    company_name: company,
                    email: email,
                    type: 'BRAND',
                    phone: phone,
                    country_code: country_code,
                    password: hashed_passwd
                },
            })

            console.log(`Brand created ${user}`);
            // sending confirmation mail with 6 digits code by async event
            UserEventEmitter.emit('USER_SIGNUP_DONE', user)

            res.json({ status: true, message: "Sign-up successfull", data: { userId: user.id, userType: 'BRAND' } });
        } catch (error) {
            console.error((error as Error).message);
            res.status(409).json({ status: false, message: "Email already exists." });
        }
    });

    app.get('/brands/campaign/applicants', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Brand']
            #swagger.security = [{
                 "bearerAuth": []
           }] 
             #swagger.parameters['campaign_id'] = {
                 in: 'query',
                 description: 'the Campaign ID to query',
                 required: true
            }   
            #swagger.parameters['status'] = {
                 in: 'query',
                 description: 'the status of the applicant, default be \"open\"',
                 required: false,
                 schema: {
                     $ref: '#/components/schemas/campaignApplicants'
                 }
                
            }     
             #swagger.parameters['page'] = {
                 in: 'query',
                 description: 'current page, default 1',
                 required: false
            }     
             #swagger.parameters['count'] = {
                 in: 'query',
                 description: 'items dispayed per page, default 10',
                 required: false
            }  
         */
        const campaign_id = req.query.campaign_id;
        // const approved = req.query.approved as string | undefined; // null -> Applicant List,  true-> Ongoing, false-> Declined
        const status = req.query.status; // null -> open(not even applied), 'applied', 'declined', 'approved(ongoing)', 'post-draft', 'post-approved', 'post-launched'
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 5;

        let apply_status: number[] = [0, 0, 0, 0, 0]; //open
        if (status == 'declined') {
            apply_status = [-1, 0, 0, 0, 0];
        } else if (status == 'applied') {
            apply_status = [1, 0, 0, 0, 0];
        } else if (status == 'approved') {
            apply_status = [1, 1, 0, 0, 0];
        } else if (status == 'post-draft') {
            apply_status = [1, 1, 1, 0, 0];
        } else if (status == 'post-approved') {
            apply_status = [1, 1, 1, 1, 0];
        } else if (status == 'post-launched') {
            apply_status = [1, 1, 1, 1, 1];
        }

        try {

            const total = await prisma.campaign_Apply.count({
                where: {
                    cmpgn_id: Number(campaign_id),
                    status: {
                        equals: apply_status
                    }
                }
            });

            const applies = await prisma.campaign_Apply.findMany({
                skip: (page - 1) * count,
                take: count,
                where: {
                    cmpgn_id: Number(campaign_id),
                    status: {
                        equals: apply_status
                    }
                }
            });

            const id_list = applies.map(a => a.user_id);

            const kols = await prisma.kOL_Profile.findMany({
                where: {
                    user_id: { in: id_list }
                },
                select: {
                    stage_name: true,
                    style_type: true,
                    age: true,
                    gender: true,
                    region: true,
                    img: true,
                    user_id: true,
                    platforms: {
                        select: {
                            plat_code: true,
                            followers_count: true,
                            views_count: true,
                            posts_count: true
                        }
                    }
                }
            });

            const candidates = [];

            for (let i = 0; i < kols.length; i++) {
                // let applicant: Record<string, any> = {};
                let state: string = 'unknown';
                if (applies[i].status[0] == 0) {
                    state = 'open'
                } else if (applies[i].status[0] == 1 && applies[i].status[1] == 0) {
                    state = 'applied'
                } else if (applies[i].status[0] == -1) {
                    state = 'declined'
                } else if (applies[i].status[0] == 1 && applies[i].status[1] == 1) {
                    state = 'approved'
                }

                let applicant = {
                    user_id: kols[i].user_id,
                    name: kols[i].stage_name,
                    style_type: kols[i].style_type,
                    age: kols[i].age,
                    gender: kols[i].gender,
                    location: kols[i].region,
                    introduction: applies[i].apply_msg,
                    image: kols[i].img,
                    apply_date: applies[i].apply_date.toISOString().split('T')[0],
                    apply_status: state,
                    platforms: kols[i].platforms
                }
                candidates.push(applicant);
            }

            res.json({
                status: true, message: "Query successfull", data:
                {
                    "totalItems": total,
                    "totalPages": Math.ceil(total / count),
                    "currentPage": page,
                    "itemsPerPage": count,
                    "applicants": candidates
                }
            });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/brands/campaign/applicant/approve', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Brand'] 
           #swagger.security = [{
                 "bearerAuth": []
           }] 
        */
        const { user_id, campaign_id } = req.body;

        try {
            await prisma.campaign_Apply.update({
                where: {
                    campaign_apply_id: {
                        user_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    status: [1, 1, 0, 0, 0],
                    approve_date: new Date().toISOString()
                }
            });

            //update Post_Job procedure to [1,1,0,0,0,0]
            await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    procedure: [1, 1, 0, 0, 0, 0]
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', user_id, campaign_id, EventsToKOL.CAMPAIGN_APPLY_APPROVAL, prisma);

            res.json({ status: true, message: `Approve applicant id(${user_id}) on campaign id(${campaign_id}) successfull`, data: {} });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/brands/campaign/applicant/reject', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Brand'] 
           #swagger.security = [{
                 "bearerAuth": []
           }] 
        */
        const { user_id, campaign_id } = req.body;

        try {
            await prisma.campaign_Apply.update({
                where: {
                    campaign_apply_id: {
                        user_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    status: [-1, 0, 0, 0, 0],
                }
            });

            //update Post_Job procedure to [1,-1,0,0,0,0]
            await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    procedure: [1, -1, 0, 0, 0, 0]
                }
            })

            res.json({ status: true, message: `Reject applicant id(${user_id}) on campaign id(${campaign_id}) completed`, data: {} });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.patch('/brands/campaign/post/review', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Brand'] 
           #swagger.security = [{
                 "bearerAuth": []
           }] 
        */
        const { user_id, campaign_id, comment_photo, comment_text } = req.body;
        try {
            const postjob = await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    comment_2: comment_photo,
                    comment_1: comment_text,
                    procedure: [1, 1, -1, 0, 0, 0]
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', user_id, campaign_id, EventsToKOL.CAMPAIGN_POST_REVIEW, prisma);

            res.json({ status: true, message: `Review of campaign id(${campaign_id}) post completed`, data: {} });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.patch('/brands/campaign/post/approve', async (req, res) => {
        /* #swagger.tags = ['Brand'] 
           #swagger.security = [{
                 "bearerAuth": []
           }] 
        */
        const { user_id, campaign_id } = req.body;
        try {
            await prisma.campaign_Apply.update({
                where: {
                    campaign_apply_id: {
                        user_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    status: [1, 1, 1, 1, 0],
                }
            });

            await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    approved: true,
                    procedure: [1, 1, 1, 1, 0, 0]
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', user_id, campaign_id, EventsToKOL.CAMPAIGN_POST_APPROVAL, prisma);

            res.json({ status: true, message: `Approval of campaign id(${campaign_id}) post completed`, data: {} });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });


}