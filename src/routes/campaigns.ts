// API for Campaign
import { Express } from "express"
import { PrismaClient, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import TokenVerify from "../middlewares/token_verify";
import { title } from "process";

type DoDont = {
    id: number,
    type: number,
    request: string,
    img: string,
    camp_id: number
}
type ProdService = {
    id: number,
    type: number,    // 1: product, 0: service
    name: string,
    ref_url: string,
    value: number,
    remark: string,
    img: string,
    sponsored: boolean,
}

type Event = {
    id: number,
    title: string,
    event_date: string, // 2024-02-15
    event_time: string, // 18:10:30
    description: string,
    ref_url: string,
    img: string
}

type Influencer = {
    id: number,
    plat_code: string // e.g. YT, IG, FB   
    age_range: number[],
    follower_range: number[],
    pay_range: number[],
    kol_numbers: number,
    gender: string,       // e.g. M, F, N for No-Specific
    request: string
}

type Task = {
    id: number,
    plat_code: string, // e.g. YT, IG, FB   
    post_type: string,   // e.g. story, video, blog ....  
    submit_date: string, // 2024-02-15
    submit_time: string, // 18:10:30
    quantity: number,
    brand_mention: string,
    brand_hashtag: string,
    campaign_hashtag: string,
    suggest_content: string,
    post_request: string,
    img: string,
}

type KolInvite = {
    profile_id: number,
    platform_code: string,
    follower_count: number
}

export default (app: Express, prisma: PrismaClient) => {

    // step-1
    app.post('/campaigns/create/objective', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
        */
        /* #swagger.requestBody = {
                   required: true,
                   content: {
                       "application/json": {
                           schema: {
                               $ref: "#/components/schemas/campaignObjective"
                           }  
                       }
                   }
               } 
        */
        const {
            campaign_id, platforms, region, interests, objectives, creator_id
        } = req.body;

        try {
            const campaign = await prisma.campaign.upsert({
                where: {
                    id: campaign_id || 0
                },
                update: { platforms, region, interests, objectives, creator_id },
                create: { platforms, region, interests, objectives, creator_id }
            });

            res.json({ status: true, message: "Campaign creation step: Objectives successfull", data: { campaign_id: campaign.id } });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message });
        }
    });

    // step-2
    app.post('/campaigns/create/basic-info', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
           "bearerAuth": []
            }] 
       */
        /* #swagger.requestBody = {
                          required: true,
                          content: {
                              "application/json": {
                                  schema: {
                                      $ref: "#/components/schemas/campaignBasicInfo"
                                  }  
                              }
                          }
                      } 
        */
        const {
            campaign_id, img_banner, title, tagline, description, budget,
            start_at, end_at, invitation_end_at, brand_name, brand_logo, creator_id
        } = req.body;

        try {
            const campaign = await prisma.campaign.upsert({
                where: {
                    id: campaign_id || 0
                },
                update: {
                    img_banner, title, tagline, description, budget, brand_name, brand_logo,
                    start_at: new Date(start_at).toISOString(),
                    end_at: new Date(end_at).toISOString(),
                    invitation_end_at: new Date(invitation_end_at).toISOString(),
                    creator_id
                },
                create: {
                    img_banner, title, tagline, description, budget, brand_name, brand_logo,
                    start_at: new Date(start_at).toISOString(),
                    end_at: new Date(end_at).toISOString(),
                    invitation_end_at: new Date(invitation_end_at).toISOString(),
                    creator_id
                }
            });

            res.json({ status: true, message: "Campaign creation step:Basic Info successfull", data: { campaign_id: campaign.id } });
        } catch (error) {
            console.error((error as Error).message);
            if (error instanceof Prisma.PrismaClientValidationError) {
                res.status(500).json({ status: false, message: (error as Error).message.split("\n\n").slice(-1) });
            } else {
                res.status(500).json({ status: false, message: (error as Error).message });
            }
        }
    });

    // step-3
    app.post('/campaigns/create/product', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
           "bearerAuth": []
            }] 
        */
        /* #swagger.requestBody = {
                   required: true,
                   content: {
                       "application/json": {
                           schema: {
                               $ref: "#/components/schemas/campaignProduct"
                           }  
                       }
                   }
               } 
        */
        const { campaign_id, required, products } = req.body;

        if (required) {
            // delete the removal
            const existed = await prisma.campaign_Product.findMany({
                select: {
                    id: true
                },
                where: {
                    camp_id: campaign_id
                }
            });

            const current = (products as Array<ProdService>).map(p => p.id);
            const removal = existed.filter(e => !current.includes(e.id));
            // console.log(`=========> removal ${JSON.stringify(removal)}`);
            removal.map(async (p) => {
                await prisma.campaign_Product.delete({
                    where: {
                        id: p.id
                    }
                });
            });

            // then, update or insert 
            (products as Array<ProdService>).map(async (v) => {
                try {
                    await prisma.campaign_Product.upsert({
                        where: {
                            id: v.id || 0
                        },
                        update: {
                            type: v.type,
                            name: v.name,
                            ref_url: v.ref_url,
                            remark: v.remark,
                            value: v.value,
                            sponsored: v.sponsored,
                            img: v.img,
                            camp_id: campaign_id
                        },
                        create: {
                            type: v.type,
                            name: v.name,
                            ref_url: v.ref_url,
                            remark: v.remark,
                            value: v.value,
                            sponsored: v.sponsored,
                            img: v.img,
                            camp_id: campaign_id
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

            res.json({ status: true, message: "Campaign creation step: Product/Service successfull", data: { campaign_id: campaign_id } });

        } else {
            res.json({ status: true, message: "Campaign creation step: No Product/Service required.", data: { campaign_id: campaign_id } });
        }
    });

    // step-4
    app.post('/campaigns/create/event', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
        */
        /* #swagger.requestBody = {
                          required: true,
                          content: {
                              "application/json": {
                                  schema: {
                                      $ref: "#/components/schemas/campaignEvent"
                                  }  
                              }
                          }
                      } 
        */
        const { campaign_id, required, events } = req.body;

        if (required) {
            // delete the removal
            const existed = await prisma.campaign_Event.findMany({
                select: {
                    id: true
                },
                where: {
                    camp_id: campaign_id
                }
            });

            const current = (events as Array<Event>).map(e => e.id);
            const removal = existed.filter(e => !current.includes(e.id));
            // console.log(`=========> removal ${JSON.stringify(removal)}`);
            removal.map(async (e) => {
                await prisma.campaign_Event.delete({
                    where: {
                        id: e.id
                    }
                });
            });

            // then, update or insert 
            (events as Array<Event>).map(async (v) => {
                try {
                    await prisma.campaign_Event.upsert({
                        where: {
                            id: v.id || 0
                        },
                        update: {
                            title: v.title,
                            event_date: new Date(`${v.event_date} ${v.event_time}`).toISOString(),
                            description: v.description,
                            img: v.img,
                            ref_url: v.ref_url,
                            camp_id: campaign_id
                        },
                        create: {
                            title: v.title,
                            event_date: new Date(`${v.event_date} ${v.event_time}`).toISOString(),
                            description: v.description,
                            img: v.img,
                            ref_url: v.ref_url,
                            camp_id: campaign_id
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

            res.json({ status: true, message: "Campaign creation step: Events successfull", data: { campaign_id: campaign_id } });
        } else {
            res.json({ status: true, message: "Campaign creation step: No Events required.", data: { campaign_id: campaign_id } });
        }
    });

    // step-5
    app.post('/campaigns/create/influencer', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
        */
        /* #swagger.requestBody = {
                         required: true,
                         content: {
                             "application/json": {
                                 schema: {
                                     $ref: "#/components/schemas/campaignInfluencer"
                                 }  
                             }
                         }
                     } 
        */
        const { campaign_id, kol_types } = req.body;

        // delete the removal
        const existed = await prisma.campaign_KOL_Type.findMany({
            select: {
                id: true
            },
            where: {
                camp_id: campaign_id
            }
        });

        const current = (kol_types as Array<Influencer>).map(k => k.id);
        const removal = existed.filter(e => !current.includes(e.id));
        // console.log(`=========> removal ${JSON.stringify(removal)}`);
        removal.map(async (k) => {
            await prisma.campaign_KOL_Type.delete({
                where: {
                    id: k.id
                }
            });
        });

        // then, update or insert 
        (kol_types as Array<Influencer>).map(async (v) => {
            try {
                await prisma.campaign_KOL_Type.upsert({
                    where: {
                        id: v.id || 0
                    },
                    update: {
                        age_range: v.age_range,
                        follower_range: v.follower_range,
                        gender: v.gender,
                        kol_numbers: v.kol_numbers,
                        pay_range: v.pay_range,
                        plat_code: v.plat_code,
                        request: v.request,
                        camp_id: campaign_id
                    },
                    create: {
                        age_range: v.age_range,
                        follower_range: v.follower_range,
                        gender: v.gender,
                        kol_numbers: v.kol_numbers,
                        pay_range: v.pay_range,
                        plat_code: v.plat_code,
                        request: v.request,
                        camp_id: campaign_id
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
        res.json({ status: true, message: "Campaign creation step: Influencers successfull", data: { campaign_id: campaign_id } });
    });

    // step-6
    app.post('/campaigns/create/task', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
           "bearerAuth": []
            }] 
       */
        /* #swagger.requestBody = {
                                 required: true,
                                 content: {
                                     "application/json": {
                                         schema: {
                                             $ref: "#/components/schemas/campaignTask"
                                         }  
                                     }
                                 }
                             } 
        */
        const { campaign_id, tasks } = req.body;
        // delete the removal
        const existed = await prisma.campaign_Task.findMany({
            select: {
                id: true
            },
            where: {
                camp_id: campaign_id
            }
        });

        const current = (tasks as Array<Task>).map(t => t.id);
        const removal = existed.filter(e => !current.includes(e.id));
        // console.log(`=========> removal ${JSON.stringify(removal)}`);
        removal.map(async (t) => {
            await prisma.campaign_Task.delete({
                where: {
                    id: t.id
                }
            });
        });

        // then, update or insert 
        (tasks as Array<Task>).map(async (v) => {
            try {
                await prisma.campaign_Task.upsert({
                    where: {
                        id: v.id || 0
                    },
                    update: {
                        brand_hashtag: v.brand_hashtag,
                        brand_mention: v.brand_mention,
                        campaign_hashtag: v.campaign_hashtag,
                        img: v.img,
                        plat_code: v.plat_code,
                        post_request: v.post_request,
                        post_type: v.post_type,
                        quantity: v.quantity,
                        submit_date: new Date(`${v.submit_date} ${v.submit_time}`).toISOString(),
                        suggest_content: v.suggest_content,
                        camp_id: campaign_id
                    },
                    create: {
                        brand_hashtag: v.brand_hashtag,
                        brand_mention: v.brand_mention,
                        campaign_hashtag: v.campaign_hashtag,
                        img: v.img,
                        plat_code: v.plat_code,
                        post_request: v.post_request,
                        post_type: v.post_type,
                        quantity: v.quantity,
                        submit_date: new Date(`${v.submit_date} ${v.submit_time}`).toISOString(),
                        suggest_content: v.suggest_content,
                        camp_id: campaign_id
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

        res.json({ status: true, message: "Campaign creation step: Tasks successfull", data: { campaign_id: campaign_id } });
    });

    // step-7
    app.post('/campaigns/create/dodont', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
           "bearerAuth": []
            }] 
       */
        /* #swagger.requestBody = {
                                        required: true,
                                        content: {
                                            "application/json": {
                                                schema: {
                                                    $ref: "#/components/schemas/campaignDoDont"
                                                }  
                                            }
                                        }
                                    } 
        */
        const { campaign_id, dodonts } = req.body;
        // delete the removal
        const existed = await prisma.campaign_Dos_Donts.findMany({
            select: {
                id: true
            },
            where: {
                camp_id: campaign_id
            }
        });

        const current = (dodonts as Array<DoDont>).map(d => d.id);
        const removal = existed.filter(e => !current.includes(e.id));
        // console.log(`=========> removal ${JSON.stringify(removal)}`);
        removal.map(async (d) => {
            await prisma.campaign_Dos_Donts.delete({
                where: {
                    id: d.id
                }
            });
        });

        // then, update or insert                             
        (dodonts as Array<DoDont>).map(async (v) => {
            try {
                await prisma.campaign_Dos_Donts.upsert({
                    where: {
                        id: v.id || 0
                    },
                    update: {
                        type: v.type,
                        request: v.request,
                        img: v.img,
                        camp_id: campaign_id
                    },
                    create: {
                        type: v.type,
                        request: v.request,
                        img: v.img,
                        camp_id: campaign_id
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

        res.json({ status: true, message: "Campaign creation step: DosDonts successfull", data: { campaign_id: campaign_id } });
    });

    // step-8
    app.post('/campaigns/create/kol-invite', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign'] */
        /* #swagger.security = [{
            "bearerAuth": []
            }] 
       */
        /* #swagger.requestBody = {
                                        required: true,
                                        content: {
                                            "application/json": {
                                                schema: {
                                                    $ref: "#/components/schemas/campaignInfluencerInvite"
                                                }  
                                            }
                                        }
                                    } 
        */

        const { campaign_id, kolinvites } = req.body;
        // delete the removal
        const existed = await prisma.campaign_KOL_Invitation.findMany({
            select: {
                camp_id: true,
                profile_id: true
            },
            where: {
                camp_id: Number(campaign_id)
            }
        });

        const current = (kolinvites as Array<KolInvite>).map(k => k.profile_id);
        const removal = existed.filter(e => !current.includes(e.profile_id));
        // console.log(`=========> removal ${JSON.stringify(removal)}`);
        removal.map(async (k) => {
            await prisma.campaign_KOL_Invitation.delete({
                where: {
                    invitation_id: {
                        camp_id: k.camp_id,
                        profile_id: k.profile_id
                    }
                }
            });
        });

        // then, update or insert     
        (kolinvites as Array<KolInvite>).map(async (v) => {
            try {
                await prisma.campaign_KOL_Invitation.upsert({
                    where: {
                        invitation_id: {
                            camp_id: Number(campaign_id),
                            profile_id: v.profile_id
                        }
                    },
                    update: {
                        camp_id: Number(campaign_id),
                        profile_id: v.profile_id,
                        plat_code: v.platform_code,
                        followers_count: v.follower_count
                    },
                    create: {
                        camp_id: Number(campaign_id),
                        profile_id: v.profile_id,
                        plat_code: v.platform_code,
                        followers_count: v.follower_count
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

        res.json({ status: true, message: "Campaign creation step: Influencers invitation successfull", data: { campaign_id: campaign_id } });
    });

    app.patch('/campaigns/review/:id', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign']
           #swagger.security = [{
                "bearerAuth": []
          }] */

        const { id } = req.params;
        try {
            await prisma.campaign.update({
                where: {
                    id: Number(id)
                },
                data: {
                    terms_accepted: true,
                    status: 'active'
                }
            });

            res.json({ status: true, message: "Campaign creation reviewed successfull", data: { campaign_id: id, status: "pending" } });
        } catch (error) {
            console.error((error as Error).message);
            if (error instanceof Prisma.PrismaClientValidationError) {
                res.status(500).json({ status: false, message: (error as Error).message.split("\n\n").slice(-1) });
            } else {
                res.status(500).json({ status: false, message: (error as Error).message });
            }
        }


    });

    app.get('/campaigns/postjob', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Campaign'] 
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
                    content: true,
                    description: true,
                    photos: true,
                    comment_1: true,
                    comment_2: true,
                    updated_at: true
                }
            });

            const profile = await prisma.kOL_Profile.findUniqueOrThrow({
                where: {
                    user_id: Number(user_id)
                },
                select: {
                    stage_name: true,
                    img: true
                }
            });

            let post = {
                author_avatar: profile?.img,
                author: profile?.stage_name,
                title: postjob.description,
                content: postjob?.content,
                content_comment: postjob?.comment_1,
                photos: postjob?.photos,
                photo_comment: postjob?.comment_2,
                post_date: postjob?.updated_at.toISOString().split('T')[0]
            }

            res.json({ status: true, message: "Query successfull", data: post });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/campaigns/postdrafts', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Campaign']
           #swagger.security = [{
                "bearerAuth": []
           }] 
           #swagger.parameters['campaign_id'] = {
                 in: 'query',
                 description: 'the Campaign ID',
                 required: true
            }
        #swagger.parameters['approved'] = {
                 in: 'query',
                 description: 'the post draft already approved or not, which default to be false',
                 required: false
            }   
        #swagger.parameters['launched'] = {
                 in: 'query',
                 description: 'the post draft already launched or not, which default to be false',
                 required: false
            }      
        */
        const campaign_id = req.query.campaign_id;
        const is_approved = req.query.approved as string || 'false';
        const is_launched = req.query.launched as string || 'false';


        try {
            const pdrafts = await prisma.post_Job.findMany({
                where: {
                    cmpgn_id: Number(campaign_id),
                    approved: Boolean(JSON.parse(is_approved)),
                    launched: Boolean(JSON.parse(is_launched)),
                    // procedure: {
                    //     equals: [1, 1, 1, 0, 0, 0]
                    // }
                },
                select: {
                    cmpgn_id: true,
                    author_id: true,
                    description: true,
                    content: true,
                    photos: true,
                    updated_at: true
                }
            });
            console.log(pdrafts);

            const userIds: number[] = pdrafts.map(p => p.author_id);
            console.log(userIds);
            const kol_profile = await prisma.kOL_Profile.findMany({
                where: {
                    user_id: { in: userIds }
                },
                select: {
                    stage_name: true,
                    img: true
                }
            })
            console.log(kol_profile);
            const post_drafts = [];

            for (let i = 0; i < pdrafts.length; i++) {
                let draft: Record<string, any> = {};
                draft.campaign_id = pdrafts[i].cmpgn_id;
                draft.author_id = pdrafts[i].author_id;
                draft.title = pdrafts[i].description;
                draft.content = pdrafts[i].content;
                draft.photos = pdrafts[i].photos;
                draft.post_date = pdrafts[i].updated_at.toISOString().split('T')[0];
                draft.author = kol_profile[i].stage_name;
                draft.avatar = kol_profile[i].img;
                post_drafts.push(draft);
            }

            res.json({ status: true, message: "Query successfull", data: post_drafts });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/campaigns/item-count', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Campaign']
           #swagger.security = [{
                "bearerAuth": []
           }] 
           #swagger.parameters['user_id'] = {
                in: 'query',
                description: 'sign-in user ID',
                required: true
           }      
        */

        const user_id = Number(req.query.user_id) || 0;

        const draft_total = await prisma.campaign.count({
            where: {
                creator_id: user_id,
                status: 'draft'
            },
        });

        const active_total = await prisma.campaign.count({
            where: {
                creator_id: user_id,
                status: 'active'
            },
        });

        const susp_total = await prisma.campaign.count({
            where: {
                creator_id: user_id,
                status: 'suspending'
            },
        });

        const archive_total = await prisma.campaign.count({
            where: {
                creator_id: user_id,
                status: 'archived'
            },
        });

        const total = draft_total + active_total + susp_total + archive_total;
        res.json({
            status: true, message: "Query successfull", data:
            {
                "total": total,
                "drafts": draft_total,
                "actives": active_total,
                "suspendings": susp_total,
                "archiveds": archive_total
            }
        });
    });

    app.get('/campaigns', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Campaign']
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
           #swagger.parameters['keyword'] = {
                in: 'query',
                description: 'search keyword in title or description',
                required: false
           }   
           #swagger.parameters['status'] = {
                in: 'query',
                description: 'the status tab slected, default all, can be [draft, active, suspending, archived]',
                required: false,
                schema: {
                     $ref: '#/components/schemas/campaignStatus'
                }
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
        const user_id = Number(req.query.user_id) || 0;
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 10;
        const keyword = req.query.keyword as string;
        const status = req.query.status as string;
        const order_by = req.query.order_by as string || 'budget';
        const trend = req.query.trend as string || 'desc';


        const total = await prisma.campaign.count({
            where: {
                ...(keyword ?
                    {
                        OR: [
                            { title: { contains: keyword, mode: 'insensitive' } },
                            { description: { contains: keyword, mode: 'insensitive' } }
                        ]
                    } : {}),
                AND: {
                    status: status ? status : {},
                    creator_id: user_id
                }
            },
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
                AND: {
                    status: status ? status : {},
                    creator_id: user_id
                }
            },
            select: {
                id: true,
                title: true,
                description: true,
                budget: true,
                status: true,
                start_at: true,
                end_at: true,
                applicants: true
            },
            orderBy: [
                (order_by === 'start-date') ? { start_at: trend === 'asc' ? 'asc' : 'desc' } : {},
                (order_by === 'end-date') ? { end_at: trend === 'asc' ? 'asc' : 'desc' } : {},
                (order_by === 'budget') ? { budget: trend === 'asc' ? 'asc' : 'desc' } : {},
            ]
        });

        // const applicants = await prisma.campaign_Apply.groupBy({
        //     by: ['cmpgn_id'],
        //     _count: {
        //         user_id: true
        //     }
        // });

        // let cmpgn: Record<string, any> = {};
        // const campaigns = camps.map(c => {
        //     cmpgn = { ...c };
        //     cmpgn.applicants = 0;
        //     applicants.map(a => {
        //         if (a.cmpgn_id == c.id) cmpgn.applicants = a._count.user_id
        //     });
        //     return cmpgn;
        // });

        res.json({
            status: true, message: "Query successfull", data:
            {
                "totalItems": total,
                "totalPages": Math.ceil(total / count),
                "currentPage": page,
                "itemsPerPage": count,
                "campaigns": camps
            }
        });
    });

    app.get('/campaigns/:campaign_id', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign']
           #swagger.security = [{
                "bearerAuth": []
          }] 
            #swagger.parameters['campaign_id'] = {
                description: 'the Campaign ID to query',
                required: true
           }   
        */
        const { campaign_id } = req.params;
        try {
            const campaign = await prisma.campaign.findUnique({
                where: {
                    id: Number(campaign_id)
                }, include: {
                    kol_types: true,
                    products: true,
                    events: true,
                    tasks: true,
                    dos_donts: true,
                    // kol_invitations: true,
                    // creator: true
                },
            });

            if (!campaign) throw new Error(`No such Campaign by ID ${campaign_id}`)

            const kol_invites = await prisma.campaign_KOL_Invitation.findMany({
                select: {
                    profile_id: true,
                    kol_profile: {
                        select: {
                            stage_name: true,
                            style_type: true,
                            img: true,
                        }
                    },
                    plat_code: true,
                    followers_count: true
                },
                where: {
                    camp_id: Number(campaign_id)
                }
            });

            let kivt: Record<string, any> = {};
            const kivts = kol_invites.map(k => {
                kivt = { ...k };
                kivt.img = k.kol_profile.img;
                const stname = k.kol_profile.stage_name;
                const sttype = k.kol_profile.style_type;
                kivt.stage_name = stname;
                kivt.style_type = sttype;
                delete kivt.kol_profile;
                return kivt;
            });

            let evt: Record<string, any> = {};
            const events = campaign.events.map(e => {
                evt = { ...e };
                const date = evt.event_date.toISOString().split('T')[0];
                const time = evt.event_date.toISOString().split('T')[1].split('.')[0];
                delete evt.event_date;
                evt.event_date = date;
                evt.event_time = time;
                return evt;
            });

            let tsk: Record<string, any> = {};
            const tasks = campaign?.tasks.map(t => {
                tsk = { ...t };
                const date = tsk.submit_date.toISOString().split('T')[0];
                const time = tsk.submit_date.toISOString().split('T')[1].split('.')[0];
                delete tsk.submit_date;
                tsk.submit_date = date;
                tsk.submit_time = time;
                return tsk;
            });

            const campaign_data = {
                campaign_id: campaign.id,
                objectives: {
                    platforms: campaign.platforms,
                    region: campaign.region,
                    interests: campaign.interests,
                    objectives: campaign.objectives
                },
                basicinfo: {
                    title: campaign.title,
                    banner: campaign.img_banner,
                    tagline: campaign.tagline,
                    description: campaign.description,
                    budget: campaign.budget,
                    start_at: campaign.start_at?.toISOString().split('T')[0],
                    end_at: campaign.end_at?.toISOString().split('T')[0],
                    invite_end_at: campaign.invitation_end_at?.toISOString().split('T')[0],
                    brand_logo: campaign.brand_logo,
                    brand_name: campaign.brand_name
                },
                products: {
                    required: campaign.products.length == 0 ? false : true,
                    data: campaign.products
                },
                events: {
                    required: campaign.events.length == 0 ? false : true,
                    data: events
                },
                kol_types: campaign.kol_types,
                tasks: tasks,
                dos_donts: campaign.dos_donts,
                kol_invites: kivts
            }

            res.json({ status: true, message: "Query successfull", data: campaign_data || "no such campaign" });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/campaigns/:campaign_id/:step', TokenVerify, async (req: Request, res: Response) => {
        /* #swagger.tags = ['Campaign']
           #swagger.security = [{
               "bearerAuth": []
           }] 
           #swagger.parameters['campaign_id'] = {
                description: 'the Campaign ID to query',
                required: true
           }  
           #swagger.parameters['step'] = {
               description: 'name of steps, valid values are \"objectives\", \"basicinfo\", \"koltypes\", \"products\", \"events\", \"tasks\", \"dosdonts\", \"kolinvites\" ',
               required: true
            } 
      */
        const { campaign_id, step } = req.params;
        console.log(`${campaign_id} || ${step}`)
        const steps = ['objectives', 'basicinfo', 'koltypes', 'products', 'events', 'tasks', 'dosdonts', 'kolinvites'];
        try {
            if (!steps.includes(step)) throw new Error(`${step} not in valid steps, which are [${steps}]`);

            const campaign = await prisma.campaign.findUnique({
                where: {
                    id: Number(campaign_id)
                },
                select: {
                    /** -- objectives ---------------------------------------------**/
                    platforms: step == 'objectives' ? true : false,
                    region: step == 'objectives' ? true : false,
                    interests: step == 'objectives' ? true : false,
                    objectives: step == 'objectives' ? true : false,
                    /** -- basicinfo ---------------------------------------------**/
                    title: step == 'basicinfo' ? true : false,
                    img_banner: step == 'basicinfo' ? true : false,
                    tagline: step == 'basicinfo' ? true : false,
                    description: step == 'basicinfo' ? true : false,
                    budget: step == 'basicinfo' ? true : false,
                    start_at: step == 'basicinfo' ? true : false,
                    end_at: step == 'basicinfo' ? true : false,
                    invitation_end_at: step == 'basicinfo' ? true : false,
                    brand_logo: step == 'basicinfo' ? true : false,
                    brand_name: step == 'basicinfo' ? true : false,
                    /** -- other relations ---------------------------------------------**/
                    kol_types: step == 'koltypes' ? true : false,
                    products: step == 'products' ? true : false,
                    events: step == 'events' ? true : false,
                    tasks: step == 'tasks' ? true : false,
                    dos_donts: step == 'dosdonts' ? true : false,
                    kol_invitations: step == 'kolinvites' ? true : false,
                }
            });

            let step_data: Record<string, any> = {
                campaign_id: campaign_id,
            };

            if (step == 'kolinvites') {
                const kol_invites = await prisma.campaign_KOL_Invitation.findMany({
                    select: {
                        profile_id: true,
                        kol_profile: {
                            select: {
                                stage_name: true,
                                style_type: true,
                                img: true,
                                // platforms: {
                                //     select: {
                                //         plat_code: true,
                                //         followers_count: true
                                //     }
                                // }
                            }
                        },
                        plat_code: true,
                        followers_count: true
                    },
                    where: {
                        camp_id: Number(campaign_id)
                    }
                });
                let kivt: Record<string, any> = {};
                const kivts = kol_invites.map(k => {
                    kivt = { ...k };
                    kivt.img = k.kol_profile.img;
                    const stname = k.kol_profile.stage_name;
                    const sttype = k.kol_profile.style_type;
                    kivt.stage_name = stname;
                    kivt.style_type = sttype;
                    delete kivt.kol_profile;
                    // console.log(kivt);
                    return kivt;
                });
                step_data['kol_invites'] = kivts;
                // step_data[step] = kol_invites;
            } else if (step == 'basicinfo') {
                let info: Record<string, any> = {};
                step_data[step] = { ...campaign };
                step_data[step].start_at = campaign?.start_at?.toISOString().split('T')[0];
                step_data[step].end_at = campaign?.end_at?.toISOString().split('T')[0];
                step_data[step].invitation_end_at = campaign?.invitation_end_at?.toISOString().split('T')[0];
            } else if (step == 'events') {
                let evt: Record<string, any> = {};
                const evts = campaign?.events.map(e => {
                    evt = { ...e };
                    const date = evt.event_date.toISOString().split('T')[0];
                    const time = evt.event_date.toISOString().split('T')[1].split('.')[0];
                    delete evt.event_date;
                    evt.event_date = date;
                    evt.event_time = time;
                    return evt;
                });
                step_data.required = evts?.length ? true : false;
                step_data[step] = evts;
            } else if (step == 'tasks') {
                let tsk: Record<string, any> = {};
                const tsks = campaign?.tasks.map(t => {
                    tsk = { ...t };
                    const date = tsk.submit_date.toISOString().split('T')[0];
                    const time = tsk.submit_date.toISOString().split('T')[1].split('.')[0];
                    delete tsk.submit_date;
                    tsk.submit_date = date;
                    tsk.submit_time = time;
                    return tsk;
                });
                step_data[step] = tsks;
            } else if (step == 'objectives') {
                step_data[step] = { ...campaign };

            } else if (step == 'products') {
                step_data.required = campaign?.products.length ? true : false;
                step_data = { ...step_data, ...campaign };
            } else {
                step_data = { ...step_data, ...campaign };
            }

            res.json({ status: true, message: "Query successfull", data: step_data });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });


    // app.get('/campaigns/keyword/:keyword', TokenVerify, async (req, res) => {
    //     /* #swagger.tags = ['Campaign']
    //        #swagger.security = [{
    //             "bearerAuth": []
    //        }] */

    //     try {
    //         const { keyword } = req.params;
    //         const user_id = Number(req.query.user_id) || 0;
    //         const page = Number(req.query.page) || 1;
    //         const count = Number(req.query.count) || 10;
    //         if (!keyword) throw new Error(`query keyword is empty`);

    //         const camps = await prisma.campaign.findMany({
    //             skip: (page - 1) * count,
    //             take: count,
    //             where: {
    //                 OR: [
    //                     { title: { contains: String(keyword) } },
    //                     { description: { contains: String(keyword) } }
    //                 ],
    //                 AND: {
    //                     creator_id: user_id
    //                 }
    //             },
    //             select: {
    //                 id: true,
    //                 title: true,
    //                 description: true,
    //                 budget: true,
    //                 status: true,
    //                 start_at: true,
    //                 end_at: true
    //             },
    //             orderBy: {
    //                 start_at: 'asc',
    //             }
    //         });

    //         const drafts = camps.filter(c => c.status == 'draft');
    //         const actives = camps.filter(c => c.status == 'active');
    //         const suspendings = camps.filter(c => c.status == 'suspending');
    //         const archiveds = camps.filter(c => c.status == 'archived');

    //         res.json({
    //             status: true, message: "Query successfull", data: {
    //                 "totalItems": camps.length,
    //                 "totalPages": Math.ceil(camps.length / count),
    //                 "currentPage": page,
    //                 "itemsPerPage": count,
    //                 "all": { "count": camps.length, "campaigns": camps },
    //                 "draft": { "count": drafts.length, "campaigns": drafts },
    //                 "active": { "count": actives.length, "campaigns": actives },
    //                 "suspending": { "count": suspendings.length, "campaigns": suspendings },
    //                 "archived": { "count": archiveds.length, "campaigns": archiveds }
    //             }
    //         });

    //     } catch (error) {
    //         console.error((error as Error).message);
    //         res.status(500).json({ status: false, message: (error as Error).message });
    //     }
    // });

    // app.post('/campaigns/create', async (req: Request, res: Response) => {
    //     /* #swagger.tags = ['Campaign']
    //       #swagger.security = [{
    //               "bearerAuth": []
    //       }] */
    //     const {
    //         id, brand_name, brand_logo, objectives, platforms, interests, type, status, budget,
    //         start_at, end_at, invitation_end_at, title, description, tagline, img_banner,
    //         attention_needed, region, creator_id, dodonts
    //     } = req.body;

    //     try {
    //         if (id) { // update 
    //             console.log('update Campaign');
    //             const result = await prisma.campaign.update({
    //                 where: {
    //                     id: id
    //                 },
    //                 data: {
    //                     brand_name, brand_logo, objectives, platforms, interests, type, status, budget,
    //                     title, description, tagline, img_banner,
    //                     attention_needed, region, creator_id,
    //                     start_at: new Date(start_at).toISOString(),
    //                     end_at: new Date(end_at).toISOString(),
    //                     invitation_end_at: new Date(invitation_end_at).toISOString()
    //                 }
    //             });

    //             await prisma.campaign_Dos_Donts.deleteMany({
    //                 where: {
    //                     camp_id: id
    //                 }
    //             });

    //             const ddnt = (dodonts as Array<DoDont>).map(v => { return { ...v, camp_id: id } });
    //             console.log(ddnt)
    //             await prisma.campaign_Dos_Donts.createMany({
    //                 data: ddnt

    //             });

    //             res.json({ status: true, message: "Campaign updated successfull", data: "" });
    //         } else {  // create

    //             const campaign = await prisma.campaign.create({
    //                 data: {
    //                     brand_name, brand_logo, objectives, platforms, interests, type, status, budget,
    //                     title, description, tagline, img_banner,
    //                     attention_needed, region, creator_id,
    //                     start_at: new Date(start_at).toISOString(),
    //                     end_at: new Date(end_at).toISOString(),
    //                     invitation_end_at: new Date(invitation_end_at).toISOString(),
    //                     dos_donts: {
    //                         createMany: {
    //                             data: dodonts
    //                         }
    //                     }
    //                 },
    //             });
    //             res.json({ status: true, message: "Campaign created successfull", data: { campaign_id: campaign.id } });
    //         }
    //         // res.json({ status: true, message: "Campaign created successfull", data: campaign.id });
    //         // res.json({ status: true, message: "Campaign created successfull" });

    //     } catch (error) {
    //         console.error((error as Error).message);

    //         res.status(500).json({ status: false, message: (error as Error).message || error }
    //         )
    //     }

    // });


}