import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import jobRoute from "./routes/job.routes.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import { redis } from "./config/redis.js";
import { createServer } from "http";
import { initializeSocket } from "./socket/index.js";
import "./workers/resumeWorker.js";

dotenv.config();

await redis.connect();

await redis.set("ping", "pong");
const val = await redis.get("ping");
console.log("[redis] test:", val);

const { interviewGraph } = await import("./langraph/interviewGraph.js");

const app = express();
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/v1", authRoute);
app.use("/api/v1/jobs", jobRoute);

// socket.io connection...

const httpServer = createServer(app);
initializeSocket(httpServer);

httpServer.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
