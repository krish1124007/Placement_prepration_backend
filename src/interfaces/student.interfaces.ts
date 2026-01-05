import { Document } from "mongoose";


interface IStudent extends Document {
    name?: string,
    email: string,
    password?: string,
    googleId?: string,
    role: "student" | "alumni",
    branch?: string,
    passing_year?: string,
    image?: string,
    about?: string,
    sem?: string,
    github?: string,
    githubId?: string,
    githubUsername?: string,
    githubAccessToken?: string,
    githubRepos?: any[],
    linkedin?: string,
    leetcode?: string,
    projects?: string[],
    skills?: string[],
    achievements?: string[],
    interests?: string[],
    generateAccessToken: () => string,
    comparePassword: (password: string) => Promise<boolean>
}

export type {
    IStudent
}