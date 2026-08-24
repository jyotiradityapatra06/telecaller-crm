# TeleCaller CRM - Multi-Brand Master & Telecaller Suite

A modern, scalable CRM system featuring an Admin Master Panel and isolated Telecaller interfaces for managing multiple brands (Education & Real Estate). Built with React, TypeScript, Express, and PostgreSQL for seamless customer management and call tracking.

## 🎯 Overview

**Apni CRM** is a comprehensive Customer Relationship Management system designed to streamline telecalling operations across multiple business domains. It provides:

- **Master Admin Panel** - Centralized management of organizations, leads, and telecallers
- **Isolated Telecaller Interfaces** - Brand-specific interfaces for Apni Vidya (Education) and Apni Estate (Real Estate)
- **AI-Powered Features** - Integration with Google Gemini API for intelligent call logging
- **Enterprise-Grade Security** - JWT authentication, rate limiting, and helmet security headers
- **Real-time Data Management** - PostgreSQL with Supabase for reliable data persistence

## ✨ Key Features

### Admin Dashboard
- Multi-brand organization management
- Bulk lead importing with CSV support
- Telecaller management and assignment
- Real-time call analytics and reporting
- Lead pool management and prioritization

### Telecaller Interface
- Simplified call logging UI
- Follow-up scheduling
- Call notes with AI-assisted documentation
- Brand-specific workflows
- Performance tracking

### Technical Highlights
- **Full-stack TypeScript** - Type-safe from frontend to backend
- **Security First** - Helmet for HTTP headers, rate limiting on sensitive endpoints
- **Optimized Performance** - Vite for fast builds, esbuild for production bundles
- **Database** - Supabase PostgreSQL with migrations
- **UI Framework** - React 19 with Tailwind CSS and Lucide icons
- **Deployment Ready** - Render configuration included

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express.js, TypeScript |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | JWT (jsonwebtoken) |
| **AI Integration** | Google Gemini API 2.4.0 |
| **Security** | Helmet, CORS, Express Rate Limit, bcryptjs |
| **Build Tools** | Vite, esbuild |

## 📦 Language Composition

- **TypeScript**: 69.7% - Core business logic and type safety
- **PL/pgSQL**: 27.4% - Database procedures and migrations
- **JavaScript**: 2.5% - Configuration and utilities
- **Other**: 0.4% - Build scripts and misc

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ or **Bun** (Bun.lock included)
- **npm** or **bun** package manager
- **Supabase Account** with PostgreSQL database
- **Google Gemini API Key** for AI features

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jyotiradityapatra06/telecaller-crm.git
   cd telecaller-crm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure `.env.local`:**
   ```dotenv
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Frontend URL (CORS)
   FRONTEND_URL=http://localhost:3000
   
   # Proxy Trust (for production behind reverse proxy)
   TRUST_PROXY=1
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   bun dev
   ```

   The application will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

Or in one command:
```bash
npm run build && npm start
```

## 📁 Project Structure

```
telecaller-crm/
├── src/                      # Frontend React application
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Root component
├── server/                  # Backend Express server
│   ├── routes/             # API routes (auth, admin, telecaller)
│   ├── middleware/         # Express middleware
│   ├── supabase.ts         # Database client
│   └── types.ts            # Server type definitions
├── supabase/               # Database migrations and seeds
│   └── migrations/         # PostgreSQL migration files
├── data/                   # Sample data and fixtures
├── server.ts               # Express server entry point
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── .env.example            # Environment template
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with secure token generation
- bcryptjs password hashing with salt rounds
- Role-based access control (Admin, Telecaller)

### API Security
- **Helmet** - Sets secure HTTP headers
- **CORS** - Configured for production origins
- **Rate Limiting:**
  - Auth endpoints: 10 attempts per 15 minutes
  - Bulk imports: 10 requests per 15 minutes
  - Mutations: 150 requests per 15 minutes (burst protection)
- **Proxy Trust** - Correctly identifies client IP behind reverse proxies

### Data Protection
- Input validation with Zod schema validation
- Prepared statements for SQL injection prevention
- Secure JWT secrets configuration in production

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /password` - Password management

### Admin (`/api/admin`)
- `GET /leads` - List all leads
- `POST /leads/import` - Bulk import leads
- `GET /telecallers` - List telecallers
- `POST /telecallers` - Create telecaller

### Telecaller (`/api/telecaller`)
- `GET /calls` - Call history
- `POST /calls` - Log new call
- `GET /followups` - Follow-up tasks
- `POST /followups` - Schedule follow-up

### Health Check (`/api/health`)
- `GET /health` - Server status and database connectivity

## 🗄️ Database Schema

The database is managed through Supabase PostgreSQL with migrations in the `supabase/migrations` directory. Key tables include:

- **organizations** - Multi-tenant support
- **users** - Admin and telecaller accounts
- **leads** - Customer/prospect records
- **calls** - Call logs and transcripts
- **followups** - Call follow-up tasks
- **call_notes** - Detailed notes from calls

## 🚢 Deployment

### Deploy to Render

A `render.yaml` configuration is included for seamless deployment:

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy with one click

**Environment variables needed:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (generate a strong random string)
- `FRONTEND_URL` (your production domain)

### Manual Deployment

For other platforms (Vercel, AWS, Digital Ocean):

```bash
# Build the application
npm run build

# Start the server (requires dist/server.cjs)
npm start
```

## 🧪 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run lint

# Production build
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean
```

### Environment Configuration

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `JWT_SECRET` - JWT signing secret (must be 32+ chars in production)
- `TRUST_PROXY` - Number of proxy hops (for reverse proxies like Nginx)

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check that your Supabase project is active
- Run `/api/health` to diagnose database connectivity

### CORS Errors
- Ensure `FRONTEND_URL` matches your frontend domain
- In development, set `FRONTEND_URL=http://localhost:3000`

### Rate Limit Errors
- Rate limits are designed for security; wait for the retry window
- Check `X-RateLimit-*` headers in response

### Build Errors
- Ensure Node.js version is 16 or higher
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`

## 📝 Environment Variables Reference

```dotenv
# Server Configuration
PORT=3000                                    # Port to run server on
NODE_ENV=development                        # Environment: development or production
JWT_SECRET=change-this-in-production        # Secret for JWT token signing

# Supabase (Database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000          # For production, set to your domain

# Reverse Proxy
TRUST_PROXY=1                               # Number of proxy hops (1 for Vercel/Nginx)
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source. Check the LICENSE file for details.

## 🙋 Support

For questions or issues:
- Open an GitHub Issue
- Check existing discussions
- Review the troubleshooting section above

## 📈 Roadmap

- [ ] Real-time call recording integration
- [ ] Advanced analytics dashboard
- [ ] WhatsApp/SMS integration
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and exports
- [ ] Multi-language support

---

**Built with ❤️ by the TeleCaller CRM Team**

Made for the Apni Vidya (Education) and Apni Estate (Real Estate) platforms.
