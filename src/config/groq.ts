import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    return new Groq({ apiKey });
};


export {
    getGroqClient
}