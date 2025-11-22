import express from "express";
import { auth } from "../middlewares.js";
import { getUserProfile } from "../controllers/userControllers.js";

const router = express.Router();

router.get("/profile", getUserProfile);

export default router;
