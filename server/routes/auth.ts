import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, sanitizeUser, requireAuth, AuthenticatedRequest } from '../auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', (req, res: Response): void => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    res.status(400).json({ error: 'Please enter both Login ID and Password.' });
    return;
  }

  const userWithHash = db.findUserByLoginId(loginId);
  if (!userWithHash) {
    res.status(401).json({ error: 'Invalid login ID or password. Please check your credentials and try again.' });
    return;
  }

  if (!userWithHash.isActive) {
    res.status(403).json({ error: 'Account is deactivated. Please contact your CRM Administrator.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, userWithHash.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid login ID or password. Please check your credentials and try again.' });
    return;
  }

  const safeUser = sanitizeUser(userWithHash);
  const token = generateToken(safeUser as any);

  res.json({
    message: 'Login successful',
    token,
    user: safeUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: sanitizeUser(req.user) });
});

// GET /api/auth/demo-accounts
authRouter.get('/demo-accounts', (_req, res: Response): void => {
  const telecallers = db.getTelecallers();
  res.json({
    admin: { loginId: 'admin', password: 'admin123', name: 'Master Admin HQ', role: 'ADMIN', brandAccess: 'BOTH' },
    telecallers: telecallers.map((tc) => ({
      loginId: tc.loginId,
      password: 'password123',
      name: tc.name,
      id: tc.id,
      brandAccess: tc.brandAccess,
      dailyTarget: tc.dailyTarget,
    })),
  });
});

// PATCH /api/auth/password
authRouter.patch('/password', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Please provide current and new password.' });
    return;
  }

  if (newPassword.length < 4) {
    res.status(400).json({ error: 'New password must be at least 4 characters.' });
    return;
  }

  const userWithHash = db.findUserById(req.user!.id);
  if (!userWithHash) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  const isCurrentValid = bcrypt.compareSync(currentPassword, userWithHash.passwordHash);
  if (!isCurrentValid) {
    res.status(400).json({ error: 'Current password does not match.' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.updateUserPassword(req.user!.id, newHash);

  res.json({ message: 'Password changed successfully.' });
});
