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

const router = Router();

router.post("/create", createInterviewSession);
router.get("/session/:sessionId", getInterviewSession);
router.get("/user/:userid", getUserInterviewSessions);
router.post("/start/:sessionId", startInterview);
router.post("/chat/:sessionId", chatWithAI);
router.post("/transcription/:sessionId", saveTranscription);
router.post("/end/:sessionId", endInterview);
router.get("/gemini-key", getGeminiApiKey);
router.get("/scorecard/:sessionId", getInterviewScorecard);

export const interview_router = router;
