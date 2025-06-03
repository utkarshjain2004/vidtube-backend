import { app } from "../app.js";
import { Router } from "express";
import { healthcheck } from "../controllers/healthcheck.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
// import multer from "multer";
const router = Router();

// app.get('/api/v1/healthCheck', (req, res) => {
//     res.status(200).json({ message: 'Server is healthy!' });
// });


router.route("/").get(upload.single('avatar'), healthcheck);

export default router;