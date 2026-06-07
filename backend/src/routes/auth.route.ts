import { Router } from "express";
import {
  getMeController,
  signinController,
  signupController,
} from "../controllers/auth.controller.js";
import passport from "passport";
import jwt from "jsonwebtoken";
import useMiddleware from "../middlewares/middleware.js";

const route = Router();

route.post("/signup", signupController);
route.post("/signin", signinController);
route.get("/me", useMiddleware, getMeController);

route.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

route.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const user = req.user as { id: string };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  }
);

// GITHUB
route.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

route.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login?error=github_email_required",
    session: false,
  }),
  (req, res) => {
    const user = req.user as { id: string };
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // false for localhost
      sameSite: "lax",
    });
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  }
);

export default route;
