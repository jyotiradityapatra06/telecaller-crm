import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import { db } from '../db';
import { generateToken, sanitizeUser, requireAuth, AuthenticatedRequest } from '../auth';
import { validateRequest, loginSchema, registerAdminSchema, registerOwnerSchema, changePasswordSchema } from '../middleware/validate';

export const authRouter = Router();

const validOwnerSetupCode = (submittedCode: string): boolean => {
  const configuredCode = process.env.OWNER_REGISTRATION_CODE;
  if (!configuredCode || !submittedCode) return false;
  const configured = Buffer.from(configuredCode, 'utf8');
  const submitted = Buffer.from(submittedCode, 'utf8');
  return configured.length === submitted.length && timingSafeEqual(configured, submitted);
};

// POST /api/auth/register-owner (code-gated registration into the existing CRM organization)
authRouter.post('/register-owner', validateRequest(registerOwnerSchema), async (req, res: Response): Promise<void> => {
  const { organizationName, name, loginId, email, phone, password, setupCode } = req.body;
  if (!validOwnerSetupCode(setupCode)) {
    res.status(403).json({ error: 'Invalid owner setup code.' });
    return;
  }

  try {
    const cleanLoginId = loginId.trim().toUpperCase();
    const passwordHash = bcrypt.hashSync(password, 10);
    const owner = await db.registerOwnerWithOrganization({ organizationName, name, loginId: cleanLoginId, email, phone, passwordHash });
    res.status(201).json({ message: 'Owner account created successfully.', user: owner });
  } catch (err: any) {
    if (err.message?.includes('already exists')) {
      res.status(409).json({ error: 'Login ID already exists.' });
      return;
    }
    console.error('[AUTH] Owner registration failed', {
      message: err instanceof Error ? err.message : String(err),
      ...(typeof err?.code === 'string' ? { code: err.code } : {}),
      ...(typeof err?.details === 'string' ? { details: err.details } : {}),
      ...(typeof err?.hint === 'string' ? { hint: err.hint } : {}),
    });
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Unable to create owner account.' : err.message || 'Unable to create owner account.' });
  }
});

// POST /api/auth/register (Company / Admin Self-Registration)
authRouter.post('/register', validateRequest(registerAdminSchema), async (req, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_OWNER_BOOTSTRAP !== 'true') {
    res.status(404).json({ error: 'Endpoint not found.' });
    return;
  }
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
    if (process.env.NODE_ENV !== 'production' && (userWithHash.role as string) === 'ADMIN') {
      userWithHash.role = 'OWNER';
      userWithHash.brandAccess = 'BOTH';
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

// GET /api/auth/demo-accounts (Strictly disabled in production)
authRouter.get('/demo-accounts', async (_req, res: Response): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Endpoint not found.' });
    return;
  }

  try {
    const telecallers = await db.getTelecallers();
    res.json({
      admin: { loginId: 'admin', password: 'admin123', name: 'Master Owner HQ', role: 'OWNER', brandAccess: 'BOTH' },
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
    res.status(500).json({ error: err.message || 'Failed to fetch demo accounts.' });
  }
});

// PATCH /api/auth/password (Organization-context verified password update)
authRouter.patch('/password', requireAuth, validateRequest(changePasswordSchema), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;

  if (newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  try {
    const userWithHash = await db.findUserById(user.id, user);
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

    await db.updateUserPassword(user.id, newHash, user);
    res.json({ message: 'Password updated successfully.' });
  } catch (err: any) {
    const errorMsg = process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message || 'Failed to update password.';
    res.status(500).json({ error: errorMsg });
  }
});
