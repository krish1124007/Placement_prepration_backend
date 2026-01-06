import { Plan } from "../../models/plan.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { Response, Request, NextFunction } from "express";

// Mark task as complete
const markTaskComplete = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { planId, section, index, subIndex } = req.body;

    if (!planId || !section || index === undefined) {
        throw new ApiError(400, "Plan ID, section, and index are required");
    }

    const plan = await Plan.findById(planId);

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    // Update the completion status based on section
    if (section === 'aptitude' && plan.aptitude && plan.aptitude[index]) {
        plan.aptitude[index].competition = true;
    } else if (section === 'dsa' && plan.dsa && plan.dsa[index]) {
        plan.dsa[index].competition = true;
    } else if (section === 'subject' && plan.subject && plan.subject[index]) {
        if (subIndex !== null && subIndex !== undefined && plan.subject[index].topics && plan.subject[index].topics[subIndex]) {
            plan.subject[index].topics[subIndex].competition = true;
        }
    } else {
        throw new ApiError(400, "Invalid section or index");
    }

    await plan.save();

    return apiResponse(res, 200, "Task marked as complete", plan);
});

export { markTaskComplete };
