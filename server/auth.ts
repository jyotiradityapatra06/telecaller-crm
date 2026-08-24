import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbRepository } from './repository/dbRepository';
import { User, UserRole, AuthUser, BrandAccess } from '../src/types';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'telecaller-crm-super-secure-jwt-secret-key-2026') {
    throw new Error('FATAL: A custom JWT_SECRET environment variable must be provided in production mode.');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'telecaller-crm-super-secure-jwt-secret-key-2026';

export interface TokenPayload {
  userId: string;
  loginId: string;
  role: UserRole;
  brandAccess: BrandAccess;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    loginId: user.loginId,
    role: user.role,
    brandAccess: user.brandAccess || 'BOTH',
    name: user.name,
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
    dailyTarget: user.dailyTarget,
    phone: user.phone,
    email: user.email,
    isActive: user.isActive,
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
    return;
  }

  const user = await dbRepository.findUserById(payload.userId);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: User account not found' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: 'Forbidden: This account has been deactivated by the Administrator' });
    return;
  }

  req.user = user;
  next();
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
