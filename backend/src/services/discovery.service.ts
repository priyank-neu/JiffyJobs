import prisma from '../config/database';
import { DiscoveryFilter, DiscoveryResult } from '../types/task.types';
import { calculateDistance } from './location.service';
import { calculateSkillMatch } from './skill.service';
import { TaskStatus } from '@prisma/client';

export const discoverTasks = async (
  userId: string,
  filters: DiscoveryFilter
): Promise<DiscoveryResult> => {
  const {
    latitude,
    longitude,
    radius = 3, // default 3 miles
    category,
    minBudget,
    maxBudget,
    startDate,
    endDate,
    minHours,
    maxHours,
    searchText,
    page = 1,
    limit = 20,
    sortBy = 'proximity',
    sortOrder = 'asc'
  } = filters;

  // Validate location parameters
  if (!latitude || !longitude) {
    throw new Error('Location coordinates (latitude, longitude) are required for task discovery');
  }

  const offset = (page - 1) * limit;

  // Build the base query
  let whereClause: any = {
    status: TaskStatus.OPEN, // Only show open tasks
    posterId: { not: userId }, // Exclude user's own tasks
    location: {
      isNot: null // Only tasks with location data
    }
  };

  // Add category filter
  if (category) {
    whereClause.category = category;
  }

  // Add budget filters
  if (minBudget !== undefined || maxBudget !== undefined) {
    whereClause.budget = {};
    if (minBudget !== undefined) {
      whereClause.budget.gte = minBudget;
    }
    if (maxBudget !== undefined) {
      whereClause.budget.lte = maxBudget;
    }
  }

  // Add date filters
  if (startDate || endDate) {
    whereClause.taskDate = {};
    if (startDate) {
      whereClause.taskDate.gte = startDate;
    }
    if (endDate) {
      whereClause.taskDate.lte = endDate;
    }
  }

  // Add estimated hours filters
  if (minHours !== undefined || maxHours !== undefined) {
    whereClause.estimatedHours = {};
    if (minHours !== undefined) {
      whereClause.estimatedHours.gte = minHours;
    }
    if (maxHours !== undefined) {
      whereClause.estimatedHours.lte = maxHours;
    }
  }

  // Add text search filter
  if (searchText) {
    whereClause.OR = [
      {
        title: {
          contains: searchText,
          mode: 'insensitive'
        }
      },
      {
        description: {
          contains: searchText,
          mode: 'insensitive'
        }
      }
    ];
  }

  // Get total count for pagination
  const total = await prisma.task.count({
    where: whereClause
  });

  // Build order by clause
  let orderBy: any = {};
  if (sortBy === 'proximity') {
    // For proximity, we'll sort by distance after fetching
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'soonest') {
    orderBy = { taskDate: 'asc' };
  } else if (sortBy === 'budget') {
    orderBy = { budget: sortOrder === 'asc' ? 'asc' : 'desc' };
  } else if (sortBy === 'newest') {
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sortBy === 'title') {
    orderBy = { title: sortOrder === 'asc' ? 'asc' : 'desc' };
  } else {
    orderBy = { createdAt: 'desc' };
  }

  // Fetch tasks with location data
  const tasks = await prisma.task.findMany({
    where: whereClause,
    include: {
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      location: true,
      photos: {
        select: {
          photoId: true,
          photoUrl: true,
          thumbnailUrl: true,
        },
      },
    } as any,
    orderBy,
    skip: offset,
    take: limit,
  });

  // Calculate distances and filter by radius
  const tasksWithDistance = tasks
    .map((task: any) => {
      if (!(task as any).location) return null;
      
      const distance = calculateDistance(
        latitude,
        longitude,
        Number((task as any).location.latitude),
        Number((task as any).location.longitude)
      );
      
      return {
        ...task,
        distance: distance * 0.621371, // Convert km to miles
      };
    })
    .filter((task: any): task is NonNullable<typeof task> => task !== null && task.distance <= radius);

  // Add skill matching for each task
  const tasksWithSkillMatch = await Promise.all(
    tasksWithDistance.map(async (task: any) => {
      try {
        const skillMatch = await calculateSkillMatch(userId, task.taskId);
        return {
          ...task,
          skillMatch: skillMatch ? {
            hasMatch: skillMatch.totalScore > 0,
            matchScore: skillMatch.totalScore,
            isGoodMatch: skillMatch.totalScore >= 0.7, // 70% or higher is a "good match"
            matchedSkills: skillMatch.matches.filter(m => m.matchScore > 0).length,
            totalRequiredSkills: skillMatch.matches.length
          } : {
            hasMatch: false,
            matchScore: 0,
            isGoodMatch: false,
            matchedSkills: 0,
            totalRequiredSkills: 0
          }
        };
      } catch (error) {
        console.error(`Error calculating skill match for task ${task.taskId}:`, error);
        return {
          ...task,
          skillMatch: {
            hasMatch: false,
            matchScore: 0,
            isGoodMatch: false,
            matchedSkills: 0,
            totalRequiredSkills: 0
          }
        };
      }
    })
  );

  // Sort by proximity if requested
  if (sortBy === 'proximity') {
    tasksWithSkillMatch.sort((a, b) => {
      const distanceA = a.distance ?? 0;
      const distanceB = b.distance ?? 0;
      if (sortOrder === 'asc') {
        return distanceA - distanceB;
      } else {
        return distanceB - distanceA;
      }
    });
  }

  // Calculate pagination info
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    tasks: tasksWithSkillMatch,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
  };
};

export const getNearbyTasksCount = async (
  userId: string,
  latitude: number,
  longitude: number,
  radius: number = 3
): Promise<number> => {
  // This is a simplified version - in production, you'd want to use
  // a more efficient spatial query or caching mechanism
  const result = await discoverTasks(userId, {
    latitude,
    longitude,
    radius,
    page: 1,
    limit: 1,
  });
  
  return result.pagination.total;
};
