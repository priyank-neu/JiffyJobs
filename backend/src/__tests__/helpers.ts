import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from '../config/env';
import routes from '../routes';
import { errorHandler } from '../middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(helmet());
  
  const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    /^https:\/\/.*\.vercel\.app$/,
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(cookieParser(config.COOKIE_SECRET || 'test-secret'));

  // Routes
  app.use('/api', routes);

  // Error handling
  app.use(errorHandler);

  return app;
}

