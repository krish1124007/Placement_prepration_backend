import type { IRating } from "../interfaces/rating.interfaces.js";
import mongoose, { Document } from "mongoose";


type RatingSchemaDefinder = IRating & Document;

const RatingSchema = new mongoose.Schema<RatingSchemaDefinder>({
    star:{
        type:Number
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Student"
    },
    comment:{
        type:String
    }
})


export const Rating = mongoose.model("Rating",RatingSchema);