import jwt from 'jsonwebtoken';
import config from '../config/env';

interface JWTPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const secret = config.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  return jwt.sign(
    payload,
    secret,
    { expiresIn: config.JWT_EXPIRE } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = config.JWT_SECRET;
    if (!secret || secret.length === 0) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};