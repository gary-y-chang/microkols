import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import users from "./routes/users";
import kols from "./routes/kols";
import campaigns from "./routes/campaigns";
import brands from "./routes/brands";
import transactions from "./routes/transactions";
import uploader from "./routes/uploader";
import accountsync from "./routes/accountsync";
import notifications from "./routes/notifications";
import swaggerUI from "swagger-ui-express";
import swaggerDoc from "./swagger_doc.json";
import { Server } from "socket.io";
import wsserver from "./utilities/websocket_service";
import passport from "passport";
import fb_strategy from "./middlewares/passport_strategy";



const app = express()

const allowedOrigins = ['http://localhost:3000', 'http://dev.starnet.ai:3030', 'https://dev.starnet.ai/api.staging', 'https://dev.starnet.ai/socket.io'];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
    credentials: true
};

app.use(cors(options));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/staging/api-doc', swaggerUI.serve, swaggerUI.setup(swaggerDoc));


const port = process.env.PORT || 3000;

const prisma = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        },
    ]
});

passport.use(fb_strategy(prisma));

// for debugging output SQL query
prisma.$on("query", async (e) => {
    console.log(`${e.query} ${e.params}`)
});

const httpserver = app.listen(Number(port), () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const socketio = new Server(httpserver, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('Hello  you there, TypeScript Express!');
});

wsserver(socketio);
users(app, prisma);
brands(app, prisma);
kols(app, prisma);
campaigns(app, prisma);
transactions(app, prisma);
uploader(app, prisma);
notifications(app, prisma);
accountsync(app);