import { Document, Types } from "mongoose";

export interface ITranscription {
    speaker: "User" | "AI";
    text: string;
    timestamp: number;
}

export interface IPerformanceAnalysis {
    overallScore: number;
    breakdown: {
        technicalKnowledge: number;
        communication: number;
        problemSolving: number;
        confidence: number;
        clarity: number;
    };
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    detailedFeedback: string;
    grade: string;
    analyzedAt?: Date;
}

export interface IInterviewSummary {
    keyTopicsCovered: string[];
    questionCount: number;
    responseQuality: string;
    summary: string;
}

interface IInterviewSession extends Document {
    userId: Types.ObjectId;
    topic: string;
    description?: string;
    level: "Junior" | "Mid-Level" | "Senior" | "Expert";
    tone?: "Professional" | "Casual" | "Aggressive";
    status: "scheduled" | "in-progress" | "completed" | "cancelled";
    transcriptions: ITranscription[];
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
    feedback?: string;
    performanceAnalysis?: IPerformanceAnalysis;
    interviewSummary?: IInterviewSummary;
}

export type {
    IInterviewSession
}
