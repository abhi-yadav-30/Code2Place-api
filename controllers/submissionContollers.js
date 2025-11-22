import Submission from "../models/submissionSchema.js";
import User from "../models/userSchema.js";
import Question from "../models/questionSchema.js";

export const createSubmission = async ({
  userId,
  questionId,
  language,
  runtime,
  memory,
  status,
  source_code,
  score,
}) => {
  try {
    const submission = await Submission.create({
      userId,
      questionId,
      language,
      runtime,
      memory,
      status,
      source_code,
      score,
    });

    // Add submission to user
    await User.findByIdAndUpdate(userId, {
      $push: { submissions: submission._id },
      $inc: { codeScore: score || 0 },
    });

    // Add submission to question
    await Question.findByIdAndUpdate(questionId, {
      $push: { submissions: submission._id },
    });

    // res.status(201).json(submission);
  } catch (error) {
    console.log(error);
    // res.status(500).json({ message: "Error creating submission" });
  }
};


export const getSubmissionsByQuestion = async (req, res) => {
  try {
    const userId = req.userId; // from auth middleware
    const { questionId } = req.params;

    const submissions = await Submission.find({
      userId,
      questionId,
    })
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.status(500).json({
      success: false,
      msg: "Server error",
    });
  }
};
