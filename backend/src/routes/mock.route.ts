import { Router } from "express";
import { createMockInterview } from "../controllers/mock.controller.js";
import useMiddleware from "../middlewares/middleware.js";

const route = Router();

route.post("/create", useMiddleware, createMockInterview);

export default route;
