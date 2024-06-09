import { body, validationResult } from "express-validator";
import { NextFunction, Request, Response } from "express";

const CampaignReqRules = () => {
    return [body(['objectives', 'platforms', 'interests', 'type', 'status', 'budget',
        'start_at', 'end_at', 'invitation_end_at', 'title', 'description', 'region', 'creator_id'], 'field value empty').notEmpty()];
};

const CampaignReqValidator = (req: Request, res: Response, next: NextFunction) => {
    const { type, status } = req.body;
    try {
        validationResult(req).throw();
        next();

    } catch (err) {
        res.send(err);
    }


};


export { CampaignReqRules, CampaignReqValidator };

