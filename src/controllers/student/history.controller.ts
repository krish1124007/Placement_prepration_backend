import { InterviewSession } from "../../models/interview.models.js";
import { Plan } from "../../models/plan.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";

// Get combined history (interviews + plans) for a user
export const getUserHistory = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    // Fetch all interviews for the user
    const interviews = await InterviewSession.find({ userId })
        .select('topic level status createdAt startedAt endedAt duration performanceAnalysis transcriptions')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Fetch all plans for the user
    const plans = await Plan.find({ createdBy: userId })
        .select('name createdAt updatedAt topics dsa aptitude competition duration status')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    // Transform interviews to history format
    const interviewHistory = interviews.map(interview => {
        const score = interview.performanceAnalysis?.overallScore || 0;
        const feedback = interview.performanceAnalysis?.summary || '';

        // Extract topics from transcriptions or use topic
        const topics = interview.topic ? [interview.topic] : [];

        return {
            id: interview._id,
            type: 'interview',
            title: `${interview.topic || 'Interview'} - ${interview.level || 'General'} Level`,
            date: interview.createdAt,
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
        // Calculate total tasks and completed tasks
        const allTasks = [
            ...(plan.dsa || []),
            ...(plan.aptitude || []),
            ...(plan.competition || [])
        ];

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(task => task.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Determine status based on progress
        let status = 'in-progress';
        if (progress === 100) {
            status = 'completed';
        } else if (progress === 0 && plan.status === 'inactive') {
            status = 'not-started';
        }

        // Extract topics
        const topics = plan.topics || [];

        return {
            id: plan._id,
            type: 'plan',
            title: plan.name || 'Study Plan',
            date: plan.createdAt,
            time: new Date(plan.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }),
            duration: plan.duration ? `${plan.duration} days` : 'N/A',
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

    // Count achievements (e.g., high scores, completed plans)
    const achievements = interviews.filter(i => (i.performanceAnalysis?.overallScore || 0) >= 80).length +
        plans.filter(p => {
            const allTasks = [...(p.dsa || []), ...(p.aptitude || []), ...(p.competition || [])];
            const completedTasks = allTasks.filter(t => t.completed).length;
            return allTasks.length > 0 && completedTasks === allTasks.length;
        }).length;

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
