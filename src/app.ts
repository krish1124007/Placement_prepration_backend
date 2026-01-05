import express from "express";
import type { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { user_router } from "./routes/student.routes.js";
import { interview_router } from "./routes/interview.routes.js";
import { plan_router } from "./routes/plan.routes.js";


dotenv.config();


const app: Application = express();


app.use(cors());
app.use(express.json());
app.use("/api/v1/users", user_router);
app.use("/api/v1/interviews", interview_router);
app.use("/api/v1/plans", plan_router);

export { app }
