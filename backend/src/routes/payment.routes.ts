import { Router } from "express";
import express from "express";
import useMiddleware from "../middlewares/middleware.js";
import {
  createOrder,
  getPacks,
  getPlans,
  getWalletBalance,
  webhookHandler,
} from "../controllers/payment.controller.js";

const route = Router();

route.post("/payment/create-order", useMiddleware, createOrder);
route.post(
  "/payment/webhook",
  express.raw({ type: "application/json" }),
  webhookHandler
);
route.get("/plans", getPlans);
route.get("/packs", getPacks);
route.get("/payment/wallet", useMiddleware, getWalletBalance);

export default route;
