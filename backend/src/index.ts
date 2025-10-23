import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Increase body size limit for photo uploads (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(config.COOKIE_SECRET));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 API URL: ${config.API_URL}`);
});