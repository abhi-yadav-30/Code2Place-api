import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    // console.log("eheloooo")
    const token = req.cookies.token;
    // console.log(token);
    if (!token) return res.status(401).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ msg: "Invalid token" });
  }
};
// middleware/uploadNotes.js
