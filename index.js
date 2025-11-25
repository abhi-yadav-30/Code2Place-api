import app from "./api/index.js";
import dotenv from "dotenv";
import { connectDB } from "./db.js";

dotenv.config();


const PORT = process.env.PORT || 5000;


connectDB();

app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
