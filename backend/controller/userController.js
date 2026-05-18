import bcrypt from "bcryptjs";
import { sql } from "../config/db.js";
import jwt from "jsonwebtoken";

// ==========================================
// 1. REGISTER CONTROLLER
// ==========================================
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body; // Removed phoneNumber since it's not in your database

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExist = await sql`SELECT * FROM users WHERE email = ${cleanEmail}`;
    if (userExist.length > 0) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // FIXED: Using username and password_hash to match your Neon schema columns
    const result = await sql`
      INSERT INTO users (username, email, password_hash)
      VALUES (${name}, ${cleanEmail}, ${hashedPassword})
      RETURNING id, username, email
    `;

    res.status(201).json({
      message: "User registered successfully",
      user: result[0]
    });

  } catch (error) {
    console.error("Database Registration Error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ==========================================
// 2. LOGIN CONTROLLER
// ==========================================
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const cleanEmail = email.trim().toLowerCase();

    const user = await sql`
      SELECT * FROM users WHERE email = ${cleanEmail}
    `;

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    // FIXED: Checking user[0].password_hash instead of .password
    const isMatch = await bcrypt.compare(password, user[0].password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user[0].id, email: user[0].email },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].username, // FIXED: Mapping username to name for frontend consistency
        email: user[0].email
      }
    });

  } catch (error) {
    console.error("Database Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ==========================================
// 3. MIDDLEWARE & COMPONENT CONTROLLERS
// ==========================================
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // FIXED: Querying username instead of name or phoneNumber
    const user = await sql`
      SELECT id, username, email
      FROM users
      WHERE id = ${req.user.id}
    `;

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: user[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logoutUser = (req, res) => {
  res.json({ message: "Logout successful" });
};