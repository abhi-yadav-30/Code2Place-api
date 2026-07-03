import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    submissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Submission",
      },
    ],

    codeScore: { type: Number, default: 0 },

    resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
      },
    ],

    resourceSharingScore: { type: Number, default: 0 },

    uploadedQuestions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    ],
    interviewTranscriptions: [
      {
        createdAt: { type: Date, default: Date.now },
        duration: { type: Number },
        transcription: [
          {
            question: { type: String },
            answer: { type: String },
            feedback: { type: String },
            generatedAnswer: { type: String },
          },
        ],
      },
    ],
    interviewScore: { type: Number, default: 0 },

    // ── Subscription ──────────────────────────────────────────────────────
    isPro: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ["free", "monthly", "annual"],
      default: "free",
    },
    subscriptionExpiresAt: { type: Date, default: null },
    paymentHistory: [
      {
        plan: { type: String },
        amount: { type: Number },
        currency: { type: String, default: "INR" },
        txnId: { type: String },
        paidAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
