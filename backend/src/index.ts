import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import jobRoute from "./routes/job.routes.js";
import mockRoute from "./routes/mock.route.js";
import sessionRoute from "./routes/session.route.js";
import paymentRoute from "./routes/payment.routes.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import { redis } from "./config/redis.js";
import { createServer } from "http";
import { initializeSocket } from "./socket/index.js";
import "./worker/resumeWorker.js";

dotenv.config();

await redis.connect();

await redis.set("ping", "pong");
const val = await redis.get("ping");
console.log("[redis] test:", val);

const { interviewGraph } = await import("./langraph/interviewGraph.js");

const app = express();

app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/v1", authRoute);
app.use("/api/v1/jobs", jobRoute);
app.use("/api/v1/mock", mockRoute);
app.use("/api/v1/session", sessionRoute);
app.use("/api/v1", paymentRoute);

// socket.io connection...

const httpServer = createServer(app);
initializeSocket(httpServer);

httpServer.listen(process.env.PORT || 8000, () => {
  console.log(` Server running on port ${process.env.PORT}`);
});
