import { Router } from "express";
import { jobCreation } from "../controllers/job.controller.js";

const route = Router();

route.post("/create", jobCreation);
