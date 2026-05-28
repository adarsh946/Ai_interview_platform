import express from "express";
import authRoute from "./routes/auth.route.js";
import jobRoute from "./routes/job.routes.js";
import mockRoute from "./routes/mock.route.js";
import sessionRoute from "./routes/session.route.js";
import paymentRoute from "./routes/payment.routes.js";
import cookieParser from "cookie-parser";
import passport from "passport";
import { createServer } from "http";
import "./config/passport.js"; // registers Google and GitHub strategies
import { initializeSocket } from "./socket/index.js";
import "./worker/resumeWorker.js";
import cors from "cors";
console.log("ALL IMPORTS DONE");

import { createInterviewGraph } from "./langraph/interviewGraph.js";
import { setInterviewGraph } from "./globals.js";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

console.log("Step 1 - process handlers set");

try {
  const graph = createInterviewGraph();
  console.log("GRAPH CREATED");
  setInterviewGraph(graph);
  console.log("Step 2 - graph created");
} catch (err) {
  console.error("Graph creation failed:", err);
  process.exit(1);
}

// const { interviewGraph } = await import("./langraph/interviewGraph.js");
console.log("Step 2 - interviewGraph imported");

const app = express();
console.log("Step 3 - express app created");
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // required for cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use("/api/v1/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/jobs", jobRoute);
app.use("/api/v1/mock", mockRoute);
app.use("/api/v1/session", sessionRoute);
app.use("/api/v1", paymentRoute);

// socket.io connection...
const httpServer = createServer(app);
console.log("Step 4 - http server created");

initializeSocket(httpServer);
console.log("Step 5 - socket initialized");

httpServer.listen(process.env.PORT || 8000, () => {
  console.log("Step 6 - Server running on port 8000");
});
