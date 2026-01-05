import type { IPlan } from "../interfaces/planp.interfaces.js";
import mongoose from "mongoose";
import type { Document } from "mongoose";


type PlannerT = IPlan & Document;

const PlannerSchema = new mongoose.Schema<PlannerT>({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    isGithubUse: {
        type: Boolean,
        required: true
    },
    experice: {
        type: String,
        required: true
    },
    language: {
        type: [String],
        required: true
    },
    planguage: {
        type: [String],
        required: true
    },
    dsa: {
        type: Boolean,
        required: true
    },
    aptitude: {
        type: Boolean,
        required: true
    },
    interview: {
        type: Boolean,
        required: true
    },
    projects: {
        type: Boolean,
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan"
    }
}, { timestamps: true });



export const Planner = mongoose.model<PlannerT>("Planner", PlannerSchema);
