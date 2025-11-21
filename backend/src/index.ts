import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { startAutoReleaseScheduler } from './services/autoRelease.service';
import { initializeSocketIO } from './config/socket';
import { initializeSocketService } from './services/socket.service';

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

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocketIO(httpServer);

// Initialize Socket service
initializeSocketService(io);

// Start server
const PORT = config.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 API URL: ${config.API_URL}`);
  console.log(`🔌 Socket.IO enabled`);
  
  // Start auto-release scheduler
  startAutoReleaseScheduler();
});