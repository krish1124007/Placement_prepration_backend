import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { Request,Response } from "express";
import {learning} from "../../models/leanring.models.js";


const createLearning = asyncHandler(async(req:Request,res:Response)=>{

    const {question,disscription} = req.body;

    if(!question)
    {
        throw new ApiError(400,"Please Enter question");
    }

    const learn = await learning.create({question,disscription});

    return apiResponse(res,200,"Learning successfully saved" , learn);

})

const listTheLearning = asyncHandler(async(req:Request,res:Response)=>{

    const learn = await learning.find({});

    return apiResponse(res,200,"Successfully fetch the all learnings" , learn);
})


export {
    createLearning,
    listTheLearning
}