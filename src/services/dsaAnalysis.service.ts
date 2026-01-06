import Groq from "groq-sdk";

const getGroqClient = () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY is not set in environment variables");
    }
    return new Groq({ apiKey });
};

/* =========================
   Generate Preliminary Questions
========================= */

export const generatePreliminaryQuestions = async (
    topic: string,
    level: string
): Promise<string[]> => {
    const groq = getGroqClient();

    const prompt = `You are an expert technical interviewer conducting a DSA interview on "${topic}" for a ${level} level candidate.

Generate exactly 5 preliminary theoretical questions about ${topic} to assess the candidate's understanding before coding challenges.

Questions should:
- Test fundamental concepts
- Be clear and concise
- Range from basic to advanced based on ${level} level
- Not require coding, just verbal/conceptual answers

Return ONLY a JSON array of 5 questions, nothing else. Format:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content || "[]";
        const questions = JSON.parse(response);

        return Array.isArray(questions) ? questions : [];
    } catch (error) {
        console.error("Error generating preliminary questions:", error);
        // Fallback questions
        return [
            `What is ${topic} and why is it important in programming?`,
            `Explain the time complexity of common ${topic} operations.`,
            `What are the main advantages and disadvantages of ${topic}?`,
            `Describe a real-world use case for ${topic}.`,
            `What are some common pitfalls when working with ${topic}?`
        ];
    }
};

/* =========================
   Generate Coding Questions
========================= */

export const generateCodingQuestions = async (
    topic: string,
    level: string
): Promise<any[]> => {
    const groq = getGroqClient();

    const difficultyMap: Record<string, string[]> = {
        "Junior": ["Easy", "Easy", "Medium", "Medium"],
        "Mid-Level": ["Easy", "Medium", "Medium", "Hard"],
        "Senior": ["Medium", "Medium", "Hard", "Hard"],
        "Expert": ["Medium", "Hard", "Hard", "Hard"]
    };

    const difficulties = difficultyMap[level] || ["Easy", "Medium", "Medium", "Hard"];

    const prompt = `You are an expert technical interviewer. Generate exactly 4 coding questions about "${topic}" for a ${level} level candidate.

Difficulties: ${difficulties.join(", ")}

For each question, provide:
1. Title (concise)
2. Description (clear problem statement)
3. Difficulty level
4. Constraints
5. 2 examples with input, output, and explanation
6. 3 test cases (2 visible, 1 hidden)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "questionNumber": 1,
    "title": "Question Title",
    "description": "Problem description",
    "difficulty": "Easy",
    "constraints": "Constraints here",
    "examples": [
      {"input": "example input", "output": "example output", "explanation": "why"},
      {"input": "example input 2", "output": "example output 2", "explanation": "why"}
    ],
    "testCases": [
      {"input": "test1", "expectedOutput": "output1", "isHidden": false},
      {"input": "test2", "expectedOutput": "output2", "isHidden": false},
      {"input": "test3", "expectedOutput": "output3", "isHidden": true}
    ]
  }
]

Generate all 4 questions with difficulties: ${difficulties.join(", ")}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_tokens: 4096,
        });

        const response = completion.choices[0]?.message?.content || "[]";

        // Try to extract JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            return Array.isArray(questions) ? questions : [];
        }

        return [];
    } catch (error) {
        console.error("Error generating coding questions:", error);
        return getFallbackQuestions(topic, difficulties);
    }
};

/* =========================
   Analyze Code Solution
========================= */

export const analyzeCodeSolution = async (
    question: string,
    code: string,
    language: string = "javascript"
): Promise<any> => {
    const groq = getGroqClient();

    const prompt = `You are an expert code reviewer. Analyze this solution:

**Question:** ${question}

**Code (${language}):**
\`\`\`${language}
${code}
\`\`\`

Provide a detailed analysis in JSON format:
{
  "timeComplexity": "O(...) with explanation",
  "spaceComplexity": "O(...) with explanation",
  "codeQuality": 8,
  "approach": "Brief description of the approach used",
  "suggestions": ["Improvement 1", "Improvement 2"],
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"]
}

Code quality should be 0-10 based on:
- Correctness
- Efficiency
- Readability
- Best practices

Return ONLY valid JSON, nothing else.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 2048,
        });

        const response = completion.choices[0]?.message?.content || "{}";

        // Try to extract JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return getDefaultAnalysis();
    } catch (error) {
        console.error("Error analyzing code:", error);
        return getDefaultAnalysis();
    }
};

/* =========================
   Analyze Preliminary Answers
========================= */

export const analyzePreliminaryAnswers = async (
    topic: string,
    questionsAndAnswers: Array<{ question: string; answer: string }>
): Promise<{ score: number; feedback: string }> => {
    const groq = getGroqClient();

    const qaText = questionsAndAnswers
        .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
        .join("\n\n");

    const prompt = `You are an expert technical interviewer evaluating preliminary answers for a DSA interview on "${topic}".

Questions and Answers:
${qaText}

Evaluate the answers and provide:
1. A score out of 100
2. Brief feedback (2-3 sentences)

Return ONLY valid JSON:
{
  "score": 85,
  "feedback": "Your feedback here"
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            max_tokens: 512,
        });

        const response = completion.choices[0]?.message?.content || "{}";
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                score: result.score || 0,
                feedback: result.feedback || "No feedback available"
            };
        }

        return { score: 50, feedback: "Unable to analyze answers" };
    } catch (error) {
        console.error("Error analyzing preliminary answers:", error);
        return { score: 50, feedback: "Error during analysis" };
    }
};

/* =========================
   Generate Overall Feedback
========================= */

export const generateOverallFeedback = async (
    topic: string,
    level: string,
    preliminaryScore: number,
    codingScore: number,
    codeQualityScore: number,
    timeManagementScore: number
): Promise<{ feedback: string; recommendations: string[] }> => {
    const groq = getGroqClient();

    const prompt = `You are an expert technical interviewer providing final feedback for a ${level} level DSA interview on "${topic}".

Scores:
- Preliminary Questions: ${preliminaryScore}/100
- Coding Challenges: ${codingScore}/100
- Code Quality: ${codeQualityScore}/100
- Time Management: ${timeManagementScore}/100

Provide:
1. Overall feedback (3-4 sentences)
2. 3-5 specific recommendations for improvement

Return ONLY valid JSON:
{
  "feedback": "Overall feedback here",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 1024,
        });

        const response = completion.choices[0]?.message?.content || "{}";
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return {
                feedback: result.feedback || "Good effort overall.",
                recommendations: result.recommendations || ["Keep practicing"]
            };
        }

        return {
            feedback: "Good effort overall. Continue practicing to improve your skills.",
            recommendations: ["Practice more coding problems", "Review fundamental concepts", "Focus on time complexity"]
        };
    } catch (error) {
        console.error("Error generating overall feedback:", error);
        return {
            feedback: "Interview completed. Keep practicing!",
            recommendations: ["Continue learning", "Practice regularly"]
        };
    }
};

/* =========================
   Helper Functions
========================= */

function getDefaultAnalysis() {
    return {
        timeComplexity: "Unable to analyze",
        spaceComplexity: "Unable to analyze",
        codeQuality: 5,
        approach: "Solution submitted",
        suggestions: ["Review the solution"],
        strengths: ["Code submitted"],
        weaknesses: ["Unable to analyze automatically"]
    };
}

function getFallbackQuestions(topic: string, difficulties: string[]) {
    return difficulties.map((difficulty, index) => ({
        questionNumber: index + 1,
        title: `${topic} Problem ${index + 1}`,
        description: `Solve a ${difficulty} level problem related to ${topic}.`,
        difficulty,
        constraints: "Standard constraints apply",
        examples: [
            { input: "Example input", output: "Example output", explanation: "Explanation" }
        ],
        testCases: [
            { input: "test1", expectedOutput: "output1", isHidden: false },
            { input: "test2", expectedOutput: "output2", isHidden: true }
        ]
    }));
}
