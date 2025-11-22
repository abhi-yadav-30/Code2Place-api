import express from "express";
import { endInterview, getAllTranscriptions, getQuestion, getTranscribe, getTranscriptionById, startInterview } from "../controllers/interviewControllers.js";
import multer from "multer";
import fs from "fs";
import { v4 as uuid } from "uuid";


const router = express.Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage + validation
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (file.originalname || "").split(".").pop() || "dat";
    cb(null, `${uuid()}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // allow only audio mimetypes
  if (!file.mimetype || !file.mimetype.startsWith("audio/")) {
    return cb(new Error("Only audio files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB
  fileFilter,
});

router.post("/transcribe",upload.single("audio"), getTranscribe);
router.post("/ask", getQuestion);
router.post("/start", startInterview);
router.post("/end", endInterview);
router.get("/transcription/:sessionId/user/:userId",getTranscriptionById);
router.get("/all/:userId", getAllTranscriptions);


export default router;


