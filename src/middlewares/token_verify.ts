import { NextFunction, Request, Response } from "express";
import { access } from "fs";
import jwt from "jsonwebtoken";

export default function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    try {
        if (token == null) {
            throw new Error('no access token')
        }

        jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: any) => {
            if (err) throw err;
            next();
        });

    } catch (error) {
        console.error((error as Error).message);
        res.status(403).json({
            error: (error as Error).message,
            message: 'token verified failed.'
        })
    }
}


const refreshAccessToken = (refresh_token: string): string => {

    let accessToken: string = '';
    jwt.verify(refresh_token, process.env.REFRESH_SECRET as string, (err, decoded: any) => {
        if (err) {
            throw new Error('Invalid refresh token')
            //   return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const user_id = decoded.userid;
        const email = decoded.email;
        const user_type = decoded.usertpye;
        // Generate a new access token
        accessToken = jwt.sign({ userid: user_id, email: email, usertpye: user_type }, process.env.TOKEN_SECRET as string, { expiresIn: '4h' });
    });

    return accessToken;
}

export { refreshAccessToken }