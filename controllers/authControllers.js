import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
  
    const { name, username, email, password } = req.body;

    if (!name || !password || !email || !username)
      return res.status(400).json({ msg: "all the field are required" });

    const UsernNameExists = await User.findOne({ username });
    if (UsernNameExists)
      return res.status(400).json({ msg: "username already exists" });

    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
    });

    res.status(201).json({ msg: "User registered"});
  } catch (err) {
    res.status(500).json({ msg: err.message});
  }
};

export const login = async (req, res) => {
  try {
    // console.log("helo")
    const { email, password } = req.body;
    console.log(email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ msg: "Incorrect email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.json({
      msg: "Login successful",
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        userId: user._id,
      },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ msg: "Logged out successfully" });
};
