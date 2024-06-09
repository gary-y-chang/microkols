import jwt from "jsonwebtoken";


const accessTokenGenerate = (user_id: number, email: string, user_type: string): string => {
    return jwt.sign({ userid: user_id, email: email, usertpye: user_type }, process.env.TOKEN_SECRET as jwt.Secret, { expiresIn: '4h' });
}

const refreshTokenGenerate = (user_id: number, email: string, user_type: string): string => {
    return jwt.sign({ userid: user_id, email: email, usertpye: user_type }, process.env.REFRESH_SECRET as jwt.Secret, { expiresIn: '7d' });
}

export { accessTokenGenerate, refreshTokenGenerate }
