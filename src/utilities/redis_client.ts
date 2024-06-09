import { Redis } from "ioredis";

const redis = new Redis({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_URL
});



export default redis;