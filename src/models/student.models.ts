import type { IStudent } from "../interfaces/student.interfaces.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type IStudentDocument = IStudent & mongoose.Document

const StudentSchema = new mongoose.Schema<IStudentDocument>({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    googleId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ["student", "alumni"],
        default: "student"
    },
    branch: {
        type: String,
        required: false
    },
    passing_year: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    about: {
        type: String,
        required: false
    },
    sem: {
        type: String,
        required: false
    },
    github: {
        type: String
    },
    githubId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    githubUsername: {
        type: String,
        required: false
    },
    githubAccessToken: {
        type: String,
        required: false
    },
    githubRepos: {
        type: [Object],
        required: false
    },
    linkedin: {
        type: String
    },
    leetcode: {
        type: String
    },
    projects: {
        type: [String]
    },
    skills: {
        type: [String]
    },
    achievements: {
        type: [String]
    },
    interests: {
        type: [String]
    },
    ultra_focus_mode: {
        type: Boolean,
        default: false
    }
})



StudentSchema.pre("save", async function () {
    if (this.isModified("password") && this.password) {
        const hashedPassword = await bcrypt.hash(this.password as string, 10);
        this.password = hashedPassword;
    }
})


StudentSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(password, this.password)
}


StudentSchema.methods.generateAccessToken = function (): string {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET as string, { expiresIn: "10d" })
}



export const Student = mongoose.model<IStudentDocument>("Student", StudentSchema)
