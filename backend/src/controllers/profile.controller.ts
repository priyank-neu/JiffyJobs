import { Response } from 'express';
import { AuthRequest } from '../types';
import * as profileService from '../services/profile.service';
import * as neighborhoodVerificationService from '../services/neighborhoodVerification.service';
import prisma from '../config/database';

/**
 * Get current user's profile (full data)
 */
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await profileService.getMyProfile(req.user.userId);

    res.status(200).json({
      message: 'Profile retrieved successfully',
      profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
};

/**
 * Update current user's profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, bio, avatarUrl, preferredHourlyRate } = req.body;

    const updatedProfile = await profileService.updateProfile(req.user.userId, {
      name,
      bio,
      avatarUrl,
      preferredHourlyRate: preferredHourlyRate ? parseFloat(preferredHourlyRate) : undefined,
    });

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
};

/**
 * Get public profile (masked data)
 */
export const getPublicProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    const profile = await profileService.getPublicProfile(userId);

    res.status(200).json({
      message: 'Profile retrieved successfully',
      profile,
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }
};

/**
 * Set neighborhood location
 */
export const setNeighborhood = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { latitude, longitude, address, city, state, zipCode, country } = req.body;

    if (!latitude || !longitude || !address) {
      res.status(400).json({ error: 'Latitude, longitude, and address are required' });
      return;
    }

    const user = await profileService.setNeighborhood(req.user.userId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address,
      city,
      state,
      zipCode,
      country,
    });

    res.status(200).json({
      message: 'Neighborhood location set successfully',
      neighborhood: user.neighborhoodLocation,
    });
  } catch (error) {
    console.error('Error setting neighborhood:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to set neighborhood' });
    }
  }
};

/**
 * Verify neighborhood via geolocation
 */
export const verifyNeighborhoodByGeo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    const result = await neighborhoodVerificationService.verifyNeighborhoodByGeo(
      req.user.userId,
      parseFloat(latitude),
      parseFloat(longitude)
    );

    res.status(200).json({
      message: result.message,
      verified: result.verified,
      distance: result.distance,
    });
  } catch (error) {
    console.error('Error verifying neighborhood:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to verify neighborhood' });
    }
  }
};

/**
 * Generate OTP for neighborhood verification
 */
export const generateNeighborhoodOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await neighborhoodVerificationService.generateNeighborhoodOTP(req.user.userId);

    res.status(200).json({
      message: result.message,
      token: result.token,
      expiresAt: result.expiresAt,
      // In production, don't return OTP
      otp: result.otp, // For testing only
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate OTP' });
    }
  }
};

/**
 * Verify neighborhood via OTP
 */
export const verifyNeighborhoodByOTP = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { token, otp } = req.body;

    if (!token || !otp) {
      res.status(400).json({ error: 'Token and OTP are required' });
      return;
    }

    const result = await neighborhoodVerificationService.verifyNeighborhoodByOTP(
      req.user.userId,
      token,
      otp
    );

    res.status(200).json({
      message: result.message,
      verified: result.verified,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }
};

/**
 * Get all available skills
 */
export const getAllSkills = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // This endpoint doesn't need user data, just authentication check
    // req.user is available from middleware but we don't need it here
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' },
      select: {
        skillId: true,
        name: true,
        category: true,
        description: true,
      },
    });

    res.status(200).json({
      message: 'Skills retrieved successfully',
      skills,
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
};

/**
 * Add skill to user profile
 */
export const addSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { skillId, level, experienceYears } = req.body;

    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    // Check if skill service exists, otherwise create inline
    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: req.user.userId,
          skillId,
        },
      },
      update: {
        level: level || 'BEGINNER',
        experienceYears: experienceYears || 0,
      },
      create: {
        userId: req.user.userId,
        skillId,
        level: level || 'BEGINNER',
        experienceYears: experienceYears || 0,
      },
      include: {
        skill: true,
      },
    });

    res.status(200).json({
      message: 'Skill added successfully',
      userSkill,
    });
  } catch (error) {
    console.error('Error adding skill:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to add skill' });
    }
  }
};

/**
 * Remove skill from user profile
 */
export const removeSkill = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { skillId } = req.params;

    if (!skillId) {
      res.status(400).json({ error: 'Skill ID is required' });
      return;
    }

    await prisma.userSkill.delete({
      where: {
        userId_skillId: {
          userId: req.user.userId,
          skillId,
        },
      },
    });

    res.status(200).json({
      message: 'Skill removed successfully',
    });
  } catch (error) {
    console.error('Error removing skill:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove skill' });
    }
  }
};

