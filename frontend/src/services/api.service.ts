import axios from 'axios';
import { 
  Task, 
  CreateTaskData, 
  UpdateTaskData,
  Bid,
  CreateBidData,
  Contract,
  CreateContractData,
  BidFilter,
  BidSortOptions
} from '@/types/task.types';
import { AuthResponse, SignupData, LoginData, ForgotPasswordData, ResetPasswordData } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

// Task API
export const taskAPI = {
  createTask: async (data: CreateTaskData): Promise<{ message: string; task: Task }> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  getMyTasks: async (filters?: { status?: string; category?: string }): Promise<{ tasks: Task[] }> => {
    const response = await api.get('/tasks/my-tasks', { params: filters });
    return response.data;
  },

  getTaskById: async (taskId: string): Promise<{ task: Task }> => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Public method for discovery (no authentication required)
  getTaskByIdPublic: async (taskId: string): Promise<{ task: Task }> => {
    const response = await api.get(`/tasks/public/${taskId}`);
    return response.data;
  },

  updateTask: async (taskId: string, data: UpdateTaskData): Promise<{ message: string; task: Task }> => {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  cancelTask: async (taskId: string): Promise<{ message: string; task: Task }> => {
    const response = await api.patch(`/tasks/${taskId}/cancel`);
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

// Discovery API
export const discoveryAPI = {
  discoverTasks: async (filters: {
    latitude: number;
    longitude: number;
    radius?: number;
    category?: string;
    minBudget?: number;
    maxBudget?: number;
    startDate?: string;
    endDate?: string;
    minHours?: number;
    maxHours?: number;
    searchText?: string;
    page?: number;
    limit?: number;
    sortBy?: 'proximity' | 'soonest' | 'budget' | 'newest' | 'oldest' | 'title';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    message: string;
    tasks: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    const response = await api.get('/discover/tasks', { params: filters });
    return response.data;
  },

  getNearbyTasksCount: async (latitude: number, longitude: number, radius?: number): Promise<{ count: number }> => {
    const response = await api.get('/discover/tasks/count', { 
      params: { latitude, longitude, radius } 
    });
    return response.data;
  },
};

// Bid API
export const bidAPI = {
  // Place a bid on a task
  placeBid: async (data: CreateBidData): Promise<{ message: string; bid: Bid }> => {
    const response = await api.post('/bids', data);
    return response.data;
  },

  // Withdraw a bid
  withdrawBid: async (bidId: string): Promise<{ message: string }> => {
    const response = await api.patch(`/bids/${bidId}/withdraw`);
    return response.data;
  },

  // Accept a bid (poster only)
  acceptBid: async (bidId: string): Promise<{ message: string; contract: Contract }> => {
    const response = await api.post(`/bids/${bidId}/accept`);
    return response.data;
  },

  // Get helper's bids
  getMyBids: async (filters?: BidFilter, sort?: BidSortOptions): Promise<{ message: string; bids: Bid[] }> => {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.taskId) params.taskId = filters.taskId;
    if (sort?.field) params.sortBy = sort.field;
    if (sort?.order) params.sortOrder = sort.order;

    const response = await api.get('/bids/my-bids', { params });
    return response.data;
  },

  // Get bids for a specific task
  getTaskBids: async (taskId: string, filters?: BidFilter, sort?: BidSortOptions): Promise<{ message: string; bids: Bid[] }> => {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (sort?.field) params.sortBy = sort.field;
    if (sort?.order) params.sortOrder = sort.order;

    const response = await api.get(`/bids/tasks/${taskId}/bids`, { params });
    return response.data;
  },

  // Get contract for a task
  getTaskContract: async (taskId: string): Promise<{ message: string; contract: Contract }> => {
    const response = await api.get(`/bids/tasks/${taskId}/contract`);
    return response.data;
  },

  // Get contract by ID
  getContract: async (contractId: string): Promise<{ message: string; contract: Contract }> => {
    const response = await api.get(`/bids/contracts/${contractId}`);
    return response.data;
  },

  // Update contract
  updateContract: async (contractId: string, data: Partial<CreateContractData>): Promise<{ message: string; contract: Contract }> => {
    const response = await api.put(`/bids/contracts/${contractId}`, data);
    return response.data;
  },

  // Deactivate contract
  deactivateContract: async (contractId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/bids/contracts/${contractId}`);
    return response.data;
  },
};

export default api;
 