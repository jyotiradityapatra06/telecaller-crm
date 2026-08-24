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
import { getSupabaseClient, isSupabaseConfigured } from './server/supabase';

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

  // 2. Trust Proxy Configuration for Reverse Proxies (Vercel / Nginx / ALB)
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

  // 2. Production-ready CORS configuration
  const allowedOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? false : '*');
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. API Rate Limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 30 : 200, // 30 attempts per 15 mins in production, 200 in development
    message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
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
    max: 150, // Burst protection
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiters to specific security-sensitive routes
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/auth/password', authLimiter);
  app.use('/api/admin/leads/import', importLimiter);
  app.use('/api/telecaller/calls', mutationLimiter);
  app.use('/api/telecaller/followups', mutationLimiter);

  // Enhanced Health Check verifying DB Connectivity
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
  app.use('/api/telecaller', telecallerRouter);

  // Vite middleware setup
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
