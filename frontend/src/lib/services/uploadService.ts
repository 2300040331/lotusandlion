import api from '@/lib/api';

export interface UploadResult {
  url: string;
  publicId?: string;
}

/**
 * Upload a single image file via backend API
 */
export async function uploadSingleImage(file: File, folder = 'products'): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('image', file);

  const { data } = await api.post('/admin/upload/single', formData, {
    params: { folder },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return {
    url: data.url,
    publicId: data.publicId,
  };
}

/**
 * Upload multiple image files via backend API
 */
export async function uploadMultipleImages(files: File[], folder = 'products'): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const { data } = await api.post('/admin/upload/multiple', formData, {
    params: { folder },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return (data.images || []).map((img: any) => ({
    url: img.url,
    publicId: img.publicId,
  }));
}

export const uploadService = {
  uploadSingleImage,
  uploadMultipleImages,
};
