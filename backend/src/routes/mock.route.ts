import { Router } from "express";
import { createMockInterview } from "../controllers/mock.controller.js";

const route = Router();

route.post("/create", createMockInterview);

export default route;
