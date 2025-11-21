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
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
}
 
export interface TaskFilter {
  status?: TaskStatus;
  category?: TaskCategory;
  posterId?: string;
  minBudget?: number;
  maxBudget?: number;
}
 
export interface DiscoveryFilter {
  // Location
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles, default 3
  
  // Filters
  category?: TaskCategory;
  minBudget?: number;
  maxBudget?: number;
  startDate?: Date;
  endDate?: Date;
  minHours?: number;
  maxHours?: number;
  searchText?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'proximity' | 'soonest' | 'budget' | 'newest' | 'oldest' | 'title';
  sortOrder?: 'asc' | 'desc';
}
 
export interface DiscoveryResult {
  tasks: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}