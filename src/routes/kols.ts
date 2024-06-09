// API for KOL
import { Express } from "express"
import { PrismaClient, Prisma } from "@prisma/client";
import TokenVerify from "../middlewares/token_verify";
import { gcs_base64_writer } from "../utilities/gcs_uploader";
import { format } from "util";
import { processFileMiddleware } from "../middlewares/upload_verify";
import { gcs_file_uploader, gcs_file_cleaner } from "../utilities/gcs_uploader";
import { MessageNotifier, EventsToBrand } from "../utilities/msg_notifier";

type PlteformLinks = {
    id: number,
    platform_code: string,
    link: string
}

type CampaignApply = {
    cmpgn_id: number,
    apply_date: Date,
    status: number[],
    closed: boolean
}

export default (app: Express, prisma: PrismaClient) => {

    app.post('/kols/profile/create', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                   "bearerAuth": []
           }] 
        */
        const { stage_name, style_type, bio, birthdate, age, gender, img, region, user_id } = req.body

        const kol_profile = await prisma.kOL_Profile.create({
            data: {
                stage_name: stage_name,
                style_type: style_type,
                age: age,
                gender: gender,
                img: img,
                bio: bio,
                birthdate: birthdate && new Date(birthdate).toISOString(),
                region: region,
                user: {
                    connect: {
                        id: user_id
                    }
                }
            }
        })
        console.log(`KOL Profile created ${JSON.stringify(kol_profile, null, 4)}`);
        res.json({ status: true, message: "KOL profile created successfull", data: kol_profile });
    });

    app.post('/kols/profile/personal-info', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */
        const { email, country_code, phone, region, birthdate, user_id } = req.body;

        try {
            const profile = await prisma.kOL_Profile.findUnique({
                select: {
                    id: true
                },
                where: {
                    user_id: user_id
                }
            });

            await prisma.user.update({
                where: {
                    id: user_id
                },
                data: {
                    email: email,
                    country_code: country_code,
                    phone: phone
                }
            });



            await prisma.kOL_Profile.upsert({
                where: {
                    id: profile?.id || 0
                },
                update: {
                    region: region,
                    birthdate: new Date(birthdate).toISOString(),
                },
                create: {
                    region: region,
                    birthdate: new Date(birthdate).toISOString(),
                    style_type: '',
                    img: '',
                    user_id: user_id
                }
            })

            res.json({ status: true, message: "Query successfull", data: `user's(${user_id}) Influencer personal info updated.` });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }

    });

    app.post('/kols/profile/name_style', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */
        try {
            const { user_id, name, style_type } = req.body;

            await prisma.kOL_Profile.update({
                where: {
                    user_id: user_id
                },
                data: {
                    stage_name: name,
                    style_type: style_type
                }
            });

            res.json({ status: true, message: "Query successfull", data: `user's(${user_id}) Influencer profile updated.` });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }

    });

    app.post('/kols/profile/avatar', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */
        try {
            const { base64img, user_id } = req.body;
            // base64img =  "data:image/png;base64,iVBOR......... ..."

            const plain_img = base64img.split(';base64,');
            const img_type = plain_img[0].split('/')[1];
            const desti_file = `profile/avatar/${user_id}/${new Date().getTime().toString()}.${img_type}`;
            gcs_base64_writer(desti_file, plain_img[1]);

            const bucket_name = process.env.GCS_BUCKET_NAME;
            const avatar_url = format(
                `https://storage.googleapis.com/${bucket_name}/${desti_file}`
            );

            await prisma.kOL_Profile.update({
                where: {
                    user_id: user_id
                },
                data: {
                    img: avatar_url
                }
            });

            res.json({ status: true, message: 'Avatar image uploading successfull.', data: avatar_url });
        } catch (err) {
            console.log((err as Error).message);
            res.status(500).json({
                status: false,
                message: `Could not upload the file. ${err}`,
            });
        }
    });

    app.post('/kols/profile/about-me', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */
        const { user_id, about_me } = req.body;

        try {
            const profile = await prisma.kOL_Profile.update({
                where: {
                    user_id: user_id
                },
                data: {
                    bio: about_me
                }
            });


            res.json({ status: true, message: 'Update profile "about me" data successfull.', data: { profile_id: profile.id } });
        } catch (err) {
            console.log((err as Error).message);
            res.status(500).json({
                status: false, message: `Could not update profile "about me" data of User ID: ${user_id}`,
            });
        }
    });

    app.post('/kols/profile/social-media-links', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */

        const { user_id, platforms } = req.body;
        try {
            const profile = await prisma.kOL_Profile.findFirstOrThrow({
                select: {
                    id: true
                },
                where: {
                    user_id: user_id
                }
            });

            const existed = await prisma.kOL_Platform.findMany({
                select: {
                    id: true,
                    plat_code: true,
                    is_sync: true
                },
                where: {
                    kol_profile_id: profile.id
                }
            });

            const current = (platforms as Array<PlteformLinks>).map(p => p.platform_code);
            const removal = existed.filter(e => !current.includes(e.plat_code) && !e.is_sync);
            removal.map(async (p) => {
                await prisma.kOL_Platform.delete({
                    where: {
                        id: p.id
                    }
                });
            });

            // then, update or insert 
            (platforms as Array<PlteformLinks>).map(async (p) => {
                try {
                    await prisma.kOL_Platform.upsert({
                        where: {
                            id: p.id || 0
                        },
                        update: {
                            plat_code: p.platform_code,
                            link: p.link
                        },
                        create: {
                            plat_code: p.platform_code,
                            link: p.link,
                            kol_profile_id: profile.id
                        }
                    });

                } catch (error) {
                    console.error((error as Error).message);
                    if (error instanceof Prisma.PrismaClientValidationError) {
                        res.status(500).json({ status: false, message: (error as Error).message.split("\n\n").slice(-1) });
                    } else {
                        res.status(500).json({ status: false, message: (error as Error).message });
                    }
                }
            });

            res.json({ status: true, message: 'Social media links update successfull.', data: { profile_id: profile.id } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/kols/campaign/apply', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
        */
        const { user_id, campaign_id, introduction } = req.body;
        try {
            const campaign_apply = await prisma.campaign_Apply.create({
                data: {
                    cmpgn_id: campaign_id,
                    user_id: user_id,
                    apply_msg: introduction
                }
            });

            const campaign = await prisma.campaign.findUnique({
                select: {
                    applicants: true
                },
                where: {
                    id: campaign_id
                }
            });

            await prisma.campaign.update({
                where: {
                    id: campaign_id
                },
                data: {
                    applicants: campaign!.applicants ? campaign!.applicants + 1 : 1
                }
            });

            //create a Post_Job for this campaign and user
            await prisma.post_Job.create({
                data: {
                    cmpgn_id: campaign_id,
                    author_id: user_id,
                    updated_at: new Date()
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', user_id, campaign_id, EventsToBrand.CAMPAIGN_APPLY_NEW, prisma);

            res.json({ status: true, message: 'Campaign applying successfull.', data: { campaign_id: campaign_id, user_id: user_id } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/kols/postjob/photo/remove', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
        */
        const { user_id, campaign_id, photo_urls } = req.body;
        const separator = '/'.concat(process.env.GCS_BUCKET_NAME as string, '/');
        const desti_files = photo_urls.map((url: string) => {
            return url.split(separator)[1]
        });
        console.log(desti_files);
        try {
            gcs_file_cleaner(desti_files);

            const postjob = await prisma.post_Job.findUnique({
                select: {
                    photos: true
                },
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                }
            });

            // const remains = postjob?.photos.filter((url: string) => {
            //     return !photo_urls.includes(url);
            // });

            await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    photos: postjob?.photos.filter((url: string) => {
                        return !photo_urls.includes(url);
                    })
                }
            });

            res.json({ status: true, message: `Photo of campaign: ${campaign_id} removed successfull.` });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/kols/postjob/launch', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
           #swagger.consumes = ['multipart/form-data']
           #swagger.parameters['file'] = {
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'the screenshot of the launched post',
           }
            #swagger.parameters['post_link'] = {
                in: 'formData',
                name: 'post_link',
                type: 'string',
                required: true,
                description: 'The public URL of the launched post',
           }
           #swagger.parameters['campaign_id'] = {
                in: 'formData',
                name: 'campaign_id',
                type: 'integer',
                required: true,
                description: 'the campaign id of the post launched',
           }
           #swagger.parameters['user_id'] = {
                in: 'formData',
                name: 'user_id',
                type: 'integer',
                required: true,
                description: 'the author id of this post',
           }
        */
        try {
            await processFileMiddleware(req, res);
            if (!req.file) {
                return res.status(400).send({ message: "Please upload a screenshot of the launched post!" });
            }

            const bucket_name = process.env.GCS_BUCKET_NAME;
            const post_link = req.body.post_link;
            const campaign_id = req.body.campaign_id;
            const user_id = req.body.user_id;
            const bucket_path = `posts/${campaign_id}/${user_id}/${Date.now()}`;

            gcs_file_uploader(bucket_path, req.file);

            const publicUrl = format(
                `https://storage.googleapis.com/${bucket_name}/${bucket_path}/${req.file.originalname}`
            );

            await prisma.campaign_Apply.update({
                where: {
                    campaign_apply_id: {
                        user_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                data: {
                    status: [1, 1, 1, 1, 1],
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
                    launch_link: post_link,
                    launch_image: publicUrl,
                    launched: true,
                    procedure: [1, 1, 1, 1, 1, 0]
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', user_id, campaign_id, EventsToBrand.POST_LAUNCH, prisma);

            res.json({ status: true, message: 'Post Job submit successfull.', data: { campaign_id: campaign_id, user_id: user_id } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    /** this API replaced by uploader.ts>>app.post('/upload/posts/:campaign_id/:user_id') */
    // app.patch('/kols/postjob/submit', TokenVerify, async (req, res) => {
    //     /* #swagger.tags = ['KOL'] */
    //     /* #swagger.security = [{
    //         "bearerAuth": []
    //          }] 
    //     */
    //     const { user_id, campaign_id, title, content, photo_urls } = req.body;
    //     try {
    //         await prisma.post_Job.update({
    //             where: {
    //                 post_job_id: {
    //                     author_id: user_id,
    //                     cmpgn_id: campaign_id
    //                 }
    //             },
    //             data: {
    //                 content: content,
    //                 description: title,
    //                 photos: photo_urls,
    //                 procedure: [1, 1, 1, 0, 0, 0]
    //             }
    //         });

    //         res.json({ status: true, message: 'Post Job submit successfull.', data: { campaign_id: campaign_id, user_id: user_id } });
    //     } catch (error) {
    //         console.error((error as Error).message);
    //         res.status(500).json({ status: false, message: (error as Error).message })
    //     }
    // });

    app.get('/kols/suggestions/:campaign_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
        */
        const campaign_id = req.params.campaign_id;
        console.log(`Query KOL suggestions by campaign_id = ${campaign_id}`);

        const kol_types = await prisma.campaign_KOL_Type.findMany({
            where: {
                camp_id: Number(campaign_id)
            },
            select: {
                gender: true,
                age_range: true,
                follower_range: true,
                plat_code: true
            }
        });
        console.log(kol_types)

        let suggestions: any[] = []
        for (let i = 0; i < kol_types.length; i += 1) {
            const kol_profiles = await prisma.kOL_Profile.findMany({
                where: {
                    //the conditions from kol_types
                    gender: kol_types[i].gender,
                    age: {
                        gte: kol_types[i].age_range[0],  // min
                        lte: kol_types[i].age_range[1]  // max
                    },
                    platforms: {
                        some: {
                            plat_code: kol_types[i].plat_code,
                            followers_count: {
                                gte: kol_types[i].follower_range[0], //min
                                lte: kol_types[i].follower_range[1]  //max
                            }
                        }
                    }
                }, select: {
                    id: true,
                    stage_name: true,
                    style_type: true,
                    img: true,
                    platforms: {
                        where: {
                            plat_code: kol_types[i].plat_code
                        },
                        select: {
                            plat_code: true,
                            followers_count: true
                        }
                    }
                }
            });

            let profile: Record<string, any> = {};
            const profile_data = kol_profiles.map(k => {
                profile = {};
                profile.profile_id = k.id;
                profile.stage_name = k.stage_name;
                profile.style_type = k.style_type;
                profile.img = k.img;
                profile.plat_code = k.platforms[0].plat_code;
                profile.followers_count = k.platforms[0].followers_count;
                return profile;
            });

            // console.log("----->" + JSON.stringify(kol_profiles))
            suggestions = [...suggestions, ...profile_data];
        }; //for loop


        // console.log(suggestions)
        res.json({ status: true, message: "Query successfull", data: suggestions });
    });

    app.get('/kols/syncs/:user_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
                   #swagger.security = [{
                        "bearerAuth": []
                   }] 
        */
        const uid = req.params.user_id;
        const platforms = await prisma.kOL_Platform.findMany({
            where: {
                kol_profile: {
                    user: {
                        id: Number(uid)
                    }
                }
            },
            select: {
                plat_code: true,
                plat_name: true,
                is_sync: true,
                kol_profile: {
                    select: {
                        id: true,
                        user: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        res.json({ status: true, message: "Query successfull", data: platforms });

    });

    app.patch('/kols/sync-off/:platform/:user_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
                   #swagger.security = [{
                        "bearerAuth": []
                   }] 
        */
        const uid = req.params.user_id;
        const plat = req.params.platform;
        console.log(`uid: ${uid}   platform:${plat}`)
        try {
            const kolplat = await prisma.kOL_Platform.findFirst({
                where: {
                    plat_code: plat,
                    kol_profile: {
                        user: {
                            id: Number(uid)
                        }
                    }
                },
                select: {
                    id: true,
                    plat_code: true,
                    is_sync: true
                }
            });

            console.log(`platform: ${kolplat}`)
            if (!kolplat) throw new Error(`No such KOL Plteform by plateform ${plat} and user ID: ${uid} `)

            await prisma.kOL_Platform.update({
                where: {
                    id: kolplat?.id
                },
                data: {
                    is_sync: false,
                    access_token: null
                }
            });

            res.json({ status: true, message: "Query successfull", data: `user(${uid}) ${plat} sync off` });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/profile/:user_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
            #swagger.parameters['user_id'] = {
                 in: 'path',
                 description: 'the User ID of KOL to query.',
                 required: true
            }  
           #swagger.parameters['campaign_id'] = {
                 in: 'query',
                 description: 'the Campaign ID to query. If provided, for brand query.',
                 required: false
            }  
        */
        const uid = req.params.user_id;
        const campaign_id = req.query.campaign_id;

        let state = null;
        try {

            if (campaign_id) {
                const apply = await prisma.campaign_Apply.findUniqueOrThrow({
                    where: {
                        campaign_apply_id: {
                            user_id: Number(uid),
                            cmpgn_id: Number(campaign_id)
                        }
                    },
                    select: {
                        status: true
                    }
                });

                state = 'N/A';
                if (apply.status == null) {
                    state = 'open'
                } else if (apply.status[1] == 1) {
                    state = 'accepted'
                } else if (apply.status[0] == 0) {
                    state = 'declined'
                }
            }

            console.log(`Query KOL profile by User ID = ${uid}`);

            const kol_profile = await prisma.kOL_Profile.findUnique({
                where: {
                    user_id: Number(uid)
                },
                select: {
                    id: true,
                    stage_name: true,
                    style_type: true,
                    bio: true,
                    region: true,
                    birthdate: true,
                    img: true,
                    is_verified: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            country_code: true,
                            phone: true
                        }
                    }
                }
            });

            if (!kol_profile) {
                throw new Error(`No such User by ID ${uid}`)
            }

            const kol_platforms = await prisma.kOL_Platform.findMany({
                where: {
                    kol_profile_id: kol_profile?.id
                },
                select: {
                    id: true,
                    plat_code: true,
                    link: true,
                    followers_count: true,
                    views_count: true,
                    posts_count: true,
                    audience_gender: true,
                    audience_age: true,
                    audience_region: true
                }
            });
            console.log(`profile id : ${kol_profile?.id}`)

            let profle_info: Record<string, any> = {};
            // const profle_info = { ...kol_profile, platforms: kol_platforms }
            campaign_id ? profle_info.apply_status = state :
                profle_info.profile_id = kol_profile?.id;
            // profle_info.apply_status = state;
            profle_info.profile_name = kol_profile?.stage_name;
            profle_info.style_type = kol_profile?.style_type;
            profle_info.verified = kol_profile?.is_verified;
            profle_info.image = kol_profile?.img;
            profle_info.about_me = kol_profile?.bio;
            profle_info.location = kol_profile?.region;
            profle_info.birthday = kol_profile?.birthdate?.toISOString().split('T')[0];
            profle_info.email = kol_profile?.user.email;
            profle_info.country_code = kol_profile?.user.country_code;
            profle_info.phone = kol_profile?.user.phone;
            profle_info.platforms = kol_platforms;

            res.json({ status: true, message: "Query successfull", data: profle_info });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/profile/posts/:platform/:user_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
           #swagger.security = [{
                "bearerAuth": []
           }] 
            #swagger.parameters['platform'] = {
                description: 'facebook | instagram',
                required: true
        }   
            #swagger.parameters['user_id'] = {
                description: 'the User ID of KOL',
                required: true
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
            #swagger.parameters['start'] = {
            in: 'query',
            description: 'start date, format yyyy-mm-dd',
            required: false
       }     
            #swagger.parameters['end'] = {
            in: 'query',
            description: 'end date, format yyyy-mm-dd',
            required: false
       }  
        */
        const uid = req.params.user_id;
        const platform = req.params.platform;
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 5;
        const start = req.query.start;
        const end = req.query.end;
        console.log(`${start} - ${end}`)
        console.log(`Query KOL profile posts by User ID = ${uid} on Platform = ${platform}`);
        try {
            const total = await prisma.platform_Post.count({
                where: {
                    platform: {
                        kol_profile: {
                            user_id: Number(uid)
                        },
                        plat_code: platform,
                    },
                    posted_at: {
                        gte: start ? new Date(String(start)) : undefined, // Start of date range
                        lte: end ? new Date(String(end)) : undefined, // End of date range
                    }
                }
            });

            const platform_posts = await prisma.platform_Post.findMany({
                skip: (page - 1) * count,
                take: count,
                where: {
                    platform: {
                        kol_profile: {
                            user_id: Number(uid)
                        },
                        plat_code: platform,
                    },
                    posted_at: {
                        gte: start ? new Date(String(start)) : undefined, // Start of date range
                        lte: end ? new Date(String(end)) : undefined, // End of date range
                    }
                }
            });
            let post: Record<string, any> = {};
            const posts = platform_posts.map(p => {
                post = { ...p };
                post.date = p.posted_at.toISOString().split('T')[0];
                delete post.posted_at;
                return post;
            });

            res.json({
                status: true, message: "Query successfull", data:
                {
                    "totalItems": total,
                    "totalPages": Math.ceil(total / count),
                    "currentPage": page,
                    "itemsPerPage": count,
                    "posts": posts
                }
            });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/marketplace', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
                 #swagger.security = [{
                      "bearerAuth": []
                 }] 
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
        #swagger.parameters['user_id'] = {
               in: 'query',
               description: 'user id of the influencer calling api',
               required: true
           } 
           #swagger.parameters['keyword'] = {
               in: 'query',
               description: 'search keyword in title or description',
               required: false
           }   
           #swagger.parameters['active'] = {
               in: 'query',
               description: 'true or false, default true',
               required: false
          }   
              */
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 10;
        const keyword = req.query.keyword as string;
        const user_id = req.query.user_id;
        const is_active = Boolean(req.query.active) || true;

        try {
            if (!user_id) throw new Error("query parameter 'user_id' is required.");

            const total = await prisma.campaign.count({
                where: {
                    ...(keyword ?
                        {
                            OR: [
                                { title: { contains: keyword, mode: 'insensitive' } },
                                { description: { contains: keyword, mode: 'insensitive' } }
                            ]
                        } : {}),
                    status: is_active ? 'active' : {}
                }
            });

            const camps = await prisma.campaign.findMany({
                skip: (page - 1) * count,
                take: count,
                where: {
                    ...(keyword ?
                        {
                            OR: [
                                { title: { contains: keyword, mode: 'insensitive' } },
                                { description: { contains: keyword, mode: 'insensitive' } }
                            ]
                        } : {}),
                    status: is_active ? 'active' : {}

                },
                select: {
                    id: true,
                    brand_name: true,
                    brand_logo: true,
                    img_banner: true,
                    title: true,
                    description: true,
                    platforms: true,
                    budget: true,
                    status: true,
                    end_at: true,
                    invitation_end_at: true
                },
                orderBy: {
                    start_at: 'desc',
                }
            });

            const apply_cmpgns = await prisma.campaign_Apply.findMany({
                where: {
                    user_id: Number(user_id)
                },
                select: {
                    cmpgn_id: true
                }
            });

            const apply_cmpgn_ids = apply_cmpgns.map(a => a.cmpgn_id);

            const campaigns = [];
            for (let i = 0; i < camps.length; i++) {
                let cmpgn = {
                    id: camps[i].id,
                    title: camps[i].title,
                    brand_name: camps[i].brand_name,
                    brand_logo: camps[i].brand_logo,
                    banner: camps[i].img_banner,
                    facebook: camps[i].platforms.includes('FB'),
                    instagram: camps[i].platforms.includes('IG'),
                    description: camps[i].description,
                    budget: camps[i].budget,
                    end_date: camps[i].end_at!.toISOString().split('T')[0],
                    invitation_ended: camps[i].invitation_end_at! < new Date() ? true : false,
                    status: camps[i].status,
                    is_applied: apply_cmpgn_ids.includes(camps[i].id)
                }
                campaigns.push(cmpgn);
            };


            res.json({
                status: true, message: "Query successfull", data:
                {
                    "totalItems": total,
                    "totalPages": Math.ceil(total / count),
                    "currentPage": page,
                    "itemsPerPage": count,
                    "campaigns": campaigns
                }
            });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/campaigns', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL']
          #swagger.security = [{
               "bearerAuth": []
          }] 
          #swagger.parameters['user_id'] = {
               in: 'query',
               description: 'sign-in user ID',
               required: true
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
          #swagger.parameters['status'] = {
               in: 'query',
               description: 'status of campaign, default to be \"all\"',
               required: false,
                schema: {
                     $ref: '#/components/schemas/kolCampaigns'
                 }
          }   
          #swagger.parameters['keyword'] = {
               in: 'query',
               description: 'search keyword in title or description',
               required: false
          } 
          #swagger.parameters['order_by'] = {
                in: 'query',
                description: 'the sorting column, default start-date, can be [budget, start-date, end-date]',
                required: false,
                schema: {
                     $ref: '#/components/schemas/sortingColumns'
                }
           }   
           #swagger.parameters['trend'] = {
                in: 'query',
                description: 'the sorting direction, default asc, can be [asc, desc]',
                required: false,
                schema: {
                     $ref: '#/components/schemas/sortingTrend'
                }
           }     
       */

        /**  Campaign_Apply status 
         *  pending:  waiting for brand to approve
         *  ongoing:  approved, post draft, post launched  
         *  expired:  credits received  
         * */
        const user_id = Number(req.query.user_id) || 0;
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 10;
        const keyword = req.query.keyword as string;
        const status = req.query.status as string || 'all';
        const order_by = req.query.order_by as string || 'budget';
        const trend = req.query.trend as string || 'desc';
        try {
            let total = 0;
            let applied: CampaignApply[] = [];

            switch (status) {
                case 'all':
                    total = await prisma.campaign_Apply.count({
                        where: {
                            user_id: user_id
                        },
                    });
                    applied = await prisma.campaign_Apply.findMany({
                        skip: (page - 1) * count,
                        take: count,
                        where: {
                            user_id: user_id
                        },
                        select: {
                            cmpgn_id: true,
                            apply_date: true,
                            status: true,
                            closed: true
                        }
                    });
                    break;
                case 'pending':
                    total = await prisma.campaign_Apply.count({
                        where: {
                            user_id: user_id,
                            status: {
                                equals: [1, 0, 0, 0, 0]
                            }
                        },
                    });
                    applied = await prisma.campaign_Apply.findMany({
                        skip: (page - 1) * count,
                        take: count,
                        where: {
                            user_id: user_id,
                            status: {
                                equals: [1, 0, 0, 0, 0]
                            }
                        },
                        select: {
                            cmpgn_id: true,
                            apply_date: true,
                            status: true,
                            closed: true
                        }
                    });
                    break;
                case 'ongoing':
                    total = await prisma.campaign_Apply.count({
                        where: {
                            user_id: user_id,
                            OR: [
                                {
                                    status: { equals: [1, 1, 0, 0, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 0, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 1, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 1, 1] }
                                }
                            ]
                        },
                    });
                    applied = await prisma.campaign_Apply.findMany({
                        skip: (page - 1) * count,
                        take: count,
                        where: {
                            user_id: user_id,
                            OR: [
                                {
                                    status: { equals: [1, 1, 0, 0, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 0, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 1, 0] }
                                },
                                {
                                    status: { equals: [1, 1, 1, 1, 1] }
                                }
                            ]
                        },
                        select: {
                            cmpgn_id: true,
                            apply_date: true,
                            status: true,
                            closed: true
                        }
                    });
                    break;
                case 'expired':
                    total = await prisma.campaign_Apply.count({
                        where: {
                            user_id: user_id,
                            closed: true
                        },
                    });
                    applied = await prisma.campaign_Apply.findMany({
                        skip: (page - 1) * count,
                        take: count,
                        where: {
                            user_id: user_id,
                            closed: true
                        },
                        select: {
                            cmpgn_id: true,
                            apply_date: true,
                            status: true,
                            closed: true
                        }
                    });
                    break;
                case 'declined':
                    total = await prisma.campaign_Apply.count({
                        where: {
                            user_id: user_id,
                            status: {
                                equals: [-1, 0, 0, 0, 0]
                            }
                        },
                    });
                    applied = await prisma.campaign_Apply.findMany({
                        skip: (page - 1) * count,
                        take: count,
                        where: {
                            user_id: user_id,
                            status: {
                                equals: [-1, 0, 0, 0, 0]
                            }
                        },
                        select: {
                            cmpgn_id: true,
                            apply_date: true,
                            status: true,
                            closed: true
                        }
                    });
                    break;
                default:
                    break;
            }

            const id_list = applied.map(c => c.cmpgn_id);

            const campaigns = await prisma.campaign.findMany({
                where: {
                    ...(keyword ?
                        {
                            OR: [
                                { title: { contains: keyword, mode: 'insensitive' } },
                                { description: { contains: keyword, mode: 'insensitive' } }
                            ]
                        } : {}),
                    id: { in: id_list }
                },
                select: {
                    id: true,
                    brand_name: true,
                    brand_logo: true,
                    img_banner: true,
                    title: true,
                    description: true,
                    budget: true,
                    start_at: true,
                    end_at: true
                },
                orderBy: [
                    (order_by === 'start-date') ? { start_at: trend === 'asc' ? 'asc' : 'desc' } : {},
                    (order_by === 'end-date') ? { end_at: trend === 'asc' ? 'asc' : 'desc' } : {},
                    (order_by === 'budget') ? { budget: trend === 'asc' ? 'asc' : 'desc' } : {},
                ]
            });

            const cmpgn_applied = [];
            for (let i = 0; i < campaigns.length; i++) {
                const sum = applied[i].status.reduce((a, b) => a + b, 0) as number;
                // console.log(`sum: ${sum}  closed: ${applied[i].closed}`);
                let state: string = '';

                if (sum >= 2 && !applied[i].closed) {
                    state = 'ongoing';
                } else if (sum >= 2 && applied[i].closed) {
                    state = 'expired';
                } else if (sum == 1) {
                    state = 'pending';
                } else if (sum < 0) {
                    state = 'declined';
                }
                // console.log(`state: ${state}`)

                let cmpgn = {
                    id: campaigns[i].id,
                    brand_name: campaigns[i].brand_name,
                    logo: campaigns[i].brand_logo,
                    banner: campaigns[i].img_banner,
                    title: campaigns[i].title,
                    description: campaigns[i].description,
                    budget: campaigns[i].budget,
                    status: state,
                    apply_date: applied[i].apply_date.toISOString().split('T')[0],
                    start_date: campaigns[i].start_at!.toISOString().split('T')[0],
                    end_date: campaigns[i].end_at!.toISOString().split('T')[0],
                }
                cmpgn_applied.push(cmpgn);
            };

            // const total = cmpgn_applied.length;
            res.json({
                status: true, message: "Query successfull", data:
                {
                    "totalItems": total,
                    "totalPages": Math.ceil(total / count),
                    "currentPage": page,
                    "itemsPerPage": count,
                    "campaigns": cmpgn_applied
                }
            });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/campaign/procedure', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
               #swagger.security = [{
                    "bearerAuth": []
               }] 
           #swagger.parameters['user_id'] = {
               in: 'query',
               description: 'the Influencer ID of the post',
               required: true
            }
           #swagger.parameters['campaign_id'] = {
               in: 'query',
               description: 'the Campaign ID',
               required: true
            }       
        */

        const user_id = req.query.user_id;
        const campaign_id = req.query.campaign_id;
        try {
            const postjob = await prisma.post_Job.findUniqueOrThrow({
                where: {
                    post_job_id: {
                        author_id: Number(user_id),
                        cmpgn_id: Number(campaign_id)
                    }
                },
                select: {
                    procedure: true
                }
            });

            res.json({ status: true, message: "Query successfull", data: { procedure: postjob.procedure } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.patch('/kols/profile/posts/select', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['KOL'] 
                   #swagger.security = [{
                        "bearerAuth": []
            }] 
            #swagger.requestBody = {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                    $ref: "#/components/schemas/kolPostSelected"
                                    }  
                    }
                }
            } 
        */
        const { posts_selected } = req.body;

        const postIds = (posts_selected as Array<number>)

        try {
            postIds.map(async p => {
                await prisma.platform_Post.update({
                    where: {
                        id: p
                    },
                    data: {
                        selected: true
                    }
                });
                console.log(`Platform_Post with ID ${p} selected`)
            });

            res.json({ status: true, message: "Query successfull", data: `posts with id ${postIds} updated` });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/kols/test', async (req, res) => {

        const applicants = await prisma.campaign_Apply.groupBy({
            by: ['cmpgn_id'],
            _count: {
                user_id: true
            }
        });

        applicants.map(n => {
            console.log(`${n.cmpgn_id}: ${n._count.user_id}`)
        })

        res.json({ status: true, message: "Query successfull", data: applicants });
    });

    // app.get('/kols/template', async (req, res) => {

    //     try {
    //     } catch (error) {
    //         console.error((error as Error).message);
    //         res.status(500).json({ status: false, message: (error as Error).message })
    //     }
    // });


};

