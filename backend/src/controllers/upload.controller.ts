import { Response } from 'express';
import { AuthRequest } from '../types';
import { generatePresignedUrl, validateFileUpload } from '../services/upload.service';

export const getPresignedUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType || !fileSize) {
      res.status(400).json({ error: 'Missing required fields: fileName, fileType, fileSize' });
      return;
    }

    // Validate file
    validateFileUpload(fileSize, fileType);

    // Generate presigned URL
    const result = await generatePresignedUrl(fileName, fileType);

    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  }
};