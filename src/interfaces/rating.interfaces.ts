import type { Document } from "mongodb";
import type { Types } from "mongoose";


interface IRating{
    star:number;
    userId:Types.ObjectId,
    comment:string
}

export type {IRating}