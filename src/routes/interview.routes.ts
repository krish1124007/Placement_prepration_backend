import {
    createInterviewSession,
    getInterviewSession,
    getUserInterviewSessions,
    startInterview,
    chatWithAI,
    saveTranscription,
    endInterview,
    getGeminiApiKey,
    getInterviewScorecard
} from "../controllers/interview/interview.controller.js";
import { Router } from "express";
import {auth} from "../middlewares/auth.js";

const router = Router();

router.post("/create", auth, createInterviewSession);
router.get("/session/:sessionId", auth, getInterviewSession);
router.get("/user/:userid", auth, getUserInterviewSessions);
router.post("/start/:sessionId", auth, startInterview);
router.post("/chat/:sessionId", auth, chatWithAI);
router.post("/transcription/:sessionId", auth, saveTranscription);
router.post("/end/:sessionId", auth, endInterview);
router.get("/gemini-key", auth, getGeminiApiKey);
router.get("/scorecard/:sessionId", getInterviewScorecard);

export const interview_router = router;
