export interface IDSAQuestion {
    questionNumber: number;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    constraints?: string;
    examples: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    testCases: Array<{
        input: string;
        expectedOutput: string;
        isHidden?: boolean;
    }>;
}

export interface IUserSolution {
    questionNumber: number;
    code: string;
    language: string;
    submittedAt: Date;
    testResults?: Array<{
        testCaseIndex: number;
        passed: boolean;
        actualOutput: string;
        expectedOutput: string;
        executionTime: number;
    }>;
    score: number;
    aiAnalysis?: {
        timeComplexity: string;
        spaceComplexity: string;
        codeQuality: number;
        approach: string;
        suggestions: string[];
        strengths: string[];
        weaknesses: string[];
    };
}

export interface IPreliminaryAnswer {
    question: string;
    answer: string;
    timestamp: number;
}

export interface IDSAInterviewSession {
    userId: string;
    topic: string;
    level: "Junior" | "Mid-Level" | "Senior" | "Expert";
    status: "scheduled" | "preliminary" | "coding" | "completed" | "cancelled";

    preliminaryQuestions: Array<{
        question: string;
        askedAt: number;
    }>;
    preliminaryAnswers: IPreliminaryAnswer[];
    preliminaryScore: number;

    codingQuestions: IDSAQuestion[];
    userSolutions: IUserSolution[];

    startedAt?: Date;
    preliminaryEndedAt?: Date;
    codingStartedAt?: Date;
    endedAt?: Date;
    totalDuration?: number;
    codingTimeLimit: number;

    finalScore: number;
    breakdown?: {
        preliminaryScore: number;
        codingScore: number;
        codeQualityScore: number;
        timeManagementScore: number;
    };
    overallFeedback?: string;
    aiRecommendations?: string[];

    attemptNumber: number;
}
