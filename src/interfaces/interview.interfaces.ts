import { Document, Types } from "mongoose";

export interface ITranscription {
    speaker: "User" | "AI";
    text: string;
    timestamp: number;
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
}

export type {
    IInterviewSession
}
