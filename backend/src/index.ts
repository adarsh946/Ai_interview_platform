import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/v1", authRoute);

app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
