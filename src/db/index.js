import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// DB connection requires Try Catch-to handle error & Async Await-since takes time

const connectDB = async()=>{
    try {
        const connectionReq = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB connected!! ${connectionReq.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

export default connectDB