import util from 'util'
import multer from 'multer';
import path from 'path';
import { MulterGoogleCloudStorage } from "@duplexsi/multer-storage-google-cloud";

const max_size = 2 * 1024 * 1024;

const processFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: max_size },
    fileFilter: function (req, file, callback) {
        var ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return callback(new Error('Only images are allowed'))
        }
        callback(null, true)
    }
}).single("file");

const gscstorage = new MulterGoogleCloudStorage({
    bucketName: "staging.starnet-dev.appspot.com",
    keyFilename: "google-cloud-key.json",
    writeStreamOptions: { public: true },
    destination: (req, file, callback) => {
        const author_id = req.params.user_id;
        const cmpgn_id = req.params.campaign_id;
        // console.log(`the content: ${cmpgn_id} || ${author_id}`);
        const match = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
        if (match.indexOf(file.mimetype) === -1) {
            let message = `${file.originalname} is invalid. Only accept png/jpeg/jpg/gif.`;
            return callback(new Error(message), file.originalname);
        }

        if (file.size > max_size) {
            let message = `${file.originalname} size too large. max file size is ${max_size}`;
            return callback(new Error(message), file.originalname);
        }

        callback(null, `posts/${cmpgn_id}/${author_id}/${Date.now()}/${file.originalname}`)
    }
});

let processFileMiddleware = util.promisify(processFile);

let uploadFiles = multer({ storage: gscstorage }).array("photos", 10);
let multipleUploadsMiddleware = util.promisify(uploadFiles);

export { processFileMiddleware, multipleUploadsMiddleware };

