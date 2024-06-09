// API for KOL
import { Express } from "express"
import { PrismaClient } from "@prisma/client";
import TokenVerify from "../middlewares/token_verify";

export default (app: Express, prisma: PrismaClient) => {

    app.post('/txns/top-up', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Transaction']
          #swagger.security = [{
               "bearerAuth": []
         }] */
        const user_id = Number(req.body.user_id) || 0;
        const page = Number(req.body.page) || 1;
        const count = Number(req.body.count) || 10;
        const start = req.body.start_date
        const end = req.body.end_date
        let total;
        let txns;
    });


    app.get('/txns', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Transaction']
          #swagger.security = [{
               "bearerAuth": []
         }] */
        const user_id = Number(req.query.user_id) || 0;
        const page = Number(req.query.page) || 1;
        const count = Number(req.query.count) || 10;
        const start = req.query.start_date
        const end = req.query.end_date
        let total;
        let txns;

        if (start && end) {
            total = await prisma.transaction.count({
                where: {
                    user_id: user_id,
                    created_at: {
                        lte: new Date(String(end)).toISOString(),
                        gte: new Date(String(start)).toISOString()
                    }
                },
            });
            txns = await prisma.transaction.findMany({
                skip: (page - 1) * count,
                take: count,
                where: {
                    user_id: user_id,
                    created_at: {
                        lte: new Date(String(end)).toISOString(),
                        gte: new Date(String(start)).toISOString()
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
            total = txns.length;
        } else {
            total = await prisma.transaction.count({
                where: {
                    user_id: user_id,
                },
            });
            txns = await prisma.transaction.findMany({
                skip: (page - 1) * count,
                take: count,
                where: {
                    user_id: user_id
                },
                orderBy: {
                    created_at: 'desc'
                }
            });
        }

        res.json({
            status: true, message: "Query successfull", data:
            {
                "totalItems": total,
                "totalPages": Math.ceil(total / count),
                "currentPage": page,
                "itemsPerPage": count,
                "transactions": txns
            }
        });

    });


}