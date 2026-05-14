import bcrypt from "bcryptjs";
import { sql } from "../config/db.js";
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
  const { name, email, phoneNumber, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await sql`
      INSERT INTO users (name, email, phoneNumber, password)
      VALUES (${name}, ${email}, ${phoneNumber}, ${hashedPassword})
      RETURNING id, name, email, phoneNumber
    `;

    res.status(201).json({
      message: "User registered successfully",
      user: result[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user[0].id,
        email: user[0].email
      },
      "secret_key",
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "secret_key");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

import { sql } from "../config/db.js";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await sql`
      SELECT id, name, email, phoneNumber
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