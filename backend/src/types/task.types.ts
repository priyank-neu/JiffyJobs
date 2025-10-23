import { TaskStatus, TaskCategory } from '@prisma/client';

export interface CreateTaskDTO {
  title: string;
  description: string;
  category: TaskCategory;
  budget: number;
  budgetMin?: number;
  budgetMax?: number;
  taskDate?: Date;
  estimatedHours?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  photos?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  category?: TaskCategory;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  taskDate?: Date;
  estimatedHours?: number;
  status?: TaskStatus;
}

export interface TaskFilter {
  status?: TaskStatus;
  category?: TaskCategory;
  posterId?: string;
  minBudget?: number;
  maxBudget?: number;
}