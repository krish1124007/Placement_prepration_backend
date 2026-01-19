import { InterviewSession } from "../../models/interview.models.js";
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

    // Fetch all interviews for the user
    const interviews = await InterviewSession.find({ userId })
        .select('topic level status createdAt startedAt endedAt duration performanceAnalysis transcriptions')
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

    // Combine and sort by date (most recent first)
    const combinedHistory = [...interviewHistory, ...planHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate stats
    const totalInterviews = interviews.filter(i => i.status === 'completed').length;
    const totalPlans = plans.length;
    const averageScore = interviews.length > 0
        ? Math.round(interviews.reduce((sum, i) => sum + (i.performanceAnalysis?.overallScore || 0), 0) / interviews.length)
        : 0;

    // Count achievements (high score interviews only, since Plan doesn't track completion)
    const achievements = interviews.filter(i => (i.performanceAnalysis?.overallScore || 0) >= 80).length;

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
