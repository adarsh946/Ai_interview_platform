import { Router } from "express";
import {
  createMockInterview,
  getMyInterviews,
} from "../controllers/mock.controller.js";
import useMiddleware from "../middlewares/middleware.js";
import { uploadResume } from "../utils/uploader.js";

const route = Router();

route.post(
  "/create",
  useMiddleware,
  uploadResume.single("resume"),
  createMockInterview
);

route.get("/my-interviews", useMiddleware, getMyInterviews);

export default route;
