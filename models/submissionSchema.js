import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    language: {
      type: Object, // { monaco: "python", judge: 71 }
      required: true,
    },

    runtime: Number,
    memory: Number,

    status: {
      isPassed: { type: Boolean , }, // true = pass, false = fail
      verdict: {
        // detailed reason
        type: String,
        enum: [
          "Accepted",
          "Wrong Answer",
          "Time Limit Exceeded",
          "Runtime Error",
          "Compilation Error",
          "Unknown Error",
        ],
        default: "Wrong Answer",
      },
    },

    source_code: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt
);

export default mongoose.model("Submission", submissionSchema);
