import { Router } from "express";
import {
  createMockInterview,
  getMockInterview,
  getMyInterviews,
} from "../controllers/mock.controller.js";
import useMiddleware from "../middlewares/middleware.js";
import { uploadResume } from "../utils/uploader.js";
import { checkCredits } from "../middlewares/credits.middleware.js";

const route = Router();

route.post(
  "/create",
  useMiddleware,
  checkCredits,
  uploadResume.single("resume"),
  createMockInterview
);

route.get("/my-interviews", useMiddleware, getMyInterviews);
route.get("/:id", useMiddleware, getMockInterview);

export default route;
