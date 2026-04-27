/**
 * Express App Configuration
 * Setup middleware, routes, and error handling
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';

const app = express();

// Trust proxy headers (required when running behind Railway/Cloud Run/nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration — CORS_ORIGIN may be comma-separated for multiple allowed origins
const allowedOrigins: (string | RegExp)[] = [
  /^http:\/\/localhost:\d+$/,
  'https://personnel-management-sys-b9278.web.app',
  'https://personnel-management-sys-b9278.firebaseapp.com',
  'https://medsev.onrender.com',
];
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((o) => allowedOrigins.push(o.trim()));
}
const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => {
    if (!origin) return cb(null, true); // allow non-browser / server-to-server
    const ok = allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin));
    cb(ok ? null : new Error(`CORS: origin ${origin} not allowed`), ok);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting - more generous in development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (simple)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Philippine Coast Guard Personnel Management System API',
    version: '1.0.0',
    status: 'active',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    path: req.path
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

export default app;
