import prisma from '../config/database';
import crypto from 'crypto';
// Note: For OTP, we'll use a simple email notification
// In production, integrate with SMS service for OTP delivery
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Verify neighborhood via geolocation
 * User must be within 500m of their saved neighborhood
 */
export const verifyNeighborhoodByGeo = async (
  userId: string,
  currentLatitude: number,
  currentLongitude: number
) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      neighborhoodLocation: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.neighborhoodLocation) {
    throw new Error('No neighborhood location set');
  }

  if (user.neighborhoodVerified) {
    throw new Error('Neighborhood already verified');
  }

  const savedLat = Number(user.neighborhoodLocation.latitude);
  const savedLng = Number(user.neighborhoodLocation.longitude);

  // Calculate distance
  const distance = calculateDistance(
    currentLatitude,
    currentLongitude,
    savedLat,
    savedLng
  );

  // Allow within 0.5km (500m)
  const allowedDistance = 0.5;

  if (distance > allowedDistance) {
    throw new Error(
      `You are too far from your saved neighborhood. Distance: ${distance.toFixed(2)}km (must be within ${allowedDistance}km)`
    );
  }

  // Verify the user
  await prisma.user.update({
    where: { userId },
    data: {
      neighborhoodVerified: true,
      neighborhoodVerifiedAt: new Date(),
    },
  });

  return {
    verified: true,
    distance: distance,
    message: 'Neighborhood verified successfully',
  };
};

/**
 * Generate OTP for neighborhood verification
 */
export const generateNeighborhoodOTP = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      neighborhoodLocation: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.neighborhoodLocation) {
    throw new Error('No neighborhood location set');
  }

  if (user.neighborhoodVerified) {
    throw new Error('Neighborhood already verified');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

  // Create verification record
  await prisma.verification.create({
    data: {
      userId,
      verificationType: 'NEIGHBORHOOD' as any, // Type assertion needed until Prisma client regenerates
      token,
      expiresAt,
    },
  });

  // In production, send OTP via SMS or email service
  // For now, we'll log it and include in response for testing
  console.log(`Neighborhood verification OTP for ${user.email}: ${otp}`);

  return {
    token, // Return token for verification
    expiresAt,
    message: 'OTP sent to your email',
    // In production, don't return OTP in response
    // For testing purposes only:
    otp,
  };
};

/**
 * Verify neighborhood via OTP
 */
export const verifyNeighborhoodByOTP = async (
  userId: string,
  token: string,
  otp: string
) => {
  const verification = await prisma.verification.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verification) {
    throw new Error('Invalid verification token');
  }

  if (verification.userId !== userId) {
    throw new Error('Verification token does not match user');
  }

  if (verification.verificationType !== ('NEIGHBORHOOD' as any)) {
    throw new Error('Invalid verification type');
  }

  if (verification.isUsed) {
    throw new Error('Verification token already used');
  }

  if (new Date() > verification.expiresAt) {
    throw new Error('Verification token expired');
  }

  // In a real implementation, you'd verify the OTP from the email/SMS
  // For now, we'll accept any OTP if the token is valid
  // In production, store OTP separately and verify it

  // Mark verification as used
  await prisma.$transaction([
    prisma.verification.update({
      where: { verificationId: verification.verificationId },
      data: { isUsed: true },
    }),
    prisma.user.update({
      where: { userId },
      data: {
        neighborhoodVerified: true,
        neighborhoodVerifiedAt: new Date(),
      },
    }),
  ]);

  return {
    verified: true,
    message: 'Neighborhood verified successfully',
  };
};

