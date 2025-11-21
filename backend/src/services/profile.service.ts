import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  preferredHourlyRate?: number;
}

/**
 * Get user's own profile (full data)
 */
export const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      email: true,
      name: true,
      phoneNumber: true,
      bio: true,
      avatarUrl: true,
      preferredHourlyRate: true,
      role: true,
      isVerified: true,
      accountStatus: true,
      neighborhoodLocationId: true,
      neighborhoodVerified: true,
      neighborhoodVerifiedAt: true,
      neighborhoodLocation: {
        select: {
          locationId: true,
          latitude: true,
          longitude: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
        },
      },
      userSkills: {
        include: {
          skill: {
            select: {
              skillId: true,
              name: true,
              category: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, data: UpdateProfileData) => {
  const updateData: any = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.bio !== undefined) updateData.bio = data.bio;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.preferredHourlyRate !== undefined) {
    updateData.preferredHourlyRate = data.preferredHourlyRate 
      ? new Decimal(data.preferredHourlyRate)
      : null;
  }

  const user = await prisma.user.update({
    where: { userId },
    data: updateData,
    select: {
      userId: true,
      email: true,
      name: true,
      bio: true,
      avatarUrl: true,
      preferredHourlyRate: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Get public profile (masked data)
 */
export const getPublicProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      userId: true,
      name: true,
      bio: true,
      avatarUrl: true,
      preferredHourlyRate: true,
      role: true,
      neighborhoodVerified: true,
      neighborhoodLocation: {
        select: {
          city: true,
          state: true,
          zipCode: true,
          // Masked coordinates (approximate only)
          latitude: true,
          longitude: true,
        },
      },
      userSkills: {
        include: {
          skill: {
            select: {
              skillId: true,
              name: true,
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          reviewsReceived: true,
          contracts: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get ratings summary
  const reviews = await prisma.review.findMany({
    where: { revieweeId: userId },
    select: { rating: true },
  });

  const ratingsSummary = {
    averageRating: reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0,
    totalReviews: reviews.length,
    ratingDistribution: {
      5: reviews.filter((r: any) => r.rating === 5).length,
      4: reviews.filter((r: any) => r.rating === 4).length,
      3: reviews.filter((r: any) => r.rating === 3).length,
      2: reviews.filter((r: any) => r.rating === 2).length,
      1: reviews.filter((r: any) => r.rating === 1).length,
    },
  };

  // Mask neighborhood location (return approximate area only)
  let maskedLocation = null;
  if (user.neighborhoodLocation) {
    const lat = Number(user.neighborhoodLocation.latitude);
    const lng = Number(user.neighborhoodLocation.longitude);
    
    // Round to ~0.01 degrees (~1km precision) for masking
    maskedLocation = {
      city: user.neighborhoodLocation.city,
      state: user.neighborhoodLocation.state,
      zipCode: user.neighborhoodLocation.zipCode,
      approximateLatitude: Math.round(lat * 100) / 100,
      approximateLongitude: Math.round(lng * 100) / 100,
    };
  }

  return {
    ...user,
    neighborhoodLocation: maskedLocation,
    ratingsSummary,
  };
};

/**
 * Set neighborhood location
 */
export const setNeighborhood = async (
  userId: string,
  locationData: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }
) => {
  // Create or find existing location
  let location = await prisma.location.findFirst({
    where: {
      latitude: new Decimal(locationData.latitude),
      longitude: new Decimal(locationData.longitude),
    },
  });

  if (!location) {
    location = await prisma.location.create({
      data: {
        latitude: new Decimal(locationData.latitude),
        longitude: new Decimal(locationData.longitude),
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zipCode,
        country: locationData.country || 'US',
      },
    });
  }

  // Update user's neighborhood
  const user = await prisma.user.update({
    where: { userId },
    data: {
      neighborhoodLocationId: location.locationId,
      // Reset verification when location changes
      neighborhoodVerified: false,
      neighborhoodVerifiedAt: null,
    },
    include: {
      neighborhoodLocation: {
        select: {
          locationId: true,
          latitude: true,
          longitude: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
        },
      },
    },
  });

  return user;
};

