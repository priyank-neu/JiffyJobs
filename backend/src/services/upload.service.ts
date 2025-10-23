import crypto from 'crypto';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const generatePresignedUrl = async (
  fileName: string,
  fileType: string
): Promise<{ uploadUrl: string; fileUrl: string; key: string; isBase64Upload: boolean }> => {
  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  // Generate unique key
  const key = `tasks/${crypto.randomUUID()}-${fileName}`;

  // Development mode: Signal that frontend should use base64
  console.log('📸 Mock photo upload - using base64 encoding for:', fileName);
  
  return {
    uploadUrl: 'BASE64_UPLOAD', // Special flag for frontend
    fileUrl: key, // Will be replaced with base64 by frontend
    key,
    isBase64Upload: true,
  };
};

export const validateFileUpload = (fileSize: number, fileType: string): void => {
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
  }
};