import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireFields } from "../utils/validators.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const error = requireFields(req.body, ["name", "email", "password"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  });
});

router.post("/login", async (req, res) => {
  const error = requireFields(req.body, ["email", "password"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString());

  user.refreshToken = refreshToken;
  await user.save();

  return res.json({
    user: { id: user._id, name: user.name, email: user.email },
    accessToken,
    refreshToken
  });
});

router.post("/refresh", async (req, res) => {
  const error = requireFields(req.body, ["refreshToken"]);
  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const payload = jwt.verify(req.body.refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || user.refreshToken !== req.body.refreshToken) {
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    const accessToken = signAccessToken(user._id.toString());
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Refresh token invalid" });
  }
});

router.post("/logout", requireAuth, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  return res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
