import express from "express";
import { subscribe, getStatus } from "../controllers/subscriptionControllers.js";

const router = express.Router();

// POST /api/subscription/subscribe  — activate a plan
router.post("/subscribe", subscribe);

// GET /api/subscription/status  — check current subscription
router.get("/status", getStatus);

export default router;
