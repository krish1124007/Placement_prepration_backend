import { InterviewSession } from "../../models/interview.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import mongoose from "mongoose";
import type { Response, Request, NextFunction } from "express";
import * as geminiService from "../../services/gemini.service.js";


// Create new interview session
const createInterviewSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, topic, description, level, tone } = req.body;

    if (!userId || !topic || !level) {
        throw new ApiError(400, "User ID, topic, and level are required");
    }

    const session = await InterviewSession.create({
        userId: new mongoose.Types.ObjectId(userId),
        topic,
        description,
        level,
        tone: tone || "Professional",
        status: "scheduled"
    });

    if (!session) {
        throw new ApiError(400, "Failed to create interview session");
    }

    return apiResponse(res, 200, "Interview session created successfully", session);
});


// Get interview session by ID
const getInterviewSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId).populate("userId", "name email");

    if (!session) {
        throw new ApiError(404, "Interview session not found");
    }

    return apiResponse(res, 200, "Interview session fetched successfully", session);
});


// Get all sessions for a user
const getUserInterviewSessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userid } = req.params;

    const sessions = await InterviewSession.find({ userId: new mongoose.Types.ObjectId(userid) })
        .sort({ createdAt: -1 })
        .limit(50);

    return apiResponse(res, 200, "User interview sessions fetched successfully", sessions);
});


// Start interview (update status and initialize AI)
const startInterview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await InterviewSession.findByIdAndUpdate(
        sessionId,
        {
            status: "in-progress",
            startedAt: new Date()
        },
        { new: true }
    );

    if (!session) {
        throw new ApiError(404, "Interview session not found");
    }

    // Initialize AI chat session (Groq)
    const initialMessage = await geminiService.initializeChatSession(
        sessionId as string,
        session.topic,
        session.level,
        session.tone
    );

    return apiResponse(res, 200, "Interview started", {
        session,
        initialMessage
    });
});


// Chat with AI (send user message, get AI response)
const chatWithAI = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === "") {
        throw new ApiError(400, "Message is required");
    }

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "Interview session not found");
    }

    if (session.status !== "in-progress") {
        throw new ApiError(400, "Interview is not in progress");
    }

    try {
        // Get AI response from Gemini
        const aiResponse = await geminiService.sendMessage(sessionId as string, message);

        // Save both user message and AI response to database
        const timestamp = Date.now();

        await InterviewSession.findByIdAndUpdate(sessionId, {
            $push: {
                transcriptions: [
                    { speaker: "User", text: message, timestamp },
                    { speaker: "AI", text: aiResponse, timestamp: timestamp + 1 }
                ]
            }
        });

        return apiResponse(res, 200, "Message sent successfully", {
            aiResponse,
            timestamp
        });
    } catch (error: any) {
        throw new ApiError(500, `AI chat failed: ${error.message}`);
    }
});


// Save transcription during interview
const saveTranscription = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { speaker, text, timestamp } = req.body;

    if (!speaker || !text || !timestamp) {
        throw new ApiError(400, "Speaker, text, and timestamp are required");
    }

    const session = await InterviewSession.findByIdAndUpdate(
        sessionId,
        {
            $push: {
                transcriptions: { speaker, text, timestamp }
            }
        },
        { new: true }
    );

    if (!session) {
        throw new ApiError(404, "Interview session not found");
    }

    return apiResponse(res, 200, "Transcription saved", session);
});


// End interview
const endInterview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { feedback } = req.body;

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "Interview session not found");
    }

    const endedAt = new Date();
    const duration = session.startedAt
        ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
        : 0;

    session.status = "completed";
    session.endedAt = endedAt;
    session.duration = duration;
    if (feedback) {
        session.feedback = feedback;
    }

    await session.save();

    // Clear session history from memory
    geminiService.clearSessionHistory(sessionId as string);

    return apiResponse(res, 200, "Interview ended successfully", session);
});


// Get Gemini API Key
const getGeminiApiKey = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new ApiError(500, "Gemini API key not configured");
    }

    return apiResponse(res, 200, "API key fetched", { apiKey });
});


export {
    createInterviewSession,
    getInterviewSession,
    getUserInterviewSessions,
    startInterview,
    chatWithAI,
    saveTranscription,
    endInterview,
    getGeminiApiKey
}
