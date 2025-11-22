// routes/questions.routes.js
import express from "express";
import {
  getAllQuestions,
  getQuestionById,
  addQuestion,
  runCode,
  submitCode,
} from "../controllers/questionControllers.js";

const router = express.Router();

// GET all questions
router.post("/run", runCode);

// GET question by _id
router.post("/submit", submitCode);

// POST create new question
router.get("/questions", getAllQuestions);
router.get("/questions/:id", getQuestionById);
router.post("/add-question", addQuestion);

export default router;
