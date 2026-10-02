import { supabase } from '@/lib/supabase';

export async function uploadSingleImage(file: File, folder = 'lotus-lion/products'): Promise<{ url: string; publicId: string }> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${folder}/${filename}`;

    const { data, error } = await supabase.storage
      .from('lotus-lion')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('lotus-lion')
      .getPublicUrl(filePath);

    return {
      url: publicUrl,
      publicId: filePath,
    };
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
}

export async function uploadMultipleImages(files: File[], folder = 'lotus-lion/products'): Promise<Array<{ url: string; publicId: string }>> {
  return Promise.all(files.map((file) => uploadSingleImage(file, folder)));
}
