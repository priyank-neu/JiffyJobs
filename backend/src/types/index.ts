import { Request } from 'express';
 
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}
 
export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
  phoneNumber?: string;
}
 
export interface LoginRequest {
  email: string;
  password: string;
}
 
export interface ForgotPasswordRequest {
  email: string;
}
 
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
 
export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}
 
// Bid related interfaces
export interface Bid {
  bidId: string;
  taskId: string;
  helperId: string;
  amount: number; // Will be converted from Decimal
  note?: string;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
  helper?: {
    userId: string;
    name?: string;
    email: string;
  };
}
 
export interface CreateBidRequest {
  taskId: string;
  amount: number;
  note?: string;
}
 
export interface WithdrawBidRequest {
  bidId: string;
}
 
export interface AcceptBidRequest {
  bidId: string;
}
 
// Contract related interfaces
export interface Contract {
  contractId: string;
  taskId: string;
  helperId: string;
  posterId: string;
  agreedAmount: number; // Will be converted from Decimal
  acceptedBidId: string;
  startDate?: Date;
  endDate?: Date;
  terms?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  helper?: {
    userId: string;
    name?: string;
    email: string;
  };
  poster?: {
    userId: string;
    name?: string;
    email: string;
  };
  acceptedBid?: Bid;
}
 
export interface CreateContractRequest {
  taskId: string;
  helperId: string;
  agreedAmount: number;
  acceptedBidId: string;
  startDate?: Date;
  endDate?: Date;
  terms?: string;
}
 
// Bid listing and filtering
export interface BidFilter {
  status?: BidStatus;
  helperId?: string;
  taskId?: string;
}
 
export interface BidSortOptions {
  field: 'amount' | 'createdAt' | 'helperName';
  order: 'asc' | 'desc';
}
 