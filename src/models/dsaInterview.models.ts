import mongoose from "mongoose";

// DSA Question Schema
const DSAQuestionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        required: true
    },
    constraints: {
        type: String,
        required: false
    },
    examples: [{
        input: String,
        output: String,
        explanation: String
    }],
    testCases: [{
        input: String,
        expectedOutput: String,
        isHidden: {
            type: Boolean,
            default: false
        }
    }]
});

// User Solution Schema
const UserSolutionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: "javascript"
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    testResults: [{
        testCaseIndex: Number,
        passed: Boolean,
        actualOutput: String,
        expectedOutput: String,
        executionTime: Number
    }],
    score: {
        type: Number,
        default: 0
    },
    aiAnalysis: {
        timeComplexity: String,
        spaceComplexity: String,
        codeQuality: Number, // 0-10
        approach: String,
        suggestions: [String],
        strengths: [String],
        weaknesses: [String]
    }
});

// Preliminary Questions Schema
const PreliminaryAnswerSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    }
});

// DSA Interview Session Schema
const DSAInterviewSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    topic: {
        type: String,
        required: true // e.g., "Arrays", "Linked Lists", "Trees", etc.
    },
    level: {
        type: String,
        enum: ["Junior", "Mid-Level", "Senior", "Expert"],
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "preliminary", "coding", "completed", "cancelled"],
        default: "scheduled"
    },

    // Preliminary Phase
    preliminaryQuestions: [{
        question: String,
        askedAt: Number
    }],
    preliminaryAnswers: [PreliminaryAnswerSchema],
    preliminaryScore: {
        type: Number,
        default: 0
    },

    // Coding Phase
    codingQuestions: [DSAQuestionSchema],
    userSolutions: [UserSolutionSchema],

    // Timing
    startedAt: {
        type: Date,
        required: false
    },
    preliminaryEndedAt: {
        type: Date,
        required: false
    },
    codingStartedAt: {
        type: Date,
        required: false
    },
    endedAt: {
        type: Date,
        required: false
    },
    totalDuration: {
        type: Number, // in seconds
        required: false
    },
    codingTimeLimit: {
        type: Number,
        default: 3600 // 1 hour in seconds
    },

    // Final Scoring
    finalScore: {
        type: Number,
        default: 0
    },
    breakdown: {
        preliminaryScore: Number,
        codingScore: Number,
        codeQualityScore: Number,
        timeManagementScore: Number
    },
    overallFeedback: {
        type: String,
        required: false
    },
    aiRecommendations: [String],

    // Metadata
    attemptNumber: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

export const DSAInterviewSession = mongoose.model("DSAInterviewSession", DSAInterviewSessionSchema);
