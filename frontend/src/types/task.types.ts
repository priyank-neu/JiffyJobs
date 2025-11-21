export enum TaskStatus {
  OPEN = 'OPEN',
  IN_BIDDING = 'IN_BIDDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION',
  DISPUTED = 'DISPUTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskCategory {
  HOME_REPAIR = 'HOME_REPAIR',
  CLEANING = 'CLEANING',
  MOVING = 'MOVING',
  DELIVERY = 'DELIVERY',
  ASSEMBLY = 'ASSEMBLY',
  YARD_WORK = 'YARD_WORK',
  PET_CARE = 'PET_CARE',
  TECH_SUPPORT = 'TECH_SUPPORT',
  TUTORING = 'TUTORING',
  OTHER = 'OTHER',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export interface Location {
  locationId: string;
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}

export interface Task {
  taskId: string;
  title: string;
  description: string;
  category: TaskCategory;
  budget: number;
  budgetMin?: number;
  budgetMax?: number;
  status: TaskStatus;
  location?: Location;
  locationId?: string;
  addressMasked?: string;
  taskDate?: string;
  estimatedHours?: number;
  posterId: string;
  assignedHelperId?: string;
  createdAt: string;
  updatedAt: string;
  poster?: {
    userId: string;
    name?: string;
    email: string;
  };
  assignedHelper?: {
    userId: string;
    name?: string;
  };
  photos?: TaskPhoto[];
}

export interface TaskWithDistance extends Task {
  distance?: number;
  skillMatch?: {
    isGoodMatch: boolean;
    matchingSkills: string[];
  };
}

export interface TaskPhoto {
  photoId: string;
  taskId: string;
  photoUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export interface CreateTaskData {
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

export interface UpdateTaskData {
  title?: string;
  description?: string;
  category?: TaskCategory;
  budget?: number;
  budgetMin?: number;
  budgetMax?: number;
  taskDate?: Date;
  estimatedHours?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
}

// Bid related interfaces
export interface Bid {
  bidId: string;
  taskId: string;
  helperId: string;
  amount: number;
  note?: string;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
  helper?: {
    userId: string;
    name?: string;
    email: string;
  };
  task?: {
    taskId: string;
    title: string;
    status: TaskStatus;
    poster?: {
      userId: string;
      name?: string;
      email: string;
    };
  };
}

export interface CreateBidData {
  taskId: string;
  amount: number;
  note?: string;
}

export interface WithdrawBidData {
  bidId: string;
}

export interface AcceptBidData {
  bidId: string;
}

// Contract related interfaces
export interface Contract {
  contractId: string;
  taskId: string;
  helperId: string;
  posterId: string;
  agreedAmount: number;
  acceptedBidId: string;
  startDate?: string;
  endDate?: string;
  terms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

export interface CreateContractData {
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