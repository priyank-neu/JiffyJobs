export interface UserProfile {
  userId: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferredHourlyRate: number | null;
  role: 'POSTER' | 'HELPER' | 'ADMIN';
  isVerified: boolean;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  neighborhoodLocationId: string | null;
  neighborhoodVerified: boolean;
  neighborhoodVerifiedAt: string | null;
  neighborhoodLocation?: {
    locationId: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string;
  };
  userSkills: Array<{
    userSkillId: string;
    skillId: string;
    level: string;
    experienceYears: number | null;
    skill: {
      skillId: string;
      name: string;
      category: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  userId: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  preferredHourlyRate: number | null;
  role: 'POSTER' | 'HELPER' | 'ADMIN';
  neighborhoodVerified: boolean;
  neighborhoodLocation: {
    city: string | null;
    state: string | null;
    zipCode: string | null;
    approximateLatitude: number;
    approximateLongitude: number;
  } | null;
  userSkills: Array<{
    userSkillId: string;
    skillId: string;
    level: string;
    experienceYears: number | null;
    skill: {
      skillId: string;
      name: string;
      category: string;
    };
  }>;
  ratingsSummary: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  _count: {
    reviewsReceived: number;
    contracts: number;
  };
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  preferredHourlyRate?: number;
}

export interface NeighborhoodLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

