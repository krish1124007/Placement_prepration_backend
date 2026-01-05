import Groq from "groq-sdk";

/* =========================
   Types
========================= */

interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

interface SessionData {
    history: ChatMessage[];
    timeout: NodeJS.Timeout;
}

/* =========================
   In-memory session store
========================= */

const sessionHistories = new Map<string, SessionData>();

const SESSION_TTL = 30 * 60 * 1000; // 30 minutes

/* =========================
   Groq Client
========================= */

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set in environment variables");
    }

    return new Groq({ apiKey });
};

/* =========================
   Initialize Interview
========================= */

export const initializeChatSession = (
    sessionId: string,
    topic: string,
    level: string,
    tone: string = "Professional"
): Promise<string> => {

    return new Promise(async (resolve, reject) => {
        // Clear existing session if any
        if (sessionHistories.has(sessionId)) {
            clearSessionHistory(sessionId);
        }

        const systemInstruction = `You are an expert job interviewer for the role of "${topic}".
    Interview level: ${level}
    Tone: ${tone}

    Rules:
    - Ask only ONE question at a time
    - Keep responses concise (2–3 sentences)
    - Ask follow-ups when needed
    - Provide brief feedback
    - End with a short summary when user says "end interview"
    `;

        const history: ChatMessage[] = [
            { role: "system", content: systemInstruction },
            {
                role: "assistant",
                content: `Hello! I'm your AI interviewer. Let's begin. Can you briefly introduce yourself `
            }
        ];

        const timeout = setTimeout(() => {
            sessionHistories.delete(sessionId);
        }, SESSION_TTL);

        sessionHistories.set(sessionId, { history, timeout });

        console.log(`📝 Interview session initialized: ${sessionId}`);

        // Return the initial greeting directly from our predefined history
        // No API call needed for the first generic greeting to save latency
        resolve(history[1]?.content || "Hello! Let's start the interview.");
    });
};

/* =========================
   Send Message (Groq)
========================= */

export const sendMessage = async ( 
    sessionId: string,
    userMessage: string
): Promise<string> => {
    const session = sessionHistories.get(sessionId);

    if (!session) {
        throw new Error("Session not found. Please start the interview first.");
    }

    const { history } = session;

    try {
        // Add user message
        history.push({ role: "user", content: userMessage });

        const groq = getGroqClient();

        const completion = await groq.chat.completions.create({
            messages: history,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stop: null,
            stream: false,
        });

        const aiResponse = completion.choices[0]?.message?.content || "I apologize, I couldn't generate a response.";

        // Add AI response to history
        history.push({ role: "assistant", content: aiResponse });

        return aiResponse;
    } catch (error: any) {
        console.error("❌ Groq AI Error:", error);

        if (error?.status === 429) {
            return "The interview service is temporarily busy. Please wait a few seconds and try again.";
        }

        return "Something went wrong while processing your response. Please try again.";
    }
};

/* =========================
   Utilities
========================= */

export const getConversationHistory = (sessionId: string): any[] => {
    // Convert back to format if needed or return generic
    return sessionHistories.get(sessionId)?.history || [];
};

export const clearSessionHistory = (sessionId: string): any[] => {
    const session = sessionHistories.get(sessionId);
    if (!session) return [];

    clearTimeout(session.timeout);
    sessionHistories.delete(sessionId);

    console.log(`🗑️ Session cleared: ${sessionId}`);
    return session.history;
};

export const getActiveSessionCount = (): number => {
    return sessionHistories.size;
};
