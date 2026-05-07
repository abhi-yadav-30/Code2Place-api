import { register, login, logout, googleAuth } from "../controllers/authControllers.js";
import { auth } from "../middlewares.js";
import express from "express";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth ,logout);
router.post("/google", googleAuth);

export default router;
