import FacebookStrategy from "passport-facebook";
import { PrismaClient } from "@prisma/client";

export default (prisma: PrismaClient) => {

    const fb_strategy = new FacebookStrategy.Strategy(
        {
            clientID: "3549288118617979",
            clientSecret: "30258bfd7e6d1b00f6283c70807397dd",
            callbackURL:
                "https://dev.starnet.ai/api.staging/sync/facebook/callback",
            profileFields: ['id', 'displayName', 'link', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
            console.log(`accesstoken: ${accessToken}`);
            // console.log(`refreshtoken: ${refreshToken}`);
            console.log(`profile: ${JSON.stringify(profile)}`);
            // console.log(`email: ${profile._json.email}`);
            // console.log(`id: ${profile._json.id}`);
            // console.log(`plat_code: ${profile.provider}`);
            const plat_id = profile._json.id
            const platform = profile.provider;
            const plat_name = profile.displayName;
            const email = profile._json.email;

            try {
                const kol_platform = await prisma.kOL_Platform.findFirstOrThrow({
                    select: {
                        id: true,
                        plat_code: true,
                        plat_identity: true,
                        kol_profile: {
                            select: {
                                id: true,
                            }
                        }
                    }
                    , where: {
                        plat_identity: plat_id,
                        plat_code: platform
                    }
                });

                await prisma.kOL_Platform.update({
                    where: {
                        id: kol_platform.id
                    },
                    data: {
                        is_sync: true,
                        plat_name: plat_name,
                        access_token: accessToken
                    }
                });
                return done(null, profile, accessToken);

            } catch (error) {
                console.error((error as Error).message);
                const kol_profile = await prisma.kOL_Profile.findFirst({
                    where: {
                        user: {
                            email: email
                        }
                    },
                    select: {
                        id: true,
                        user: {
                            select: {
                                email: true
                            }
                        }
                    }
                });
                if (kol_profile) {
                    await prisma.kOL_Platform.create({
                        data: {
                            plat_code: platform,
                            plat_name: plat_name,
                            is_sync: true,
                            access_token: accessToken,
                            kol_profile_id: kol_profile.id
                        }
                    });

                    return done(null, profile, accessToken);
                } else {
                    const error = new Error(`Account sync failed. No such user email: ${email} `);
                    return done(error, null, null);
                }
            }
        }
    );

    return fb_strategy;
}



