import { DSAInterviewSession } from "../../models/dsaInterview.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import mongoose from "mongoose";
import type { Response, Request, NextFunction } from "express";
import * as dsaAnalysisService from "../../services/dsaAnalysis.service.js";

/* =========================
   Create DSA Interview Session
========================= */

export const createDSAInterviewSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId, topic, level } = req.body;

    if (!userId || !topic || !level) {
        throw new ApiError(400, "User ID, topic, and level are required");
    }

    const session = await DSAInterviewSession.create({
        userId: new mongoose.Types.ObjectId(userId),
        topic,
        level,
        status: "scheduled"
    });

    if (!session) {
        throw new ApiError(400, "Failed to create DSA interview session");
    }

    return apiResponse(res, 200, "DSA interview session created successfully", session);
});

/* =========================
   Get DSA Interview Session
========================= */

export const getDSAInterviewSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findById(sessionId).populate("userId", "name email");

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    return apiResponse(res, 200, "DSA interview session fetched successfully", session);
});

/* =========================
   Get User's DSA Interview Sessions
========================= */

export const getUserDSAInterviewSessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const sessions = await DSAInterviewSession.find({ userId: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(50);

    return apiResponse(res, 200, "User DSA interview sessions fetched successfully", sessions);
});

/* =========================
   Start Preliminary Phase
========================= */

export const startPreliminaryPhase = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    // Generate preliminary questions
    const questions = await dsaAnalysisService.generatePreliminaryQuestions(session.topic, session.level);

    const preliminaryQuestions = questions.map((q, index) => ({
        question: q,
        askedAt: Date.now() + index
    }));

    session.status = "preliminary";
    session.startedAt = new Date();
    session.preliminaryQuestions = preliminaryQuestions as any;
    await session.save();

    return apiResponse(res, 200, "Preliminary phase started", {
        session,
        questions: questions
    });
});

/* =========================
   Submit Preliminary Answers
========================= */

export const submitPreliminaryAnswers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { answers } = req.body; // Array of { question, answer, timestamp }

    if (!answers || !Array.isArray(answers)) {
        throw new ApiError(400, "Answers array is required");
    }

    const session = await DSAInterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    if (session.status !== "preliminary") {
        throw new ApiError(400, "Session is not in preliminary phase");
    }

    // Save answers
    session.preliminaryAnswers = answers as any;
    session.preliminaryEndedAt = new Date();

    // Analyze answers using AI
    const questionsAndAnswers = answers.map(a => ({
        question: a.question,
        answer: a.answer
    }));

    const analysis = await dsaAnalysisService.analyzePreliminaryAnswers(session.topic, questionsAndAnswers);

    session.preliminaryScore = analysis.score;

    await session.save();

    return apiResponse(res, 200, "Preliminary answers submitted", {
        score: analysis.score,
        feedback: analysis.feedback
    });
});

/* =========================
   Start Coding Phase
========================= */

export const startCodingPhase = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    // Generate 4 coding questions
    const questions = await dsaAnalysisService.generateCodingQuestions(session.topic, session.level);

    session.status = "coding";
    session.codingStartedAt = new Date();
    session.codingQuestions = questions as any;
    await session.save();

    return apiResponse(res, 200, "Coding phase started", {
        questions,
        timeLimit: session.codingTimeLimit
    });
});

/* =========================
   Submit Code Solution
========================= */

export const submitCodeSolution = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { questionNumber, code, language } = req.body;

    if (!questionNumber || !code) {
        throw new ApiError(400, "Question number and code are required");
    }

    const session = await DSAInterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    if (session.status !== "coding") {
        throw new ApiError(400, "Session is not in coding phase");
    }

    // Find the question
    const question = session.codingQuestions.find(q => q.questionNumber === questionNumber);

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Analyze the code
    const analysis = await dsaAnalysisService.analyzeCodeSolution(
        question.description,
        code,
        language || "javascript"
    );

    // Calculate score based on code quality
    const score = analysis.codeQuality * 10; // Convert 0-10 to 0-100

    // Create solution object
    const solution = {
        questionNumber,
        code,
        language: language || "javascript",
        submittedAt: new Date(),
        score,
        aiAnalysis: analysis
    };

    // Check if solution already exists for this question
    const existingIndex = session.userSolutions.findIndex(s => s.questionNumber === questionNumber);

    if (existingIndex >= 0) {
        // Update existing solution
        session.userSolutions[existingIndex] = solution as any;
    } else {
        // Add new solution
        session.userSolutions.push(solution as any);
    }

    await session.save();

    return apiResponse(res, 200, "Solution submitted successfully", {
        score,
        analysis
    });
});

/* =========================
   Complete Interview & Generate Scorecard
========================= */

export const completeInterview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findById(sessionId);

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    session.status = "completed";
    session.endedAt = new Date();

    // Calculate total duration
    if (session.startedAt) {
        session.totalDuration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
    }

    // Calculate scores
    const preliminaryScore = session.preliminaryScore || 0;

    // Coding score (average of all solutions)
    const codingScore = session.userSolutions.length > 0
        ? session.userSolutions.reduce((sum, s) => sum + s.score, 0) / session.userSolutions.length
        : 0;

    // Code quality score (average of all code quality ratings)
    const codeQualityScore = session.userSolutions.length > 0
        ? session.userSolutions.reduce((sum, s) => sum + (s.aiAnalysis?.codeQuality || 0), 0) / session.userSolutions.length * 10
        : 0;

    // Time management score
    const expectedTime = session.codingTimeLimit;
    const actualTime = session.codingStartedAt && session.endedAt
        ? Math.floor((session.endedAt.getTime() - session.codingStartedAt.getTime()) / 1000)
        : expectedTime;

    const timeManagementScore = actualTime <= expectedTime
        ? 100
        : Math.max(0, 100 - ((actualTime - expectedTime) / expectedTime * 100));

    // Final score (weighted average)
    const finalScore = (
        preliminaryScore * 0.2 +
        codingScore * 0.5 +
        codeQualityScore * 0.2 +
        timeManagementScore * 0.1
    );

    session.breakdown = {
        preliminaryScore,
        codingScore,
        codeQualityScore,
        timeManagementScore
    };

    session.finalScore = Math.round(finalScore);

    // Generate overall feedback
    const feedbackData = await dsaAnalysisService.generateOverallFeedback(
        session.topic,
        session.level,
        preliminaryScore,
        codingScore,
        codeQualityScore,
        timeManagementScore
    );

    session.overallFeedback = feedbackData.feedback;
    session.aiRecommendations = feedbackData.recommendations;

    await session.save();

    return apiResponse(res, 200, "Interview completed successfully", {
        finalScore: session.finalScore,
        breakdown: session.breakdown,
        feedback: session.overallFeedback,
        recommendations: session.aiRecommendations,
        session
    });
});

/* =========================
   Get Scorecard
========================= */

export const getScorecard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findById(sessionId).populate("userId", "name email");

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    if (session.status !== "completed") {
        throw new ApiError(400, "Interview is not completed yet");
    }

    const scorecard = {
        sessionId: session._id,
        user: session.userId,
        topic: session.topic,
        level: session.level,
        finalScore: session.finalScore,
        breakdown: session.breakdown,
        preliminaryAnswers: session.preliminaryAnswers.length,
        codingQuestionsSolved: session.userSolutions.length,
        totalQuestions: session.codingQuestions.length,
        duration: session.totalDuration,
        feedback: session.overallFeedback,
        recommendations: session.aiRecommendations,
        completedAt: session.endedAt,
        solutions: session.userSolutions.map(s => ({
            questionNumber: s.questionNumber,
            score: s.score,
            codeQuality: s.aiAnalysis?.codeQuality,
            timeComplexity: s.aiAnalysis?.timeComplexity,
            spaceComplexity: s.aiAnalysis?.spaceComplexity
        }))
    };

    return apiResponse(res, 200, "Scorecard fetched successfully", scorecard);
});

/* =========================
   Cancel Interview
========================= */

export const cancelDSAInterview = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    const session = await DSAInterviewSession.findByIdAndUpdate(
        sessionId,
        { status: "cancelled" },
        { new: true }
    );

    if (!session) {
        throw new ApiError(404, "DSA interview session not found");
    }

    return apiResponse(res, 200, "Interview cancelled successfully", session);
});
