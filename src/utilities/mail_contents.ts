
const RegistrationContent: string = `<h3>Dear passenger, welcome to Starnet !</h3><br/>
                              Please click the link <a href=\"https://dev.starnet.ai/verify?code={encoded_email}\">Confim Sign-up</a> 
                              and use the code to complete your sign-up. <br/><strong>{confirm_code}</strong>`;

const ResetPasswordContent = `Please click the link to reset password <a href=\"https://dev.starnet.ai/reset-password?token={token}\">Reset Password</a> `;


export { RegistrationContent, ResetPasswordContent };