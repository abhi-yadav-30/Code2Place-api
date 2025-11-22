import express from "express";
import { register, login, logout } from "../controllers/authControllers.js";
import { auth } from "../middlewares.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth ,logout);

export default router;
