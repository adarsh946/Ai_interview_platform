import { Router } from "express";
import { createMockInterview } from "../controllers/mock.controller.js";
import useMiddleware from "../middlewares/middleware.js";
import { uploadResume } from "../utils/uploader.js";

const route = Router();

route.post(
  "/create",
  useMiddleware,
  uploadResume.single("resume"),
  createMockInterview
);

export default route;
