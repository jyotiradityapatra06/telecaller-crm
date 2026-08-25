import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { authRouter } from './server/routes/auth';
import { adminRouter } from './server/routes/admin';
import { telecallerRouter } from './server/routes/telecaller';
import { ownerRouter } from './server/routes/owner';
import { getSupabaseClient, isSupabaseConfigured } from './server/supabase';

// Production Environment Strict Configuration Guard
function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    const missing: string[] = [];

    if (!process.env.JWT_SECRET) {
      missing.push('JWT_SECRET');
    } else if (
      process.env.JWT_SECRET.length < 32 ||
      process.env.JWT_SECRET === 'telecaller-crm-super-secure-jwt-secret-key-2026'
    ) {
      console.error('❌ FATAL: JWT_SECRET must be a custom secret of at least 32 characters in production.');
      process.exit(1);
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('http')) {
      missing.push('SUPABASE_URL');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      missing.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (!process.env.FRONTEND_URL || !process.env.FRONTEND_URL.startsWith('http')) {
      missing.push('FRONTEND_URL (Must be valid HTTP/HTTPS URL for CORS)');
    }

    if (missing.length > 0) {
      console.error(`❌ FATAL: Missing required production environment variables: ${missing.join(', ')}`);
      process.exit(1);
    }
  }
}

validateProductionEnvironment();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // 1. HTTP Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
                connectSrc: ["'self'", 'https:'],
              },
            }
          : false,
    })
  );

  // 2. Trust Proxy Configuration for Reverse Proxies (Vercel / Render / Nginx)
  const trustProxyEnv = process.env.TRUST_PROXY;
  const trustProxySetting = trustProxyEnv
    ? trustProxyEnv === 'true'
      ? true
      : parseInt(trustProxyEnv, 10)
    : process.env.NODE_ENV === 'production'
    ? 1
    : false;

  if (trustProxySetting !== false) {
    app.set('trust proxy', trustProxySetting);
  }

  // 3. Hardened CORS configuration
  const allowedOrigin =
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL!
      : process.env.FRONTEND_URL || true;

  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. API Rate Limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 30 : 200,
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const ownerRegistrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 10 : 100,
    message: { error: 'Too many owner registration attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const importLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many batch import requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const mutationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters to sensitive endpoints
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/register-owner', ownerRegistrationLimiter);
  app.use('/api/auth/password', authLimiter);
  app.use('/api/admin/leads/import', importLimiter);
  app.use('/api/telecaller/calls', mutationLimiter);
  app.use('/api/telecaller/followups', mutationLimiter);

  // Health Check verifying DB Connectivity
  app.get('/api/health', async (_req, res) => {
    let dbConnected = false;
    let dbDetails = 'not_configured';

    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data, error } = await supabase.from('organizations').select('id').limit(1);
          if (!error && Array.isArray(data)) {
            dbConnected = true;
            dbDetails = 'connected';
          } else {
            dbDetails = error?.message || 'query_failed';
          }
        }
      } else if (process.env.NODE_ENV !== 'production') {
        dbConnected = true;
        dbDetails = 'development_fallback';
      }
    } catch (err: any) {
      dbDetails = err.message || 'connection_exception';
    }

    res.json({
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'TeleCaller CRM API',
      database: dbDetails,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Reset notification endpoint
  app.post('/api/reset-data', (_req, res) => {
    res.json({ message: 'Database state is managed by Supabase PostgreSQL migrations and seed scripts.' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/owner', ownerRouter);
  app.use('/api/telecaller', telecallerRouter);

  // Vite middleware setup (development) or Static serving (production)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TeleCaller CRM Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
