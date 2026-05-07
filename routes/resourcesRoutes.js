import express from "express";
// import upload from "../middlewares.js";
import {
  getAllCourseNames,
  getNotesByCourseAndModule,
  uploadNote,
} from "../controllers/resourcesControllers.js";
import { auth } from "../middlewares.js";
// import multer from "multer";


const router = express.Router();

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "college-notes",
//     resource_type: "raw",
//     format: "pdf", // <— forces .pdf extension
//     public_id: (req, file) => `${Date.now()}`,
//   },
// });

// const upload = multer({ storage });
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({ storage });


router.post(
  "/upload",
  auth, // user must be logged in
  upload.single("file"),
  uploadNote
);



router.get("/courses", getAllCourseNames);
router.get("/getNotes", getNotesByCourseAndModule);
export default router;
