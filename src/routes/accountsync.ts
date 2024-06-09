import { Express, NextFunction, Request, Response } from "express"
import passport from "passport";
import TokenVerify from "../middlewares/token_verify";

export default (app: Express) => {

    app.get("/kols/sync/facebook",
        passport.authenticate("facebook", {
            scope: ["user_link", "user_posts"],
        }),
    );

    // app.get("/sync/facebook/callback",
    //     passport.authenticate("facebook", {
    //         failureRedirect: "/login",
    //         // successRedirect: "https://dev.starnet.ai/account-sync?platform=fb&enabled=true",
    //         session: false,
    //         //failureMessage: true
    //     }),
    //     (err: Error, req: Request, res: Response) => {
    //         if (err) {
    //             res.redirect("https://dev.starnet.ai/account-sync?platform=fb&enabled=false");
    //         } else {
    //             res.redirect("https://dev.starnet.ai/account-sync?platform=fb&enabled=true");
    //         }
    //     }
    // );

    app.get('/sync/facebook/callback', function (req: Request, res: Response, next: NextFunction) {
        passport.authenticate('facebook', { session: false }, function (err: Error) {
            if (err) {
                res.redirect("https://dev.starnet.ai/account-sync?platform=facebook&enabled=false");
            } else {
                res.redirect("https://dev.starnet.ai/account-sync?platform=facebook&enabled=true");
            }
            //   if (!user) { return res.redirect('/signin') }
        })(req, res, next);
    });
}


