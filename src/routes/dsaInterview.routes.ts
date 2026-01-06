import { Router } from "express";
import {
    createDSAInterviewSession,
    getDSAInterviewSession,
    getUserDSAInterviewSessions,
    startPreliminaryPhase,
    submitPreliminaryAnswers,
    startCodingPhase,
    submitCodeSolution,
    completeInterview,
    getScorecard,
    cancelDSAInterview
} from "../controllers/interview/dsaInterview.controller.js";

const router = Router();

// Session management
router.post("/create", createDSAInterviewSession);
router.get("/session/:sessionId", getDSAInterviewSession);
router.get("/user/:userId", getUserDSAInterviewSessions);
router.post("/cancel/:sessionId", cancelDSAInterview);

// Preliminary phase
router.post("/preliminary/start/:sessionId", startPreliminaryPhase);
router.post("/preliminary/submit/:sessionId", submitPreliminaryAnswers);

// Coding phase
router.post("/coding/start/:sessionId", startCodingPhase);
router.post("/coding/submit/:sessionId", submitCodeSolution);

// Completion
router.post("/complete/:sessionId", completeInterview);
router.get("/scorecard/:sessionId", getScorecard);

export default router;
