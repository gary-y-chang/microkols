import { Express } from "express";
import TokenVerify from "../middlewares/token_verify";
import { processFileMiddleware, multipleUploadsMiddleware } from "../middlewares/upload_verify"
import { MulterError } from "multer";
import { gcs_file_uploader } from "../utilities/gcs_uploader";
import { format } from "util";
import { PrismaClient } from "@prisma/client";
import { MessageNotifier, EventsToBrand } from "../utilities/msg_notifier";

export default (app: Express, prisma: PrismaClient) => {
    app.post('/upload/:resource/:id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Utilities'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
           #swagger.consumes = ['multipart/form-data']
           #swagger.parameters['file'] = {
                in: 'formData',
                name: 'file',
                type: 'file',
                required: true,
                description: 'Select a file to upload',
           }
        */

        const resource = req.params.resource;
        const resrc_id = req.params.id;
        const bucket_name = process.env.GCS_BUCKET_NAME;

        try {
            await processFileMiddleware(req, res);

            if (!req.file) {
                return res.status(400).send({ message: "Please upload a file!" });
            }

            const bucket_path = resource.concat('/', resrc_id)
            gcs_file_uploader(bucket_path, req.file);

            const publicUrl = format(
                `https://storage.googleapis.com/${bucket_name}/${bucket_path}/${req.file.originalname}`
            );

            res.status(200).json({
                status: true,
                message: `Uploaded the file successfully: ${req.file.originalname}`,
                data: { "url": publicUrl },
            });

        } catch (err) {
            console.log((err as Error).message);

            if ((err as MulterError).code == "LIMIT_FILE_SIZE") {
                return res.status(500).send({
                    message: "File size cannot be larger than 2MB!",
                });
            }

            res.status(500).json({
                status: false,
                message: `Could not upload the file. ${err}`,
            });
        }
    });

    app.post('/upload/posts/:campaign_id/:user_id', TokenVerify, async (req, res) => {
        /* #swagger.tags = ['Utilities'] */
        /* #swagger.security = [{
            "bearerAuth": []
             }] 
           #swagger.consumes = ['multipart/form-data']
           #swagger.parameters['photos'] = {
                in: 'formData',
                name: 'photos',
                type: 'file',
                required: false,
                description: 'Select up to 10 images to upload',
           } 
           #swagger.parameters['title'] = {
                in: 'formData',
                name: 'title',
                type: 'string',
                required: false,
                description: 'The title of the post',
           }
           #swagger.parameters['content'] = {
                in: 'formData',
                name: 'content',
                type: 'string',
                required: false,
                description: 'The content of the post',
           }
          
        */
        const author_id = req.params.user_id;
        const cmpgn_id = req.params.campaign_id;

        try {
            await multipleUploadsMiddleware(req, res);

            // if (req.files?.length == 0) {
            //     return res.status(400).send(`You must select at least 1 file.`);
            // }

            const post_title = req.body.title;
            const post_content = req.body.content;
            // console.log(`the content: ${cmpgn_id} || ${author_id} --- ${post_title}: ${post_content}`);

            const urls: Array<string> = [];
            let files: any;
            files = req.files
            for (const file of files) {
                const { path, name } = file
                const publicUrl = format(
                    `https://storage.googleapis.com/staging.starnet-dev.appspot.com/${file.destination}`
                );
                // console.log(`file url: ${publicUrl}`);
                urls.push(publicUrl);
            }
            // console.log(req.files);

            await prisma.campaign_Apply.update({
                where: {
                    campaign_apply_id: {
                        user_id: Number(author_id),
                        cmpgn_id: Number(cmpgn_id)
                    }
                },
                data: {
                    status: [1, 1, 1, 0, 0],
                }
            });

            await prisma.post_Job.update({
                where: {
                    post_job_id: {
                        author_id: Number(author_id),
                        cmpgn_id: Number(cmpgn_id)
                    }
                },
                data: {
                    description: post_title,
                    content: post_content,
                    procedure: [1, 1, 1, 0, 0, 0],
                    photos: {
                        push: urls
                    }
                }
            });

            //send notification
            MessageNotifier.emit('NOTIFY_EVENT', author_id, cmpgn_id, EventsToBrand.POST_DRAFT_SUBMISSION, prisma);

            res.status(200).json({
                status: true,
                message: `Post draft submit successfully`,
                data: { "photo_urls": urls },
            });

        } catch (error) {
            console.log(error);

            if ((error as MulterError).code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(500).send("Too many files to upload.");
            }

            return res.status(500).send(`Error when trying upload many files: ${error}`);
        }


    });

}

