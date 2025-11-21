import prisma from '../config/database';
import { TaskStatus, NotificationType } from '@prisma/client';
import { CreateTaskDTO, UpdateTaskDTO, TaskFilter } from '../types/task.types';
import { createLocation, maskAddress } from './location.service';
import { createNotification } from './notification.service';
 
export const createTask = async (posterId: string, taskData: CreateTaskDTO) => {
  // Validation
  if (taskData.budgetMin && taskData.budgetMax && taskData.budgetMin > taskData.budgetMax) {
    throw new Error('Minimum budget cannot be greater than maximum budget');
  }
 
  if (taskData.taskDate && new Date(taskData.taskDate) < new Date()) {
    throw new Error('Task date must be in the future');
  }
 
  // Create location if provided
  let locationId: string | undefined;
  let addressMasked: string | undefined;
 
  if (taskData.location) {
    const location = await createLocation(taskData.location);
    locationId = location.locationId;
    addressMasked = maskAddress(
      taskData.location.address,
      taskData.location.city,
      taskData.location.state
    );
  }
 
  // Create task with photos in one transaction
  const task = await prisma.task.create({
    data: {
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      budget: taskData.budget,
      budgetMin: taskData.budgetMin,
      budgetMax: taskData.budgetMax,
      taskDate: taskData.taskDate,
      estimatedHours: taskData.estimatedHours,
      posterId,
      locationId,
      addressMasked,
      status: TaskStatus.OPEN,
      photos: taskData.photos && taskData.photos.length > 0 ? {
        create: taskData.photos.map(photoUrl => ({
          photoUrl,
        }))
      } : undefined,
    },
    include: {
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
      location: true,
      photos: true,
    },
  });
 
  return task;
};
 
export const getTaskById = async (taskId: string, includeFullAddress = false) => {
  const task = await prisma.task.findUnique({
    where: { taskId },
    include: {
      poster: {
        select: {
          userId: true,
          name: true,
          email: true,
          isVerified: true,
        },
      },
      location: includeFullAddress,
      photos: true,
      assignedHelper: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });
 
  if (!task) {
    throw new Error('Task not found');
  }
 
  // If not including full address, use masked address
  if (!includeFullAddress && task.location) {
    return {
      ...task,
      location: {
        ...task.location,
        address: task.addressMasked || 'Location provided',
      },
    };
  }
 
  return task;
};
 
export const getMyTasks = async (userId: string, filters?: TaskFilter) => {
  const where: any = { posterId: userId };
 
  if (filters?.status) {
    where.status = filters.status;
  }
 
  if (filters?.category) {
    where.category = filters.category;
  }
 
  const tasks = await prisma.task.findMany({
    where,
    include: {
      location: true,
      photos: true,
      assignedHelper: {
        select: {
          userId: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
 
  return tasks;
};
 
export const updateTask = async (
  taskId: string,
  posterId: string,
  updateData: UpdateTaskDTO
) => {
  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findUnique({
    where: { taskId },
  });
 
  if (!existingTask) {
    throw new Error('Task not found');
  }
 
  if (existingTask.posterId !== posterId) {
    throw new Error('You can only update your own tasks');
  }
 
  // Can only edit if task is OPEN
  if (existingTask.status !== TaskStatus.OPEN) {
    throw new Error('Can only edit tasks with OPEN status');
  }
 
  // Validation
  if (updateData.budgetMin && updateData.budgetMax && updateData.budgetMin > updateData.budgetMax) {
    throw new Error('Minimum budget cannot be greater than maximum budget');
  }
 
  if (updateData.taskDate && new Date(updateData.taskDate) < new Date()) {
    throw new Error('Task date must be in the future');
  }
 
  // Handle location update
  let locationId = existingTask.locationId;
  if (updateData.location) {
    // Create new location
    const { createLocation } = await import('./location.service');
    const newLocation = await createLocation(updateData.location);
    locationId = newLocation.locationId;
  }
 
  // Prepare update data (exclude location from direct update)
  const { location, ...taskUpdateData } = updateData;
  const finalUpdateData = {
    ...taskUpdateData,
    ...(locationId && { locationId }),
  };
 
  const updatedTask = await prisma.task.update({
    where: { taskId },
    data: finalUpdateData,
    include: {
      poster: {
        select: {
          userId: true,
          name: true,
        },
      },
      location: true,
      photos: true,
      assignedHelper: {
        select: {
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Notify assigned helper if task was updated
  if (updatedTask.assignedHelperId && updatedTask.assignedHelper) {
    try {
      await createNotification({
        userId: updatedTask.assignedHelperId,
        type: NotificationType.TASK_UPDATED,
        title: 'Task Updated',
        message: `The task "${updatedTask.title}" has been updated`,
        relatedTaskId: taskId,
        sendEmail: true,
      });
    } catch (error) {
      console.error('Error creating notification for task update:', error);
    }
  }

  return updatedTask;
};
 
export const cancelTask = async (taskId: string, posterId: string) => {
  // Check if task exists and belongs to user
  const existingTask = await prisma.task.findUnique({
    where: { taskId },
  });
 
  if (!existingTask) {
    throw new Error('Task not found');
  }
 
  if (existingTask.posterId !== posterId) {
    throw new Error('You can only cancel your own tasks');
  }
 
  // Can only cancel if task is OPEN
  if (existingTask.status !== TaskStatus.OPEN) {
    throw new Error('Can only cancel tasks with OPEN status');
  }
 
  const cancelledTask = await prisma.task.update({
    where: { taskId },
    data: {
      status: TaskStatus.CANCELLED,
    },
  });
 
  return cancelledTask;
};
 
export const deleteTask = async (taskId: string, posterId: string) => {
  const existingTask = await prisma.task.findUnique({
    where: { taskId },
  });
 
  if (!existingTask) {
    throw new Error('Task not found');
  }
 
  if (existingTask.posterId !== posterId) {
    throw new Error('You can only delete your own tasks');
  }
 
  await prisma.task.delete({
    where: { taskId },
  });

  return { message: 'Task deleted successfully' };
};

// Complete task and release payout
export const completeTask = async (taskId: string, userId: string, autoRelease: boolean = false) => {
  const task = await prisma.task.findUnique({
    where: { taskId },
    include: {
      contract: true,
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Check permissions - poster can confirm completion, helper can mark as done
  const isPoster = task.posterId === userId;
  const isHelper = task.assignedHelperId === userId;

  if (!isPoster && !isHelper) {
    throw new Error('You do not have permission to complete this task');
  }

  // If helper marks as done, set status to AWAITING_CONFIRMATION
  // If poster confirms, mark as COMPLETED and release payout
  if (isHelper && !autoRelease) {
    // Helper marks task as done - wait for poster confirmation
    const updatedTask = await prisma.task.update({
      where: { taskId },
      data: {
        status: TaskStatus.AWAITING_CONFIRMATION,
      },
      include: {
        poster: {
          select: {
            userId: true,
            name: true,
          },
        },
        location: true,
        photos: true,
      },
    });

    // Set auto-release time if contract exists and not already set
    if (task.contract && !task.contract.autoReleaseAt) {
      const config = require('../config/env').default;
      await prisma.contract.update({
        where: { contractId: task.contract.contractId },
        data: {
          autoReleaseAt: new Date(Date.now() + config.AUTO_RELEASE_HOURS * 60 * 60 * 1000),
        },
      });
    }

    return updatedTask;
  } else if (isPoster || autoRelease) {
    // Poster confirms or auto-release - mark as COMPLETED and release payout
    // Check if task has a contract for payout
    if (!task.contract) {
      throw new Error('Task does not have an active contract. Cannot release payout.');
    }

    const { releasePayout } = await import('./payment.service');
    
    await prisma.$transaction(async (tx) => {
      // Update task status
      await tx.task.update({
        where: { taskId },
        data: {
          status: TaskStatus.COMPLETED,
        },
      });
    });

    // Release payout (outside transaction to avoid long locks)
    try {
      await releasePayout(task.contract.contractId);
    } catch (error) {
      console.error('Error releasing payout:', error);
      // Don't fail if payout fails - it can be retried
    }

    const updatedTask = await prisma.task.findUnique({
      where: { taskId },
      include: {
        poster: {
          select: {
            userId: true,
            name: true,
          },
        },
        location: true,
        photos: true,
      },
    });

    if (!updatedTask) {
      throw new Error('Task not found after update');
    }

    return updatedTask;
  }

  throw new Error('Invalid completion request');
};