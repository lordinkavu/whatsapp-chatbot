import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

router.post("/", (req, res) => {
  res.send("Hello World");
});

router.patch("/", async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers["authorization"];

    if (!authHeader)
      return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is expired
    if (Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ error: "Token expired" });
    }

    const userId = decoded.user._id;

    const { name, email, language, checkins, about } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        email,
        language,
        checkins,
        about,
      },
      {
        new: true,
      }
    );

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
