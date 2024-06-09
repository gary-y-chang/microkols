import { Express } from "express"
import { PrismaClient } from "@prisma/client";
import TokenVerify from "../middlewares/token_verify";
import { MessageNotifier } from "../utilities/msg_notifier";

export default (app: Express, prisma: PrismaClient) => {

    app.get('/notifications/unread', async (req, res) => {
        /* #swagger.tags = ['Notification']
          #swagger.security = [{
               "bearerAuth": []
          }]    
        */
        const user_id = Number(req.query.user_id) || 0;
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    receiver_id: user_id,
                    is_read: false
                }
            });

            res.json({ status: true, message: "Query successfull", data: { notifications: notifications } });

        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.post('/notifications/read', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Notification']
          #swagger.security = [{
               "bearerAuth": []
          }]    
        */
        const { note_ids } = req.body;
        try {
            const notifications = await prisma.notification.updateMany({
                where: {
                    id: {
                        in: note_ids
                    },
                    is_read: false
                },
                data: {
                    is_read: true
                }
            });

            res.json({ status: true, message: "Notifications set read successfull" });
        } catch (error) {
            console.error((error as Error).message);
            res.status(500).json({ status: false, message: (error as Error).message })
        }
    });

    app.get('/notifications/test/:user_id', async (req, res) => {

        const { user_id } = req.params
        // console.log(`name: ${name}`);

        // const notification = {
        //     user_id: Number(user_id),
        //     message: "Campaign has been approved by brand",
        // };

        const notifications = [
            { id: 12, message: "Campaign has been approved by brand", date: new Date() },
            { id: 19, message: "Post draft approved", date: new Date() },
            { id: 23, message: "Test notification", date: new Date() },

        ]

        MessageNotifier.emit('NOTIFY_EVENT', JSON.stringify(notifications), user_id);

        res.json({ status: true, message: "Query successfull", data: notifications });

    });
}