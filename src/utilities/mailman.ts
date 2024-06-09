import { Client, SendEmailV3_1, LibraryResponse } from 'node-mailjet';

const mailjet = new Client({
    /* tester@starnet.ai */
    apiKey: process.env.MAILJET_APIKEY,
    apiSecret: process.env.MAILJET_APISECRET
});

// const MailMan = async (confirm_code: string, email_to: string) => {
const MailMan = async (receiver: string, subject: string, content: string) => {

    //const encoded_email = Encipher(content.email_to);

    const data: SendEmailV3_1.Body = {
        Messages: [
            {
                "From": {
                    "Email": "tester@starnet.ai",
                    "Name": "Mailjet Pilot"
                },
                "To": [
                    {
                        "Email": `${receiver}`,
                        "Name": ""
                    }
                ],
                // TemplateErrorReporting: {
                //     Email: 'gary.chang@admazes.com',
                //     Name: 'Reporter',
                // },
                Subject: subject,
                HTMLPart: content,
                // HTMLPart: `<h3>Dear passenger, welcome to Starnet !</h3><br/> 
                //            Please click the link <a href=\"https://dev.starnet.ai/verify?code=${encoded_email}\">Confim Sign-up</a> and use the code to complete your sign-up. <br/>
                //            <strong>${content.confirm_code}</strong>`,
                TextPart: 'Dear passenger, welcome to Mailjet! May the delivery force be with you!',
            },
        ],
    };

    const result: LibraryResponse<SendEmailV3_1.Response> = await mailjet
        .post('send', { version: 'v3.1' })
        .request(data);

    // const { Status } = result.body.Messages[0];

    console.log(result.body.Messages)
};

export default MailMan;
