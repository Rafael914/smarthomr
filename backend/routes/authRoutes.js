// Inside backend/routes/authRoutes.js
import express from 'express';
import { authenticate, createUser, deleteUser, listUsers, login, register, requireAdmin } from '../controller/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users', authenticate, requireAdmin, createUser);
router.delete('/users/:userId', authenticate, requireAdmin, deleteUser);

export default router;
