import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expected: { type: String, required: true },
  isPrivate: { type: Boolean, default: false },
});

const QuestionSchema = new mongoose.Schema({
  QueTitle: { type: String, required: true },
  QueDescription: { type: String, required: true },
  difficultyLevel: { type: Number, required: true },

  inputFormat: [{ type: String }],
  outputFormat: [{ type: String }],
  constraints: [{ type: String }],
  submissions: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission"
  }
],

  testCases: [TestCaseSchema],
});

export default mongoose.model("Question", QuestionSchema);
