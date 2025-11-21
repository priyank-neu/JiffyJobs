import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '@/services/api.service';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photos, onPhotosChange, maxPhotos = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onDrop = async (acceptedFiles: File[]) => {
    if (photos.length + acceptedFiles.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        // Validate with backend
        await api.post('/uploads/presigned-url', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });

        // Convert file to base64 for development mode
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onPhotosChange([...photos, ...uploadedUrls]);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },
  maxSize: 2 * 1024 * 1024, // 2MB instead of 5MB for base64
  multiple: true,
});

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Photos (Optional)
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {photos.length < maxPhotos && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'divider',
            mb: 2,
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" gutterBottom>
            {isDragActive ? 'Drop photos here' : 'Drag & drop photos here, or click to select'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
  Max {maxPhotos} photos, 2MB each recommended. JPG, PNG, WebP only.
</Typography>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            ({photos.length}/{maxPhotos} uploaded)
          </Typography>
        </Paper>
      )}

      {uploading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Processing photos...
        </Alert>
      )}

      {photos.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {photos.length} photo{photos.length > 1 ? 's' : ''} added
          </Typography>
          <ImageList cols={3} gap={8}>
            {photos.map((photo, index) => (
              <ImageListItem key={index}>
                <img
                  src={photo}
                  alt={`Upload ${index + 1}`}
                  loading="lazy"
                  style={{ height: 150, objectFit: 'cover', borderRadius: 4 }}
                />
                <ImageListItemBar
                  actionIcon={
                    <IconButton
                      sx={{ color: 'white' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(index);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </Box>
  );
};

export default PhotoUpload;