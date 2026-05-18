import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// ==========================================
// REGISTER
// ==========================================
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // check existing user
    const existing = await sql`
      SELECT id FROM users WHERE email = ${cleanEmail}
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${name}, ${cleanEmail}, ${hashedPassword})
      RETURNING id, username, email;
    `;

    const user = result[0];

    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      token,
      user,
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ==========================================
// LOGIN
// ==========================================
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password required",
    });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const result = await sql`
      SELECT * FROM users WHERE email = ${cleanEmail}
    `;

    if (result.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = result[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.username,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};