import { Planner } from "../../models/planp.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import { createPlanAgent } from "../../ai/agents/createplan.agent.js";
import type { Request, Response, NextFunction } from "express";
import { Plan } from "../../models/plan.models.js";
import mongoose from "mongoose";




const createPlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { subject, duration, isGithubUse, experice, language, planguage, dsa, aptitude, interview, projects } = req.body;

    const userID = (req.user as any)?._id;

    if (!subject || !duration || !isGithubUse || !experice || !language || !planguage || !dsa || !aptitude || !interview || !projects) {
        throw new ApiError(400, "All fields are required");
    }

    const plan = await createPlanAgent(subject, duration, isGithubUse, experice, language, planguage, dsa, aptitude, interview, projects);


    return apiResponse(res, 200, "Plan created successfully", {
        status: "success",
        data: plan
    })

})


const savePlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { payload, plan } = req.body;

    const plan_ = await Plan.create(plan);

    const newPlan = await Planner.create({
        userID: (req.user as any)?._id,
        ...payload,
        plan: plan_._id
    })

    if (!newPlan) {
        throw new ApiError(400, "Plan not created");
    }

    return apiResponse(res, 200, "Plan saved successfully", {
        status: "success",
        data: newPlan
    })
})


const getMyAllPlan = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const allMyPlans = await Planner.find({ userID: (req.user as any)?._id })

    if (!allMyPlans) {
        throw new ApiError(400, "No plans found");
    }

    return apiResponse(res, 200, "Plans fetched successfully", {
        status: "success",
        data: allMyPlans
    })
})


const getPlanDetails = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const planDetails = await Planner.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(id) }
        },
        {
            $lookup: {
                from: "plans", // Ensure this matches your Plan model's collection name
                localField: "plan",
                foreignField: "_id",
                as: "planDetails"
            }
        },
        {
            $unwind: "$planDetails"
        }
    ]);

    if (!planDetails || planDetails.length === 0) {
        throw new ApiError(404, "Plan not found");
    }

    return apiResponse(res, 200, "Plan details fetched successfully", {
        status: "success",
        data: planDetails[0]
    });
});

const getScheduleTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userID = (req.user as any)?._id;

    // Fetch all plans for the user with populated plan details
    const userPlans = await Planner.aggregate([
        {
            $match: { userID: new mongoose.Types.ObjectId(userID) }
        },
        {
            $lookup: {
                from: "plans",
                localField: "plan",
                foreignField: "_id",
                as: "planDetails"
            }
        },
        {
            $unwind: {
                path: "$planDetails",
                preserveNullAndEmptyArrays: true
            }
        }
    ]);

    // Organize tasks by date
    interface TasksByDate {
        [date: string]: Array<{
            topic: string;
            type: string;
            planSubject: string;
            planId: string;
        }>;
    }

    const tasksByDate: TasksByDate = {};

    userPlans.forEach((planDoc) => {
        if (!planDoc.planDetails) return;

        const planDetails = planDoc.planDetails;
        const planSubject = planDoc.subject;
        const planId = planDoc._id.toString();

        // Process Aptitude tasks
        if (planDetails.aptitude && Array.isArray(planDetails.aptitude)) {
            planDetails.aptitude.forEach((task: any) => {
                if (task.date) {
                    if (!tasksByDate[task.date]) {
                        tasksByDate[task.date] = [];
                    }
                    (tasksByDate[task.date] as any).push({
                        topic: task.topic,
                        type: 'Aptitude',
                        planSubject,
                        planId
                    });
                }
            });
        }

        // Process DSA tasks
        if (planDetails.dsa && Array.isArray(planDetails.dsa)) {
            planDetails.dsa.forEach((task: any) => {
                if (task.date) {
                    if (!tasksByDate[task.date]) {
                        tasksByDate[task.date] = [];
                    }
                    (tasksByDate[task.date] as any).push({
                        topic: task.topic,
                        type: 'DSA',
                        planSubject,
                        planId
                    });
                }
            });
        }

        // Process Subject tasks
        if (planDetails.subject && Array.isArray(planDetails.subject)) {
            planDetails.subject.forEach((subjectItem: any) => {
                if (subjectItem.topics && Array.isArray(subjectItem.topics)) {
                    subjectItem.topics.forEach((task: any) => {
                        if (task.date) {
                            if (!tasksByDate[task.date]) {
                                tasksByDate[task.date] = [];
                            }
                            (tasksByDate[task.date] as any).push({
                                topic: task.topic,
                                type: subjectItem.name || 'Subject',
                                planSubject,
                                planId
                            });
                        }
                    });
                }
            });
        }
    });

    return apiResponse(res, 200, "Schedule tasks fetched successfully", {
        status: "success",
        data: tasksByDate
    });
});

const updateTaskCompletion = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { section, index, subIndex, completed } = req.body;

    if (!id || section === undefined || index === undefined || completed === undefined) {
        throw new ApiError(400, "Missing required fields");
    }

    const planDoc = await Planner.findById(id);
    if (!planDoc) {
        throw new ApiError(404, "Plan not found");
    }

    const plan = await Plan.findById(planDoc.plan);
    if (!plan) {
        throw new ApiError(404, "Plan details not found");
    }

    // Update the completion status based on section
    if (section === 'aptitude' && plan.aptitude && plan.aptitude[index]) {
        plan.aptitude[index].competition = completed;
    } else if (section === 'dsa' && plan.dsa && plan.dsa[index]) {
        plan.dsa[index].competition = completed;
    } else if (section === 'subject' && plan.subject && plan.subject[index]) {
        if (subIndex !== undefined && plan.subject[index].topics && plan.subject[index].topics[subIndex]) {
            plan.subject[index].topics[subIndex].competition = completed;
        }
    } else {
        throw new ApiError(400, "Invalid task reference");
    }

    await plan.save();

    return apiResponse(res, 200, "Task updated successfully", {
        status: "success",
        data: plan
    });
});

export {
    createPlan,
    savePlan,
    getMyAllPlan,
    getPlanDetails,
    getScheduleTasks,
    updateTaskCompletion
}