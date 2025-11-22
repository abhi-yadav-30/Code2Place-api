import express from "express";
import { getSubmissionsByQuestion } from "../controllers/submissionContollers.js";
import { auth } from "../middlewares.js";

const router = express.Router();

// GET all submissions for a specific question
router.get("/:questionId", auth, getSubmissionsByQuestion);

export default router;
