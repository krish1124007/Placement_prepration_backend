import type { IPlan } from "../interfaces/plan.interfaces.js";
import mongoose from "mongoose";
import type { Document } from "mongoose";


type Planner = IPlan & Document;


const PlanSchema = new mongoose.Schema<Planner>({

    aptitude:[
        {
            date:{
                type:String,
                required:false
            },
            topic:{
                type:String,
                required:false
            },
            competition:{
                type:Boolean,
                default:false
            }
        }
    ],
    dsa:[
        {
            date:{
                type:String,
                required:false
            },
            topic:{
                type:String,
                required:false
            },
            competition:{
                type:Boolean,
                default:false
            }
        }
    ],
    subject:[
        {
            name:{
                type:String,
                required:false
            },
            topics:[
                {
                    date:{
                        type:String,
                        required:false
                    },
                    topic:{
                        type:String,
                        required:false
                    },
                    competition:{
                        type:Boolean,
                        default:false
                    }
                }
            ],
            competition:{
                type:Boolean,
                default:false
            }
        }
    ]
    
},{timestamps:true})


export const Plan = mongoose.model("Plan" , PlanSchema);

