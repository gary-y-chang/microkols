import EventEmitter from "events";
import MailMan from "./mailman";
import { RegistrationContent, ResetPasswordContent } from "./mail_contents";
import redis from "./redis_client";
import format from "string-template";
import { Encipher } from "./cipherman";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { client_scokets } from "./websocket_service"

const UserEventEmitter = new EventEmitter();

const confirm_code = () => Math.random().toString().substring(2, 8);

UserEventEmitter.on('USER_SIGNUP_DONE', async (user) => {
    const code = confirm_code();
    console.log(`new user signed up with User ID: ${user.id} and Confirm Code: ${code}`);

    const encoded_email = Encipher(user.email);
    //sending email with OTP
    //await MailMan(code, user.email);
    let content = format(RegistrationContent, { encoded_email: encoded_email, confirm_code: code });

    await MailMan(user.email, 'Starnet Registration Confirmation', content);

    //write the user email and confirm_code to Redis with 3 days (72 hours) expiry 
    await redis.set(user.email, code, 'EX', 72 * 60 * 60)

});

UserEventEmitter.on('USER_RESET_PASSWORD', async (user) => {
    console.log(`User ID: ${user.id} request to reset the password.`);
    //create a new password reset token
    const reset_token = crypto.randomBytes(32).toString('base64');
    //store encrypted version as key in the redis
    const encrypteded_token = Encipher(reset_token);
    //write the user email to Redis with 2 hours expiry 
    await redis.set(encrypteded_token, user.email, 'EX', 2 * 60 * 60);

    let content = format(ResetPasswordContent, { token: reset_token });

    await MailMan(user.email, 'Starnet - Reset Password', content);
});

// UserEventEmitter.on('WS_TEST', async (uname) => {
//     console.log(`WS_TEST User Event: ${uname}`);
//     for (let uname in client_scokets.keys()) {
//         console.log(uname);
//         client_scokets[uname].emit("newmsg", { message: 'Testing event', user: uname });
//     }
//     client_scokets['gary'].emit("newmsg", { message: 'Testing event', user: uname });
// });

UserEventEmitter.on('WS_TEST', async (data, user_id) => {

    // const note = JSON.parse(data);
    // for (let key of Object.keys(client_scokets)) {
    //     console.log(key);
    //     uid == key ? client_scokets[key].emit("newmsg", { message: 'Testing event', user: key }) : {};
    // }
    try {
        console.log(`WS_TEST User Event: ${data}`);
        // client_scokets[uid].emit("newmsg", { message: 'Testing event', user: uid });
        client_scokets[user_id].emit("newmsg", { message: data, user: user_id });
    } catch (error) {
        console.error((error as Error).message);

    }
});

export default UserEventEmitter;