import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbRepository } from './repository/dbRepository';
import { User, UserRole, AuthUser, BrandAccess } from '../src/types';

if (process.env.NODE_ENV === 'production') {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === 'telecaller-crm-super-secure-jwt-secret-key-2026'
  ) {
    throw new Error('FATAL: A custom JWT_SECRET of at least 32 characters must be provided in production mode.');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'telecaller-crm-super-secure-jwt-secret-key-2026';

export interface TokenPayload {
  userId: string;
  loginId: string;
  role: UserRole;
  brandAccess: BrandAccess;
  name: string;
  organizationId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  if (!user.organizationId) {
    throw new Error('Cannot generate token: user organization ID is required.');
  }
  const payload: TokenPayload = {
    userId: user.id,
    loginId: user.loginId,
    role: user.role,
    brandAccess: user.brandAccess || 'BOTH',
    name: user.name,
    organizationId: user.organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    loginId: user.loginId,
    role: user.role,
    brandAccess: user.brandAccess || 'BOTH',
    organizationId: user.organizationId,
    dailyTarget: user.dailyTarget,
    phone: user.phone,
    email: user.email,
    isActive: user.isActive,
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || !payload.userId || !payload.organizationId) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
      return;
    }

    const user = await dbRepository.findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User account not found' });
      return;
    }

    // Strict cross-organization boundary validation
    if (user.organizationId !== payload.organizationId) {
      res.status(401).json({ error: 'Unauthorized: Organization context mismatch' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Forbidden: This account has been deactivated by the Administrator' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('⚠️ [requireAuth] Authentication exception caught safely:', err?.message || err);
    const errorMsg = process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err?.message || 'Authentication error.';
    res.status(500).json({ error: errorMsg });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin authorization required to access this resource' });
      return;
    }
    next();
  });
}

export function requireTelecaller(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'TELECALLER' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Telecaller authorization required' });
      return;
    }
    next();
  });
}
