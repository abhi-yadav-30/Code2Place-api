import questionSchema from "../models/questionSchema.js";
import User from "../models/userSchema.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -__v") // remove sensitive fields
      .populate("submissions")
      .populate("resources")
      .populate("uploadedQuestions");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // -------------------------
    // 📌 CALCULATE EXTRA FIELDS
    // -------------------------

    // 1. Unique questions solved
    const successfulSubmissions = user.submissions.filter(
      (s) => s.status.isPassed === true
    );

    const uniqueQuestionsSolved = new Set(
      successfulSubmissions.map((s) => s.questionId?.toString())
    );
    const uniqueQuestionIds = [...uniqueQuestionsSolved];

    const solvedQuestions = await questionSchema
      .find({
        _id: { $in: uniqueQuestionIds },
      })
      .select("QueTitle difficultyLevel");

    const noOfInterviews = user.interviewTranscriptions.length;

    const userObj = user.toObject();

    delete userObj.interviewTranscriptions;
    delete userObj.submissions;

    // Add computed fields
    userObj.uniqueQuestionsSolved = uniqueQuestionsSolved.size;
    userObj.resources= user.resources;
    userObj.successfulSubmissions = successfulSubmissions.length;
    userObj.noOfInterviews = noOfInterviews;
    userObj.recentlySolved = solvedQuestions;
    userObj.noOfResources = user.resources.length;

    // Send clean response
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
