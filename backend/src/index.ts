import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import jobRoute from "./routes/job.routes.js";
import cookieParser from "cookie-parser";
import passport from "passport";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/v1", authRoute);
app.use("/api/v1/jobs", jobRoute);

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
