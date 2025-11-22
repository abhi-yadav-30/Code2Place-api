import Note from "../models/notesSchema.js";
import User from "../models/userSchema.js";

// export const uploadNote = async (req, res) => {
//   try {
//     const { courseName, moduleNumber } = req.body;
//     console.log(courseName,moduleNumber);

//     if (!req.file) {
//       return res.status(400).json({ error: "PDF file is required" });
//     }
//     console.log({
//       courseName,
//       moduleNumber,
//       fileUrl: req.file.path, // Cloudinary URL
//       cloudinaryId: req.file.filename, // Cloudinary public_id
//       uploadedBy: req.userId,
//     });
//     const note = await Note.create({
//       courseName,
//       moduleNumber,
//       fileUrl: req.file.path, // Cloudinary URL
//       cloudinaryId: req.file.filename, // Cloudinary public_id
//       uploadedBy: req.userId,
//     });

//     // Link to user
//     await User.findByIdAndUpdate(req.userId, {
//       $push: { resources: { fileId: note._id } },
//       $inc: { resourceSharingScore: 10 },
//     });

//     // console.log(note);

//     res.json({
//       message: "Notes uploaded successfully",
//       note,
//     });
//   } catch (error) {
//     console.error("Error uploading note:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const getPdfUrl = (publicId) => {
  return cloudinary.v2.utils.private_download_url(publicId, "pdf", {
    resource_type: "raw",
    type: "upload",
    expires_at: Math.floor(Date.now() / 1000) + 3600, // expires in 1 hour
  });
};

import { supabase } from "../supabase.js";

// export const uploadNote = async (req, res) => {
//   try {

//     // Convert buffer -> base64
//     const base64 = req.file.buffer.toString("base64");
//     const fileUri = `data:application/pdf;base64,${base64}`;

//     // Upload to Cloudinary
//     const result = await cloudinary.uploader.upload(fileUri, {
//       folder: "notes",
//       resource_type: "raw",
//       format: "pdf",
//     });

//     // Save to DB
//     const note = await Note.create({
//       courseName: req.body.courseName,
//       moduleNumber: req.body.moduleNumber,
//       fileUrl: result.secure_url,
//       cloudinaryId: getPdfUrl(result.public_id),
//       uploadedBy: req.userId,
//     });

//     // Give user points + store ref
//     await User.findByIdAndUpdate(req.userId, {
//       $push: { resources: note._id },
//       $inc: { resourceSharingScore: 10 },
//     });

//     return res.status(201).json(note);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

export const uploadNote = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "PDF file is required" });

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from("notes")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) return res.status(500).json({ error });

    // generate public URL
    const { publicUrl } = supabase.storage
      .from("notes")
      .getPublicUrl(fileName).data;

    const note = await Note.create({
      courseName: req.body.courseName,
      moduleNumber: req.body.moduleNumber,
      fileUrl: publicUrl,
      // cloudinaryId: getPdfUrl(result.public_id),
      uploadedBy: req.userId,
    });

    // Give user points + store ref
    await User.findByIdAndUpdate(req.userId, {
      $push: { resources: note._id },
      $inc: { resourceSharingScore: 10 },
    });

    return res.status(201).json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
};

// GET: /notes/courses
export const getAllCourseNames = async (req, res) => {
  try {
    // fetch unique course names
    const courses = await Note.distinct("courseName");

    res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET: /notes?courseName=JAVA&moduleNumber=2
export const getNotesByCourseAndModule = async (req, res) => {
  try {
    const { courseName, moduleNumber } = req.query;

    if (!courseName || !moduleNumber) {
      return res
        .status(400)
        .json({ message: "courseName and moduleNumber are required" });
    }

    const notes = await Note.find({
      courseName,
      moduleNumber: Number(moduleNumber),
    }).populate("uploadedBy", "name username createdAt");
    // console.log(notes);
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
