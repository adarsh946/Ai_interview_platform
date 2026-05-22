import { Router } from "express";
import express from "express";
import useMiddleware from "../middlewares/middleware.js";
import {
  createOrder,
  webhookHandler,
} from "../controllers/payment.controller.js";

const route = Router();

route.post("payment/create-order", useMiddleware, createOrder);
route.post(
  "payment/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);

export default route;
