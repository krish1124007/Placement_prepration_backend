import {
    createPlan,
    getMyAllPlan,
    savePlan,
    getPlanDetails,
    getScheduleTasks
} from "../controllers/planp/planp.controller.js";
import { Router } from "express";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.use(auth);

router.post("/createplan", createPlan);
router.post("/saveplan", savePlan);
router.get("/getmyallplan", getMyAllPlan);
router.get("/getplandetails/:id", getPlanDetails);
router.get("/getscheduletasks", getScheduleTasks);

export const plan_router = router;