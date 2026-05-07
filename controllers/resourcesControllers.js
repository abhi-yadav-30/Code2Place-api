

import Note from "../models/notesSchema.js";
import User from "../models/userSchema.js";


// GET: /notes/courses


export const uploadNote = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "PDF file is required" });

    const note = await Note.create({
      courseName: req.body.courseName,
      moduleNumber: req.body.moduleNumber,
      fileUrl: `/uploads/${req.file.filename}`,
      uploadedBy: req.userId,
    });

    await User.findByIdAndUpdate(req.userId, {
      $push: { resources: note._id },
      $inc: { resourceSharingScore: 10 },
    });

    return res.status(201).json(note);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

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
