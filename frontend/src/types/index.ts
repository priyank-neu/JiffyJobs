export interface User {
  userId: string;
  email: string;
  name?: string;
  isVerified: boolean;
  role?: 'POSTER' | 'HELPER' | 'ADMIN';
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface SignupData {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// Error type for API errors
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}