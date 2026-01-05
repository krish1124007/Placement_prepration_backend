import type { Document, Types } from "mongoose";





interface IPlan extends Document {
    //information Which we are take from the user
    userID:Types.ObjectId;
    subject:string;
    duration:string;
    isGithubUse:boolean;
    experice:string;
    language:string[];
    planguage:string[];
    dsa:boolean;
    aptitude:boolean;
    interview:boolean;
    projects:boolean;
    plan?:Types.ObjectId;
}

export type {
    IPlan
}



// on Which Day apptitue test are occure 
// on Which Day DSA round occure
