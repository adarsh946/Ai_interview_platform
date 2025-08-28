import { Router } from "express";
import {
  signinController,
  signupController,
} from "../controllers/auth.controller.js";
import passport from "passport";
import jwt from "jsonwebtoken";

const route = Router();

route.post("/signup", signupController);
route.post("/signin", signinController);

route.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

route.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user as { id: string };
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, { httpOnly: true, secure: true }); // safer
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  }
);

// GITHUB
route.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

route.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user as { id: string };
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });
    res.cookie("token", token, { httpOnly: true, secure: true });
    res.redirect(process.env.FRONTEND_URL + "/dashboard");
  }
);

export default route;
