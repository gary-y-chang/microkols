import crypto from "crypto";

const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);
const key = crypto.randomBytes(32);

const Encipher = (message: string) => {

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);

    // const cipherBuffer = cipher.update(message);
    let encrypted = cipher.update(message);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedData = encrypted.toString('hex')

    console.log(encryptedData);
    return encryptedData;
}

const Decipher = (encoded: string) => {
    console.log(encoded);
    let ivs = Buffer.from(iv.toString('hex'), 'hex');
    let encryptedText = Buffer.from(encoded, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), ivs);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    console.log(decrypted.toString());

    return decrypted.toString();
}

export { Encipher, Decipher }