import { Router } from "express";
import {
  getalljobs,
  getJob,
  jobCreation,
} from "../controllers/job.controller.js";
import useMiddleware from "../middlewares/middleware.js";

const route = Router();

route.post("/create", useMiddleware, jobCreation);
route.get("/", getalljobs);
route.get("/:id", getJob);

export default route;
