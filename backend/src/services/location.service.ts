import prisma from '../config/database';

export const createLocation = async (locationData: {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
}) => {
  return await prisma.location.create({
    data: locationData,
  });
};

export const maskAddress = (address: string, city?: string, state?: string): string => {
  // Show only city and state for privacy
  if (city && state) {
    return `${city}, ${state}`;
  }
  if (city) {
    return city;
  }
  // Fallback: show only first part of address
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : 'Location provided';
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  // Haversine formula for distance in kilometers
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};