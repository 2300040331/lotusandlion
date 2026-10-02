'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { uploadSingleImage, uploadMultipleImages } from '@/lib/services/uploadService';

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void;
  existingImages?: string[];
  multiple?: boolean;
  folder?: string;
}

export default function ImageUploader({ onUpload, existingImages = [], multiple = true, folder }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const initialized = useRef(false);

  // Sync internal state when existingImages prop changes (e.g., after product data loads)
  useEffect(() => {
    if (!initialized.current && existingImages.length > 0) {
      initialized.current = true;
      setImages(existingImages);
    }
  }, [existingImages]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    try {
      const targetFolder = folder || 'lotus-lion/products';
      let newUrls: string[] = [];

      if (multiple) {
        const results = await uploadMultipleImages(acceptedFiles, targetFolder);
        newUrls = results.map((r) => r.url);
      } else {
        if (acceptedFiles.length > 0) {
          const result = await uploadSingleImage(acceptedFiles[0], targetFolder);
          newUrls = [result.url];
        }
      }

      const updatedImages = multiple ? [...images, ...newUrls] : newUrls;
      
      setImages(updatedImages);
      onUpload(updatedImages);
      toast.success('Uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [images, multiple, onUpload, folder]);

  const removeImage = (url: string) => {
    const updated = images.filter((img) => img !== url);
    setImages(updated);
    onUpload(updated);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/30 bg-white/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
          {uploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white">
            {uploading ? 'Uploading...' : (isDragActive ? 'Drop images here' : 'Click or drag images')}
          </p>
          <p className="text-[10px] uppercase text-gray-500 tracking-widest mt-1">
            PNG, JPG, WEBP up to 10MB
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-[9/16] rounded-lg overflow-hidden bg-white flex items-center justify-center border border-white/10">
              <img src={url} alt="" className="w-full h-full object-contain" />
              <button 
                onClick={() => removeImage(url)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-black text-[8px] font-bold uppercase tracking-widest py-1 text-center">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
