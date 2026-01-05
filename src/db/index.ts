import mongoose from "mongoose";



async function connectDB() {
    try {
        
        const rp = await mongoose.connect(process.env.MONGO_URL as string);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection error",error);
    }
}

export {
    connectDB
}