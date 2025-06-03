import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
   try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`\n MongoDB Connected Successfully! DB HOST : ${connectionInstance.connection.host} \n`);
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1); // Exit the process with failure
    }
};

export default connectDB;