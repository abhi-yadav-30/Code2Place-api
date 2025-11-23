import Groq from "groq-sdk";

import fsSync from "fs";
import fs from "fs";
import dotenv from "dotenv";
import User from "../models/userSchema.js";
import mongoose from "mongoose";
// import logger from "../config/logger.js";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const interviewConfig = {
  role: "softerware Developer",
  round: "Technical interview",
  difficulty: "medium",
};

export const getTranscribe = async (req, res) => {
  try {
    // logger.info("POST /transcribe by %s", req.userId || "unknown");

    if (!req.file) {
      // console.log("helooo");
      // console.log(req.file);
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // logger.debug("File saved as: %s", req.file.filename);

    const file = fsSync.createReadStream(req.file.path);
    // console.log(file);
    const result = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
    });
    try {
      console.log(req.file.path);
      await fs.promises.unlink(req.file.path);
      // logger.debug("Deleted uploaded file %s", req.file.path);
    } catch (err) {
      console.log(err)
      // logger.warn("Failed to delete file %s: %s", req.file.path, err.message);
    }

    // console.log(result.text);
    res.json({ text: result.text });
  } catch (err) {
    console.log(err);
    // logger.error("Transcribe error: %s", err.message);
    // try to cleanup file if exists
    if (req.file && fsSync.existsSync(req.file.path)) {
      try {
        await fs.unlink(req.file.path);
      } catch (e) {
        console.log(e);
        // logger.warn("Cleanup fail");
      }
    }
    return res
      .status(500)
      .json({ error: err.message || "Transcription failed" });
  }
};

export const getQuestion = async (req, res) => {
  try {
    // console.log("hiii.");

    const { answer, prvQuestion,prvAns, userId, sessionId, role, round, difficulty,jd } =
      req.body;
    if (
      !answer ||
      !prvQuestion ||
      !userId ||
      !sessionId ||
      !role ||
      !round ||
      !difficulty
    ) {
      return res.status(500).json({ error: "fields are missing..." });
    }
    // console.log(answer);

    // const completion = await groq.chat.completions.create({
    //   model: "llama-3.1-8b-instant",
    //   messages: [
    //     { role: "system", content: "You are an AI interview simulator." },
    //     { role: "user", content: `User answered: ${answer}` },
    //   ],
    // });

    // console.log({role,round,difficulty});

//     const completion = await groq.chat.completions.create({
//       model: "llama-3.1-8b-instant", // FREE MODEL
//       messages: [
//         {
//           role: "system",
//           content: `
// You are an AI Interview Simulator.

// Your job:
// 1. Give short feedback (1–2 lines) ONLY about the user's previous answer. This feedback must mention:
//    - positive point only if the answer was good or relevant.
//    - One improvement point if needed.
// 2. Give detailed, in-depth feedback explaining how the user can improve overall.
// 3. Generate the next interview question.

// Base everything on:
// - Role: ${role}
// - Round: ${round}
// - Difficulty: ${difficulty}
// - Job discription : ${jd}

// IMPORTANT RULES:
// - You MUST return ONLY a valid JSON object.
// - No explanations, no markdown, no text outside JSON.
// - JSON format (STRICT):

// {
//   "nextQuestion": "string",
//   "shortFeedback": "string",
//   "detailedFeedback": "string"
// }

// If you cannot follow the instructions, return a JSON object with an "error" field.
// `,
//         },
//         {
//           role: "user",
//           content: `The candidate answered: ${answer}. Evaluate and produce JSON.`,
//         },
//       ],
//     });

const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content: `
You are an AI Interview Simulator.

Your tasks for every interaction:

1. Evaluate the user's previous answer.
2. Provide short feedback (1–2 lines) that includes:
   - A positive point (only if the answer was good or relevant).
   - One improvement point (if needed).
3. Provide detailed feedback explaining how the user can improve overall.
4. Generate the next interview question based on:
   - Role: ${role}
   - Round: ${round}
   - Difficulty: ${difficulty}
   - Job Description: ${jd}
5. Provide the correct answer for the next question, written clearly but concisely.

STRICT OUTPUT RULES:
- You MUST return ONLY a valid JSON object.
- No markdown, no explanations, no commentary outside JSON.
- JSON format (STRICT):

{
  "nextQuestion": "string",
  "correctAnswer": "string",
  "shortFeedback": "string",
  "detailedFeedback": "string"
}

If you cannot follow the instructions, return:
{ "error": "Invalid output. Format not followed." }
`,
    },
    {
      role: "user",
      content: `The candidate answered: ${answer}. Evaluate and produce JSON.`,
    },
  ],
});

    // console.log(completion.choices[0].message.content.);

    const raw = completion?.choices?.[0]?.message?.content;
    if (!raw) {
      console.log("AI returned empty response");
      // logger.error("Empty AI response for user %s", userId);
      return res.status(502).json({ error: "AI returned empty response" });
    }

    let parsed;
    try {
      // attempt to find the first JSON block in the response
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1)
        throw new Error("No JSON found");
      const jsonString = raw.substring(firstBrace, lastBrace + 1);
      parsed = JSON.parse(jsonString);
      console.log(parsed);
    } catch (err) {
      // logger.error(
      //   "Failed to parse AI JSON: %s -- raw: %s",
      //   err.message,
      //   raw.slice(0, 200)
      // );
      console.log(err)
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    // console.log(resData.detailedFeedback);

    const updateRes = await User.updateOne(
      { _id: userId, "interviewTranscriptions._id": sessionId },
      {
        $push: {
          "interviewTranscriptions.$.transcription": {
            question: prvQuestion,
            generatedAnswer:prvAns,
            answer,
            feedback: parsed.detailedFeedback,
          },
        },
      }
    );

    // if (updateRes.matchedCount === 0) {
    //   logger.warn(
    //     "User/session not found for push: user=%s session=%s",
    //     userId,
    //     sessionId
    //   );
    //   // still return AI's suggestion so frontend isn't blocked
    // }

    res.json({
      nextQuestion: parsed.nextQuestion,
      correctAnswer:parsed.correctAnswer,
      shortFeedback: parsed.shortFeedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const startInterview = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(userId);

    const session = {
      _id: new mongoose.Types.ObjectId(),
      duration: null,
      createdAt: new Date(),
      transcription: [],
    };

    await User.findByIdAndUpdate(userId, {
      $push: { interviewTranscriptions: session },
    });

    res.json({ sessionId: session._id });
  } catch (err) {
    console.log(err)
    // logger.error("startInterview error: %s", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const endInterview = async (req, res) => {
  try {
    const { userId, sessionId, interviewDurationInSeconds } = req.body;
    console.log(userId, " : ", interviewDurationInSeconds);
    await User.updateOne(
      { _id: userId, "interviewTranscriptions._id": sessionId },
      {
        $set: {
          "interviewTranscriptions.$.duration": interviewDurationInSeconds,
        },
        $inc: { interviewScore: 10 },
      }
    );

    return res.json({ msg: "interview ended" });
  } catch (err) {
    console.log(err)
    // logger.error("endInterview error: %s", err.message);
    return res.json({ error: err });
  }
};

export const getTranscriptionById = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const user = await User.findOne(
      { _id: userId, "interviewTranscriptions._id": sessionId },
      { "interviewTranscriptions.$": 1 }
    );

    if (!user) return res.status(404).json({ message: "Session not found" });

    res.json({ session: user.interviewTranscriptions[0] });
  } catch (err) {
    console.log(err);
    // logger.error("getTranscriptionById error: %s", err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const getAllTranscriptions = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Sort newest first
    const sessions = [...user.interviewTranscriptions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ sessions });
  } catch (err) {
    console.log(err)
    // logger.error("getAllTranscriptions error: %s", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
