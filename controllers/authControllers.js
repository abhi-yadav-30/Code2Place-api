import User from "../models/userSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOTP } from "../utils/emailService.js";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !password || !email || !username)
      return res.status(400).json({ msg: "All fields are required" });

    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ msg: "Username already exists" });

    const userExists = await User.findOne({ email });
    
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (userExists) {
      if (userExists.isVerified) {
        return res.status(400).json({ msg: "Email already exists" });
      } else {
        // Update unverified user with new details and fresh OTP
        const hashed = await bcrypt.hash(password, 10);
        userExists.name = name;
        userExists.username = username;
        userExists.password = hashed;
        userExists.otp = otp;
        userExists.otpExpires = otpExpires;
        await userExists.save();
        
        await sendOTP(email, otp);
        return res.status(200).json({ msg: "OTP sent to email", email });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username,
      email,
      password: hashed,
      otp,
      otpExpires,
      isVerified: false,
    });

    await sendOTP(email, otp);
    res.status(201).json({ msg: "OTP sent to email", email });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "User already verified" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ msg: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "User already verified" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(email, otp);
    res.status(200).json({ msg: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!user.isVerified && user.password !== "google_oauth") {
      return res.status(403).json({ msg: "Please verify your email before logging in", unverified: true });
    }

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

import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        username: email.split("@")[0],
        email,
        password: "google_oauth",
        isVerified: true, // Google users are pre-verified
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.json({
      msg: "Google Login success",
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        userId: user._id,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Google login failed" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ msg: "Logged out successfully" });
};

