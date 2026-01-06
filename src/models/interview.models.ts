import type { IInterviewSession } from "../interfaces/interview.interfaces.js";
import mongoose from "mongoose";

type IInterviewSessionDocument = IInterviewSession & mongoose.Document

const InterviewSessionSchema = new mongoose.Schema<IInterviewSessionDocument>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    level: {
        type: String,
        enum: ["Junior", "Mid-Level", "Senior", "Expert"],
        required: true
    },
    tone: {
        type: String,
        enum: ["Professional", "Casual", "Aggressive"],
        default: "Professional"
    },
    status: {
        type: String,
        enum: ["scheduled", "in-progress", "completed", "cancelled"],
        default: "scheduled"
    },
    transcriptions: [{
        speaker: {
            type: String,
            enum: ["User", "AI"],
            required: true
        },
        text: {
            type: String,
            required: true
        },
        timestamp: {
            type: Number,
            required: true
        }
    }],
    startedAt: {
        type: Date,
        required: false
    },
    endedAt: {
        type: Date,
        required: false
    },
    duration: {
        type: Number, // in seconds
        required: false
    },
    feedback: {
        type: String,
        required: false
    },
    // Performance Analysis
    performanceAnalysis: {
        overallScore: {
            type: Number,
            default: 0
        },
        breakdown: {
            technicalKnowledge: Number,
            communication: Number,
            problemSolving: Number,
            confidence: Number,
            clarity: Number
        },
        strengths: [String],
        weaknesses: [String],
        improvements: [String],
        detailedFeedback: String,
        grade: String,
        analyzedAt: Date
    },
    interviewSummary: {
        keyTopicsCovered: [String],
        questionCount: Number,
        responseQuality: String,
        summary: String
    }
}, { timestamps: true })

export const InterviewSession = mongoose.model<IInterviewSessionDocument>("InterviewSession", InterviewSessionSchema)
