import { Router } from "express";
import useMiddleware from "../middlewares/middleware.js";
import { createOrder } from "../controllers/payment.controller.js";

const route = Router();

route.post("payment/create-order", useMiddleware, createOrder);
route.post("payment/webhook");

export default route;
