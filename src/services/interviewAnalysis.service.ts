import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set in environment variables");
    }
    return new Groq({ apiKey });
};

/* =========================
   Analyze Interview Performance
========================= */

export const analyzeInterviewPerformance = async (
    topic: string,
    level: string,
    transcriptions: Array<{ speaker: string; text: string; timestamp: number }>,
    duration: number
): Promise<{
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
}> => {
    const groq = getGroqClient();

    // Prepare transcript for analysis
    const conversationText = transcriptions
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');

    const prompt = `You are an expert interview evaluator. Analyze this interview performance and provide a comprehensive assessment.

**Interview Details:**
- Topic: ${topic}
- Level: ${level}
- Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds
- Total Exchanges: ${transcriptions.length}

**Conversation Transcript:**
${conversationText}

**Task:**
Evaluate the candidate's performance across multiple dimensions and provide detailed feedback.

**Return a JSON object with this exact structure:**
{
  "overallScore": 85,
  "breakdown": {
    "technicalKnowledge": 90,
    "communication": 85,
    "problemSolving": 80,
    "confidence": 85,
    "clarity": 90
  },
  "strengths": [
    "Demonstrated strong understanding of core concepts",
    "Communicated ideas clearly and concisely",
    "Showed good problem-solving approach"
  ],
  "weaknesses": [
    "Could provide more specific examples",
    "Hesitated on some advanced topics",
    "Could improve depth of technical explanations"
  ],
  "improvements": [
    "Practice explaining complex concepts with real-world examples",
    "Study advanced topics in more depth",
    "Work on confidence when discussing unfamiliar areas",
    "Prepare more concrete examples from past experience"
  ],
  "detailedFeedback": "The candidate showed a solid understanding of ${topic} fundamentals...",
  "grade": "B+"
}

**Scoring Guidelines:**
- Overall Score: 0-100 (weighted average of breakdown scores)
- Each breakdown score: 0-100
- Strengths: 3-5 specific positive observations
- Weaknesses: 3-5 areas needing improvement
- Improvements: 4-6 actionable recommendations
- Grade: A+, A, A-, B+, B, B-, C+, C, C-, D, F
- Detailed Feedback: 3-4 sentences summarizing performance

**Evaluation Criteria:**
1. Technical Knowledge: Accuracy and depth of answers
2. Communication: Clarity, articulation, and structure
3. Problem Solving: Analytical thinking and approach
4. Confidence: Assertiveness and self-assurance
5. Clarity: Ability to explain complex topics simply

Return ONLY the JSON object, nothing else.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 2048,
        });

        const response = completion.choices[0]?.message?.content || "{}";

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);

            // Validate and return
            return {
                overallScore: result.overallScore || 0,
                breakdown: {
                    technicalKnowledge: result.breakdown?.technicalKnowledge || 0,
                    communication: result.breakdown?.communication || 0,
                    problemSolving: result.breakdown?.problemSolving || 0,
                    confidence: result.breakdown?.confidence || 0,
                    clarity: result.breakdown?.clarity || 0
                },
                strengths: result.strengths || [],
                weaknesses: result.weaknesses || [],
                improvements: result.improvements || [],
                detailedFeedback: result.detailedFeedback || "No feedback available",
                grade: result.grade || "N/A"
            };
        }

        return getDefaultAnalysis();
    } catch (error) {
        console.error("Error analyzing interview performance:", error);
        return getDefaultAnalysis();
    }
};

/* =========================
   Generate Interview Summary
========================= */

export const generateInterviewSummary = async (
    topic: string,
    transcriptions: Array<{ speaker: string; text: string }>
): Promise<{
    keyTopicsCovered: string[];
    questionCount: number;
    responseQuality: string;
    summary: string;
}> => {
    const groq = getGroqClient();

    const conversationText = transcriptions
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');

    const prompt = `Analyze this interview conversation and provide a summary.

**Topic:** ${topic}

**Conversation:**
${conversationText}

Provide a JSON response:
{
  "keyTopicsCovered": ["Topic 1", "Topic 2", "Topic 3"],
  "questionCount": 10,
  "responseQuality": "Good/Average/Needs Improvement",
  "summary": "Brief summary of the interview"
}

Return ONLY valid JSON.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content || "{}";
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                keyTopicsCovered: result.keyTopicsCovered || [],
                questionCount: result.questionCount || 0,
                responseQuality: result.responseQuality || "Average",
                summary: result.summary || "Interview completed"
            };
        }

        return {
            keyTopicsCovered: [],
            questionCount: 0,
            responseQuality: "Average",
            summary: "Interview analysis not available"
        };
    } catch (error) {
        console.error("Error generating interview summary:", error);
        return {
            keyTopicsCovered: [],
            questionCount: 0,
            responseQuality: "Average",
            summary: "Interview analysis not available"
        };
    }
};

/* =========================
   Helper Functions
========================= */

function getDefaultAnalysis() {
    return {
        overallScore: 50,
        breakdown: {
            technicalKnowledge: 50,
            communication: 50,
            problemSolving: 50,
            confidence: 50,
            clarity: 50
        },
        strengths: [
            "Completed the interview",
            "Engaged with the interviewer",
            "Attempted to answer questions"
        ],
        weaknesses: [
            "Limited technical depth",
            "Could improve communication clarity",
            "Needs more practice"
        ],
        improvements: [
            "Study the topic more thoroughly",
            "Practice explaining concepts clearly",
            "Prepare specific examples",
            "Work on confidence"
        ],
        detailedFeedback: "The interview was completed. Continue practicing to improve your performance.",
        grade: "C"
    };
}

/* =========================
   Calculate Performance Metrics
========================= */

export const calculatePerformanceMetrics = (
    transcriptions: Array<{ speaker: string; text: string }>,
    duration: number
) => {
    const userMessages = transcriptions.filter(t => t.speaker === "User");
    const aiMessages = transcriptions.filter(t => t.speaker === "AI");

    const avgUserResponseLength = userMessages.length > 0
        ? userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length
        : 0;

    const avgAIResponseLength = aiMessages.length > 0
        ? aiMessages.reduce((sum, m) => sum + m.text.length, 0) / aiMessages.length
        : 0;

    const responseRatio = avgAIResponseLength > 0
        ? avgUserResponseLength / avgAIResponseLength
        : 0;

    return {
        totalExchanges: transcriptions.length,
        userResponses: userMessages.length,
        aiQuestions: aiMessages.length,
        avgUserResponseLength: Math.round(avgUserResponseLength),
        avgAIResponseLength: Math.round(avgAIResponseLength),
        responseRatio: responseRatio.toFixed(2),
        durationMinutes: Math.floor(duration / 60),
        engagementScore: Math.min(100, (userMessages.length / aiMessages.length) * 100)
    };
};
