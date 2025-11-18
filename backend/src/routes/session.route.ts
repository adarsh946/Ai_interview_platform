import { Router } from "express";
import {
  cancelInterview,
  completeInterview,
  inProgressInterview,
  readyForInterview,
  startSession,
} from "../controllers/session.controller.js";
import useMiddleware from "../middlewares/middleware.js";

const route = Router();

route.post("/start-session", useMiddleware, startSession);
route.post("/ready", useMiddleware, readyForInterview);
route.post("/interview/in-progress", useMiddleware, inProgressInterview);
route.post("/interview/cancel", useMiddleware, cancelInterview);
route.post("/interview/completed", useMiddleware, completeInterview);

export default route;
