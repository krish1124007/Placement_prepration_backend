import { InterviewSession } from "../../models/interview.models.js";
import { DSAInterviewSession } from "../../models/dsaInterview.models.js";
import { Plan } from "../../models/plan.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { Request, Response, NextFunction } from "express";

// Get combined history (interviews + plans) for a user
export const getUserHistory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req.user as any)?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Fetch all regular interviews for the user
    const interviews = await InterviewSession.find({ userId })
        .select('topic level status createdAt startedAt endedAt duration performanceAnalysis transcriptions')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Fetch all DSA interviews (quick interviews) for the user
    const dsaInterviews = await DSAInterviewSession.find({ userId })
        .select('topic level status createdAt startedAt endedAt totalDuration finalScore breakdown preliminaryScore codingQuestions userSolutions')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Fetch all plans (Plan model doesn't have createdBy field)
    const plans = await Plan.find({})
        .select('aptitude dsa subject createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Transform interviews to history format
    const interviewHistory = interviews.map(interview => {
        const score = interview.performanceAnalysis?.overallScore || 0;
        const feedback = interview.interviewSummary?.summary || interview.performanceAnalysis?.detailedFeedback || '';

        // Extract topics from transcriptions or use topic
        const topics = interview.topic ? [interview.topic] : [];

        return {
            id: interview._id,
            type: 'interview',
            title: `${interview.topic || 'Interview'} - ${interview.level || 'General'} Level`,
            date: (interview as any).createdAt,
            time: interview.startedAt ? new Date(interview.startedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : 'N/A',
            duration: interview.duration
                ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s`
                : 'N/A',
            status: interview.status === 'completed' ? 'completed' :
                interview.status === 'in-progress' ? 'in-progress' :
                    interview.status,
            score: Math.round(score),
            feedback,
            topics
        };
    });

    // Transform plans to history format
    const planHistory = plans.map(plan => {
        // Calculate total tasks
        const dsaTasks = plan.dsa || [];
        const aptitudeTasks = plan.aptitude || [];

        const allTasks = [...dsaTasks, ...aptitudeTasks];
        const totalTasks = allTasks.length;

        // Since Plan model doesn't have completed field, set progress to 0
        const progress = 0;

        // Determine status
        let status = totalTasks > 0 ? 'in-progress' : 'not-started';

        // Extract topics from tasks
        const topics = allTasks.map(task => task.topic).filter(Boolean);

        return {
            id: plan._id,
            type: 'plan',
            title: `Study Plan - ${totalTasks} tasks`,
            date: (plan as any).createdAt,
            time: (plan as any).createdAt ? new Date((plan as any).createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : 'N/A',
            duration: `${totalTasks} tasks`,
            status,
            progress,
            topics
        };
    });

    // Transform DSA interviews to history format
    const dsaInterviewHistory = dsaInterviews.map(dsaInterview => {
        const score = dsaInterview.finalScore || 0;
        const questionCount = dsaInterview.codingQuestions?.length || 0;
        const solvedCount = dsaInterview.userSolutions?.length || 0;
        const feedback = `Solved ${solvedCount}/${questionCount} problems. Preliminary: ${dsaInterview.preliminaryScore || 0}%`;
        const topics = dsaInterview.topic ? [dsaInterview.topic, 'DSA', 'Coding'] : ['DSA'];

        return {
            id: dsaInterview._id,
            type: 'interview',
            title: `DSA Interview - ${dsaInterview.topic || 'Quick Interview'} (${dsaInterview.level})`,
            date: (dsaInterview as any).createdAt,
            time: dsaInterview.startedAt ? new Date(dsaInterview.startedAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : 'N/A',
            duration: dsaInterview.totalDuration
                ? `${Math.floor(dsaInterview.totalDuration / 60)}m ${dsaInterview.totalDuration % 60}s`
                : 'N/A',
            status: dsaInterview.status === 'completed' ? 'completed' :
                dsaInterview.status === 'coding' || dsaInterview.status === 'preliminary' ? 'in-progress' :
                    dsaInterview.status,
            score: Math.round(score),
            feedback,
            topics
        };
    });

    // Combine all histories and sort by date (most recent first)
    const combinedHistory = [...interviewHistory, ...dsaInterviewHistory, ...planHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate stats (include both regular and DSA interviews)
    const totalInterviews = interviews.filter(i => i.status === 'completed').length +
        dsaInterviews.filter(i => i.status === 'completed').length;
    const totalPlans = plans.length;

    // Average score across both interview types
    const regularScores = interviews.map(i => i.performanceAnalysis?.overallScore || 0);
    const dsaScores = dsaInterviews.map(i => i.finalScore || 0);
    const allScores = [...regularScores, ...dsaScores];
    const averageScore = allScores.length > 0
        ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
        : 0;

    // Count achievements (high scores from both interview types)
    const achievements = interviews.filter(i => (i.performanceAnalysis?.overallScore || 0) >= 80).length +
        dsaInterviews.filter(i => (i.finalScore || 0) >= 80).length;

    return apiResponse(res, 200, "User history fetched successfully", {
        history: combinedHistory,
        stats: {
            totalInterviews,
            totalPlans,
            averageScore,
            achievements
        }
    });
});
