import axios from 'axios';
import { Task, CreateTaskData, UpdateTaskData } from '@/types/task.types';
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

export default api;
 