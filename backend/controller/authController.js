import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sql } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export const initUsersTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;

  // Bootstrap the requested administrator once. Override these values in backend/.env for deployment.
  const adminName = process.env.ADMIN_NAME || "Rafael";
  const adminEmail = (process.env.ADMIN_EMAIL || "rafael@smarthome.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "263826";
  const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${adminName}, ${adminEmail}, ${passwordHash}, 'admin')
    `;
  } else {
    await sql`UPDATE users SET role = 'admin' WHERE email = ${adminEmail}`;
  }
  console.log("Users table initialized");
};

const publicUser = (user) => ({ id: user.id, name: user.username, email: user.email, role: user.role });

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const rows = await sql`SELECT id, username, email, role FROM users WHERE id = ${decoded.id}`;
    if (!rows[0]) return res.status(401).json({ success: false, message: "Account no longer exists" });
    req.user = publicUser(rows[0]);
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ success: false, message: "Admin access required" });
  next();
};

export const register = async (_req, res) => res.status(403).json({
  success: false,
  message: "Self-registration is disabled. Ask an administrator to create your account.",
});

export const createUser = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required" });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be user or admin" });
  }
  if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  try {
    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const rows = await sql`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (${name.trim()}, ${cleanEmail}, ${passwordHash}, ${role})
      RETURNING id, username, email, role
    `;
    return res.status(201).json({ success: true, user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ success: false, message: "Email already registered" });
    console.error("CREATE USER ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not create account" });
  }
};

export const login = async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginName = (identifier || email || "").trim();
  if (!loginName || !password) return res.status(400).json({ success: false, message: "Username/email and password required" });
  try {
    const cleanEmail = loginName.toLowerCase();
    const rows = await sql`
      SELECT id, username, email, password_hash, role FROM users
      WHERE lower(email) = ${cleanEmail} OR lower(username) = ${cleanEmail}
      LIMIT 1
    `;
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    return res.json({ success: true, token, user: publicUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
};

export const listUsers = async (_req, res) => {
  try {
    const users = await sql`SELECT id, username AS name, email, role, created_at FROM users ORDER BY created_at DESC`;
    return res.json({ success: true, users });
  } catch (error) {
    console.error("LIST USERS ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not load accounts" });
  }
};

export const deleteUser = async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ success: false, message: "Invalid account ID" });
  }
  if (userId === Number(req.user.id)) {
    return res.status(400).json({ success: false, message: "You cannot delete your own admin account" });
  }
  try {
    const rows = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id`;
    if (!rows[0]) return res.status(404).json({ success: false, message: "Account not found" });
    return res.json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    return res.status(500).json({ success: false, message: "Could not delete account" });
  }
};
