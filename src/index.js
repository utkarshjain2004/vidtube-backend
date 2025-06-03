import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./.env"
});

const PORT =  process.env.PORT ;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => { // Corrected syntax here
        console.error("Failed to connect to the database:", err);
        process.exit(1); // Exit the process with failure
    });
