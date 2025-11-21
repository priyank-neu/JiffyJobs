import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AccountStatus } from '@prisma/client';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Check if user is suspended
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: { accountStatus: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
      return;
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};