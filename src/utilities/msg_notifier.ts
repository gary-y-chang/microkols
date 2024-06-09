import EventEmitter from "events";
import { PrismaClient } from "@prisma/client";
import { client_scokets } from "./websocket_service";

enum EventsToBrand {
    CAMPAIGN_APPLY_NEW = 'campaign_apply_new',
    POST_DRAFT_SUBMISSION = 'post_draft_submission',
    POST_LAUNCH = 'post_launch',
}

enum EventsToKOL {
    CAMPAIGN_POST_REVIEW = 'campaign_post_review',
    CAMPAIGN_POST_APPROVAL = 'campaign_post_approval',
    CAMPAIGN_APPLY_APPROVAL = 'campaign_apply_approval',
}

const MessageNotifier = new EventEmitter();

MessageNotifier.on('NOTIFY_EVENT', async (user_id, campaign_id, event_name, prisma: PrismaClient) => {
    console.log(`event name notified: ${event_name}`);
    let notifications = [];
    try {
        if (Object.values(EventsToKOL).includes(event_name)) {
            const camp = await prisma.campaign.findUnique({
                where: {
                    id: Number(campaign_id)
                },
                select: {
                    title: true,
                    brand_name: true,
                    brand_logo: true
                }
            });

            let note_message = '';

            if (event_name == EventsToKOL.CAMPAIGN_APPLY_APPROVAL) {
                note_message = `Congrats! You are selected by the campaign (${camp?.title}) ! Draft your content now!`;
            } else if (event_name == EventsToKOL.CAMPAIGN_POST_REVIEW) {
                note_message = `Brand of Campaign (${camp?.title}) has some comments on your post content. Please try agian !`;
            } else if (event_name == EventsToKOL.CAMPAIGN_POST_APPROVAL) {
                note_message = `Congrats! Your post content of Campaign (${camp?.title}) is approved to launch.!`;
            }
            // console.log(note_message);
            const note = await prisma.notification.create({
                data: {
                    receiver_id: Number(user_id),
                    sender_name: camp?.brand_name || 'Brand Owner',
                    sender_icon: camp?.brand_logo || 'https://storage.googleapis.com/staging.starnet-dev.appspot.com/brand-logo/k8s.png',
                    message: note_message,
                }
            });
            // console.log(note);
            notifications.push(note);
        } else if (Object.values(EventsToBrand).includes(event_name)) {
            const camp = await prisma.campaign.findUnique({
                where: {
                    id: Number(campaign_id)
                },
                select: {
                    title: true,
                    creator_id: true
                }
            });
            const kol_profile = await prisma.kOL_Profile.findUnique({
                where: {
                    user_id: Number(user_id)
                },
                select: {
                    stage_name: true,
                    img: true,
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });
            let note_message = '';

            if (event_name == EventsToBrand.CAMPAIGN_APPLY_NEW) {
                note_message = `Your campaign (${camp?.title}) has a new applicant ${kol_profile?.stage_name || kol_profile!.user.name}.`;
            } else if (event_name == EventsToBrand.POST_DRAFT_SUBMISSION) {
                note_message = `Your have received 1 draft post from ${kol_profile?.stage_name || kol_profile!.user.name}. Review now and leave comment to influencers!`;
            } else if (event_name == EventsToBrand.POST_LAUNCH) {
                note_message = `Your campaign (${camp?.title}) has 1 post launched. Congrats!`;
            }
            // console.log(note_message);
            const note = await prisma.notification.create({
                data: {
                    receiver_id: Number(camp?.creator_id),
                    sender_name: kol_profile?.stage_name || kol_profile!.user.name,
                    sender_icon: kol_profile?.img || 'https://storage.googleapis.com/staging.starnet-dev.appspot.com/brand-logo/k8s.png',
                    message: note_message,
                }
            });
            notifications.push(note);
            // console.log(note);
        }

        client_scokets[user_id].emit("NOTIFIED", { message: JSON.stringify(notifications) });
    } catch (error) {
        console.error((error as Error).message);

    }
});

export { EventsToBrand, EventsToKOL, MessageNotifier };
// export default MessageNotifier;
