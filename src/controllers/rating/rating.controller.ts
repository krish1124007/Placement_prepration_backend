import { Rating } from "../../models/rating.models.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import type { Request,Response } from "express";


const createRating = asyncHandler(async(req:Request,res:Response)=>{

    const {star , comment} = req.body;

    if(!star)
    {
        throw new ApiError(400,"Please Enter star");
    }

    const rate = await Rating.create({star,comment,userId:(req.user as any)._id});

    return apiResponse(res,200,"Rating successfully saved" , rate);

})

const listTheRating = asyncHandler(async(req:Request,res:Response)=>{

    const rate = await Rating.find({});

    return apiResponse(res,200,"successfully fetch the all ratings" , rate);
})


export {
    createRating,
    listTheRating
}