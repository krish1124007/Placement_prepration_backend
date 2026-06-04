import mongoose from "mongoose";


const learningSchema = new mongoose.Schema({
    
    question:{
        type:String,
        required:true
    },
    disscription:{
        type:String,
        required:false
    }
    
})


export const learning = mongoose.model("learning",learningSchema)