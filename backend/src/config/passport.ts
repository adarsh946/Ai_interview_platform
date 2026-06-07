import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";
import {
  Strategy as GitHubStrategy,
  Profile as GitHubProfile,
} from "passport-github2";
import prisma from "../prisma/prisma.js";
import { VerifyCallback } from "passport-oauth2";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL + "/api/v1/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile: GoogleProfile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error("Email not found"), undefined);
        }

        let user = await prisma.user.findUnique({ where: { email: email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              fullName: profile.displayName,
              email,
              provider: "google",
              wallet: {
                create: {
                  balance: 3,
                  transactions: {
                    create: {
                      type: "CREDIT",
                      amount: 3,
                      reason: "signup bonus",
                      expiresAt: null,
                    },
                  },
                },
              },
            },
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.BACKEND_URL + "/api/v1/auth/github/callback",
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: GitHubProfile,
      done: VerifyCallback
    ) => {
      try {
        const githubProfile = profile as any;
        const email = profile.emails?.[0]?.value || githubProfile._json?.email;
        if (!email) {
          return done(
            new Error(
              "GitHub account has no accessible email. Please make your email public on GitHub or use Google login."
            ),
            undefined
          );
        }

        let user = await prisma.user.findUnique({
          where: { email },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              fullName:
                profile.displayName || profile.username || "Github user",
              email,
              provider: "github",
              wallet: {
                create: {
                  balance: 3,
                  transactions: {
                    create: {
                      type: "CREDIT",
                      amount: 3,
                      reason: "signup bonus",
                      expiresAt: null,
                    },
                  },
                },
              },
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
