import { Storage } from "@google-cloud/storage";
import { Stream } from "stream";


// const storage = new Storage({ keyFilename: "google-cloud-key.json" });
// const bucket = storage.bucket("staging.starnet-dev.appspot.com");
const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: process.env.GCS_PRIVATE_KEY
    }
});
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME as string);

const gcs_file_uploader = (path: string, file: Express.Multer.File) => {
    // export default (path: string, file: Express.Multer.File) => {
    const desti_file = `${path}/${file.originalname}`;
    const blob = bucket.file(desti_file);
    const blobStream = blob.createWriteStream({
        resumable: false,
    });

    blobStream.on("error", (err) => {
        // res.status(500).send({ message: err.message });
        throw new Error(err.message);
    });

    blobStream.on("finish", async () => {
        try {
            await bucket.file(desti_file).makePublic();
        } catch {
            throw new Error(`Uploaded the file successfully: ${file.originalname}, but public access is denied!`)
        }

    });

    blobStream.end(file.buffer);

};

const gcs_base64_writer = (desti_file: string, base64img: string) => {
    let bufferStream = new Stream.PassThrough();
    bufferStream.end(Buffer.from(base64img, 'base64'));

    // const desti_file = `profile/avatar/${user_id}.${img_type}`;
    var blob = bucket.file(desti_file);
    //Pipe the 'bufferStream' into a 'file.createWriteStream' method.
    bufferStream.pipe(blob.createWriteStream({
        resumable: false
    }))
        .on('error', (err) => {
            throw new Error(err.message);
        })
        .on('finish', async () => {
            try {
                await bucket.file(desti_file).makePublic();
            } catch {
                throw new Error(`Uploaded the file successfully: ${desti_file}, but public access is denied!`)
            }
        });

};

const gcs_file_cleaner = (desti_files: string[]) => {
    try {
        let promises = desti_files.map(async (filename: string) => {
            return await bucket.file(filename).delete();
        });

        Promise.allSettled(promises).then((results) => {
            results.forEach((result) => {
                if (result.status == 'fulfilled') {
                    console.log(`Successfully deleted ${result.value}`);
                } else {
                    console.log(`Failed to delete ${result.reason}`);
                }
            });
            console.log('All files on GCS deleted successfully');
        });

    } catch (err) {
        console.log(err)
    }
}

export { gcs_file_uploader, gcs_base64_writer, gcs_file_cleaner }