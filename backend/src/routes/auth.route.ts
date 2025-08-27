import { Router } from "express";
import { signupController } from "../controllers/auth.controller.js";

const route = Router();

route.post("/signup", signupController);

export default route;
