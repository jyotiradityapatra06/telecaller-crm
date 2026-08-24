import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken, sanitizeUser, requireAuth, AuthenticatedRequest } from '../auth';
import { validateRequest, loginSchema, registerAdminSchema, changePasswordSchema } from '../middleware/validate';

export const authRouter = Router();

// POST /api/auth/register (Company / Admin Self-Registration)
authRouter.post('/register', validateRequest(registerAdminSchema), async (req, res: Response): Promise<void> => {
  const { companyName, loginId, password, phone, email } = req.body;

  try {
    const cleanLoginId = loginId.trim().toUpperCase();
    const existing = await db.findUserByLoginId(cleanLoginId);
    if (existing) {
      res.status(400).json({ error: 'Login ID already exists. Please choose another.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password.trim(), salt);

    const safeUser = await db.registerAdmin({
      companyName: companyName.trim(),
      loginId: cleanLoginId,
      passwordHash,
      phone: phone?.trim(),
      email: email?.trim(),
    });

    const token = generateToken(safeUser as any);

    res.status(201).json({
      message: 'Company Admin account created successfully.',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      res.status(400).json({ error: 'Login ID already exists. Please choose another.' });
      return;
    }
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Unable to create your account right now. Please try again later.' : err.message || 'Registration error.';
    res.status(500).json({ error: errorMsg });
  }
});

// POST /api/auth/login
authRouter.post('/login', validateRequest(loginSchema), async (req, res: Response): Promise<void> => {
  const { loginId, password } = req.body;

  try {
    const userWithHash = await db.findUserByLoginId(loginId);
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
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Authentication error.';
    res.status(500).json({ error: errorMsg });
  }
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
authRouter.get('/demo-accounts', async (_req, res: Response): Promise<void> => {
  try {
    const telecallers = await db.getTelecallers();
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
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to fetch demo accounts.';
    res.status(500).json({ error: errorMsg });
  }
});

// PATCH /api/auth/password
authRouter.patch('/password', requireAuth, validateRequest(changePasswordSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  try {
    const userWithHash = await db.findUserById(req.user!.id);
    if (!userWithHash) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const isCurrentValid = bcrypt.compareSync(currentPassword, userWithHash.passwordHash);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password does not match.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await db.updateUserPassword(req.user!.id, newHash);
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to update password.';
    res.status(500).json({ error: errorMsg });
  }
});
