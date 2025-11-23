import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    // console.log("eheloooo")
    const token = req.cookies?.token;
    // console.log("token : " ,token);
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: "Invalid token" });
  }
};
// middleware/uploadNotes.js
