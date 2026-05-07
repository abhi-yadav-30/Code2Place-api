import dotenv from "dotenv";
dotenv.config();

import app from "./api/index.js";
import { connectDB } from "./db.js";

import express from "express";

app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 5000;


connectDB();

app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
