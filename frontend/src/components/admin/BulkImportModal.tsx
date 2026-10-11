'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Trash2, Check, AlertCircle, FileText, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { uploadSingleImage, uploadMultipleImages } from '@/lib/services/uploadService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lockCollection?: string;
  initialFiles?: File[];
}

interface ProductDraft {
  id: string; // client-side unique temp id
  name: string;
  price: number;
  discountPrice?: number;
  category: string;
  collection: string;
  countInStock: number;
  sizes: Record<string, number>;
  description: string;
  image: string;
  images: string[];
  colors?: string[];
  colorInput?: string;
  status: 'pending' | 'uploading' | 'publishing' | 'success' | 'error';
  errorMessage?: string;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess, lockCollection, initialFiles = [] }: BulkImportModalProps) {
  const [drafts, setDrafts] = useState<ProductDraft[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowImageUploadTarget = useRef<string | null>(null);

  // Fetch collections on mount
  useEffect(() => {
    if (isOpen) {
      api.get('/admin/collections')
        .then(({ data }) => {
          setCollections(data || []);
        })
        .catch(() => {
          toast.error('Failed to load collections');
        });
    }
  }, [isOpen]);

  // Handle initialFiles if passed from parent
  useEffect(() => {
    if (isOpen && initialFiles && initialFiles.length > 0) {
      handleDrop(initialFiles);
    }
  }, [isOpen, initialFiles]);

  const removeDraft = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDraftField = (id: string, field: keyof ProductDraft, value: any) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  // Upload an image for a specific draft row
  const handleRowImageUploadClick = (draftId: string) => {
    rowImageUploadTarget.current = draftId;
    fileInputRef.current?.click();
  };

  const handleRowImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const targetId = rowImageUploadTarget.current;
    if (files.length === 0 || !targetId) return;

    // Reset input
    e.target.value = '';
    rowImageUploadTarget.current = null;

    // Set row to uploading
    setDrafts((prev) =>
      prev.map((d) => (d.id === targetId ? { ...d, status: 'uploading', errorMessage: undefined } : d))
    );

    try {
      const folder = 'lotus-lion/products';
      const results = await uploadMultipleImages(files, folder);
      const newUrls = results.map((r) => r.url);

      setDrafts((prev) =>
        prev.map((d) => {
          if (d.id === targetId) {
            const updatedImages = [...d.images, ...newUrls];
            return {
              ...d,
              images: updatedImages,
              image: updatedImages[0] || d.image || '',
              status: 'pending'
            };
          }
          return d;
        })
      );
      toast.success('Images uploaded');
    } catch (err: any) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === targetId
            ? { ...d, status: 'error', errorMessage: 'Upload failed' }
            : d
        )
      );
      toast.error('Image upload failed');
    }
  };

  // Robust CSV parser
  const parseCSV = (text: string): any[] => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    const parseLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map((val) => val.replace(/^"|"$/g, ''));
    };

    const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length < headers.length) continue;
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
    return data;
  };

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const imageFiles = acceptedFiles.filter((f) => f.type.startsWith('image/'));
      const dataFiles = acceptedFiles.filter(
        (f) => f.name.endsWith('.csv') || f.name.endsWith('.json')
      );

      // Process CSV/JSON first
      for (const file of dataFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            let parsedItems: any[] = [];

            if (file.name.endsWith('.json')) {
              const parsed = JSON.parse(content);
              parsedItems = Array.isArray(parsed) ? parsed : [parsed];
            } else {
              parsedItems = parseCSV(content);
            }

            const newDrafts: ProductDraft[] = parsedItems.map((item) => {
              const name = item.name || item.title || 'Unnamed Item';
              const price = parseFloat(item.price) || 0;
              const discountPrice = item.discountprice || item.discountPrice || item.discount_price 
                ? parseFloat(item.discountprice || item.discountPrice || item.discount_price) 
                : undefined;
              const category = item.category || 'Essentials';
              const collection = lockCollection || item.collection || item.collectionid || 'lotus';
              const countInStock = parseInt(item.countinstock || item.countInStock || item.stock || item.quantity) || 10;
              const description = item.description || '';
              const image = String(item.image || item.imageurl || item.image_url || '').trim();
              
              // Extract sizes
              const sizes: Record<string, number> = {
                XS: parseInt(item.xs || item.XS) || 0,
                S: parseInt(item.s || item.S) || 0,
                M: parseInt(item.m || item.M) || 0,
                L: parseInt(item.l || item.L) || 0,
                XL: parseInt(item.xl || item.XL) || 0,
                XXL: parseInt(item.xxl || item.XXL) || 0,
              };

              const sizesSum = Object.values(sizes).reduce((a, b) => a + b, 0);
              let finalCountInStock = countInStock;
              if (sizesSum > 0) {
                finalCountInStock = sizesSum;
              } else {
                // If sizes were not defined, default the general countInStock to M
                sizes.M = countInStock;
              }

              // Extract colors
              const colorsStr = item.color || item.colors || item.colour || item.colours || '';
              const parsedColors = typeof colorsStr === 'string'
                ? colorsStr.split(/[,;|]/).map(c => c.trim()).filter(Boolean)
                : (Array.isArray(colorsStr) ? colorsStr.map(c => String(c).trim()).filter(Boolean) : []);
              const colorInput = Array.isArray(colorsStr) ? colorsStr.join(', ') : String(colorsStr);

              // Parse multiple images (handles arrays and delimited strings like comma, semicolon, or pipe)
              let images: string[] = [];
              if (item.images) {
                if (Array.isArray(item.images)) {
                  images = item.images.map((img: any) => String(img).trim()).filter(Boolean);
                } else if (typeof item.images === 'string') {
                  images = item.images.split(/[,;|]/).map((img: string) => img.trim()).filter(Boolean);
                } else {
                  images = [String(item.images).trim()];
                }
              } else if (image) {
                images = [image];
              }

              return {
                id: Math.random().toString(36).substring(7),
                name,
                price,
                discountPrice,
                category,
                collection,
                countInStock: finalCountInStock,
                sizes,
                description,
                image,
                images,
                colors: parsedColors,
                colorInput: colorInput,
                status: 'pending',
              };
            });

            setDrafts((prev) => [...prev, ...newDrafts]);
            toast.success(`Loaded ${newDrafts.length} drafts from ${file.name}`);
          } catch (err) {
            toast.error(`Failed to parse data file ${file.name}`);
          }
        };
        reader.readAsText(file);
      }

      // Process image files (upload to Cloudinary)
      if (imageFiles.length > 0) {
        // Create skeleton drafts immediately so user sees uploading state
        const initialTempDrafts = imageFiles.map((file) => {
          const niceName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return {
            id: Math.random().toString(36).substring(7),
            name: niceName,
            price: 0,
            category: 'Essentials',
            collection: lockCollection || 'lotus',
            countInStock: 10,
            sizes: { XS: 0, S: 0, M: 10, L: 0, XL: 0, XXL: 0 },
            description: '',
            image: '',
            images: [],
            colors: [],
            colorInput: '',
            status: 'uploading' as const,
            file, // temporarily keep file to upload
          };
        });

        setDrafts((prev) => [...prev, ...initialTempDrafts.map(({ file, ...rest }) => rest)]);

        // Upload them sequentially
        for (const tempDraft of initialTempDrafts) {
          try {
            const folder = 'lotus-lion/products';
            const result = await uploadSingleImage(tempDraft.file, folder);

            setDrafts((prev) =>
              prev.map((d) =>
                d.id === tempDraft.id
                  ? { ...d, image: result.url, images: [result.url], status: 'pending' }
                  : d
              )
            );
          } catch (err) {
            setDrafts((prev) =>
              prev.map((d) =>
                d.id === tempDraft.id
                  ? { ...d, status: 'error', errorMessage: 'Upload failed' }
                  : d
              )
            );
          }
        }
      }
    },
    [lockCollection]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'image/*': [],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  // Bulk publish all drafts
  const handlePublishAll = async () => {
    // Validation
    const invalid = drafts.some((d) => !d.name.trim() || d.price < 0);
    if (invalid) {
      toast.error('Please fix invalid drafts (empty names or negative prices).');
      return;
    }

    setIsPublishingAll(true);
    let successCount = 0;

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      if (draft.status === 'success') {
        successCount++;
        continue;
      }

      setDrafts((prev) =>
        prev.map((d) => (d.id === draft.id ? { ...d, status: 'publishing' } : d))
      );

      try {
        const draftColors = draft.colors && draft.colors.length > 0 ? draft.colors : ['Default'];
        const variants: any[] = [];
        draftColors.forEach((color) => {
          Object.entries(draft.sizes).forEach(([size, qty]) => {
            if (qty > 0 || draftColors.length > 1) {
              variants.push({
                color,
                size,
                quantity: qty
              });
            }
          });
        });

        const payload = {
          name: draft.name,
          description: draft.description || `Luxury ${draft.name}`,
          price: draft.price,
          discountPrice: draft.discountPrice || null,
          category: draft.category,
          collectionType: draft.collection,
          countInStock: draft.countInStock,
          sizes: draft.sizes,
          image: draft.image,
          images: draft.images.length > 0 ? draft.images : (draft.image ? [draft.image] : []),
          variants,
          isFeatured: false,
          isVisible: true,
        };

        await api.post('/admin/products', payload);
        
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: 'success' } : d))
        );
        successCount++;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || 'Publish failed';
        setDrafts((prev) =>
          prev.map((d) => (d.id === draft.id ? { ...d, status: 'error', errorMessage: errMsg } : d))
        );
      }
    }

    setIsPublishingAll(false);

    if (successCount === drafts.length) {
      toast.success('All products published successfully!');
      onSuccess();
      onClose();
      setDrafts([]);
    } else if (successCount > 0) {
      toast.success(`Published ${successCount} products. Some failed.`);
    } else {
      toast.error('Failed to publish products. Check errors in the table.');
    }
  };

  const hasUploading = drafts.some((d) => d.status === 'uploading' || d.status === 'publishing');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Hidden file input for row-level image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRowImageFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="bg-[#FEFFEF] border border-[#573B2D]/20 rounded-2xl w-full max-w-6xl max-h-[85vh] flex flex-col text-[#573B2D] shadow-2xl overflow-hidden animate-none">
        
        {/* Header */}
        <div className="border-b border-[#573B2D]/15 p-6 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#573B2D]">Bulk Vault Import</h2>
            <p className="text-[10px] uppercase text-[#573B2D]/70 tracking-wider mt-1">
              Drag & Drop product media or spreadsheet data directly to catalog.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="text-[#573B2D] hover:bg-[#573B2D]/10 transition-colors p-1.5 rounded-lg animate-none cursor-pointer"
              title="Show Import Format Guidelines"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={onClose}
              disabled={isPublishingAll}
              className="p-1.5 rounded-lg text-[#573B2D] hover:bg-[#573B2D]/10 transition-all disabled:opacity-50 animate-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Guidelines / Help Accordion */}
        {showHelp && (
          <div className="bg-white border-b border-[#573B2D]/15 p-6 text-xs text-[#573B2D] space-y-3 overflow-y-auto max-h-[25vh]">
            <p className="font-bold text-[#573B2D] uppercase tracking-wider">Spreadsheet Schema Guidelines</p>
            <p>You can drag and drop a `.csv` or `.json` file to auto-populate products. The following column/key headers are recognized:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
              <div>
                <p className="font-bold text-white uppercase text-[10px]">name *</p>
                <p className="text-[9px] text-gray-500">e.g. Silk Linen Dress</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">price *</p>
                <p className="text-[9px] text-gray-500">e.g. 2999</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">discountPrice</p>
                <p className="text-[9px] text-gray-500">e.g. 2499</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">collection</p>
                <p className="text-[9px] text-gray-500">lotus / lion</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">category</p>
                <p className="text-[9px] text-gray-500">e.g. T-Shirts</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">stock</p>
                <p className="text-[9px] text-gray-500">e.g. 25</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">image</p>
                <p className="text-[9px] text-gray-500">Image URL</p>
              </div>
              <div>
                <p className="font-bold text-white uppercase text-[10px]">description</p>
                <p className="text-[9px] text-gray-500">HTML description</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-6">
          
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
              isDragActive
                ? 'border-[#573B2D] bg-[#573B2D]/5'
                : 'border-[#573B2D]/30 hover:border-[#573B2D] bg-white'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-12 h-12 rounded-full bg-[#573B2D]/10 flex items-center justify-center text-[#573B2D]">
              <Upload size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#573B2D]">
                {isDragActive ? 'Drop files here' : 'Drop CSV, JSON, or Product Images'}
              </p>
              <p className="text-[10px] uppercase text-[#573B2D]/70 tracking-widest mt-1">
                CSV/JSON spreadsheets or bulk PNG, JPG, WEBP product pictures
              </p>
            </div>
          </div>

          {/* Drafts List Table */}
          {drafts.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-[30vh]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#573B2D]">Drafts in Queue ({drafts.length})</h3>
                <button
                  onClick={() => setDrafts([])}
                  disabled={hasUploading}
                  className="text-[10px] uppercase font-bold tracking-wider text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors animate-none cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="flex-1 overflow-auto border border-[#573B2D]/20 rounded-xl bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FEFFEF] text-[#573B2D] uppercase tracking-widest text-[10px] font-extrabold sticky top-0 z-10 border-b border-[#573B2D]/20">
                    <tr>
                      <th className="p-4 w-32 font-extrabold text-[#573B2D]">Images</th>
                      <th className="p-4 font-extrabold text-[#573B2D]">Product Name</th>
                      <th className="p-4 w-40 font-extrabold text-[#573B2D]">Collection</th>
                      <th className="p-4 w-32 font-extrabold text-[#573B2D]">Category</th>
                      <th className="p-4 w-40 font-extrabold text-[#573B2D]">Color(s)</th>
                      <th className="p-4 w-28 font-extrabold text-[#573B2D]">Price (₹)</th>
                      <th className="p-4 w-28 font-extrabold text-[#573B2D]">Discount (₹)</th>
                      <th className="p-4 w-64 font-extrabold text-center text-[#573B2D]">Sizes Stock</th>
                      <th className="p-4 w-24 font-extrabold text-[#573B2D]">Status</th>
                      <th className="p-4 w-12 text-center font-extrabold text-[#573B2D]">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#573B2D]/10 bg-white">
                    {drafts.map((draft) => {
                      const isUploading = draft.status === 'uploading';
                      const isPublishing = draft.status === 'publishing';
                      const isSuccess = draft.status === 'success';
                      const isError = draft.status === 'error';

                      return (
                        <tr key={draft.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Images */}
                          <td className="p-3 w-32">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {draft.images && draft.images.length > 0 ? (
                                draft.images.map((url, idx) => (
                                  <div key={idx} className="relative w-8 h-12 bg-white/5 rounded overflow-hidden border border-white/10 group/img flex-shrink-0">
                                    <img src={url} alt="" className="w-full h-full object-contain" />
                                    {!isUploading && !isPublishing && !isSuccess && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDrafts(prev => prev.map(d => {
                                            if (d.id === draft.id) {
                                              const updated = d.images.filter(img => img !== url);
                                              return {
                                                ...d,
                                                images: updated,
                                                image: updated[0] || ''
                                              };
                                            }
                                            return d;
                                          }));
                                        }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity z-20 cursor-pointer"
                                        title="Delete side image"
                                      >
                                        <X size={8} />
                                      </button>
                                    )}
                                    {idx === 0 && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-[#c8a45d]/90 text-black text-[5px] font-bold uppercase py-0.5 text-center leading-none">
                                        Main
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : draft.image ? (
                                <div className="relative w-8 h-12 bg-white/5 rounded overflow-hidden border border-white/10 flex-shrink-0">
                                  <img src={draft.image} alt="" className="w-full h-full object-contain" />
                                  <div className="absolute bottom-0 left-0 right-0 bg-[#c8a45d]/90 text-black text-[5px] font-bold uppercase py-0.5 text-center leading-none">
                                    Main
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => !isUploading && !isPublishing && !isSuccess && handleRowImageUploadClick(draft.id)}
                                  className="w-8 h-12 bg-white/5 rounded border border-white/10 flex items-center justify-center cursor-pointer text-gray-500 hover:text-white flex-shrink-0"
                                >
                                  <FileText size={14} />
                                </div>
                              )}
                              {!isUploading && !isPublishing && !isSuccess && (
                                <div
                                  onClick={() => handleRowImageUploadClick(draft.id)}
                                  className="w-8 h-12 bg-white/5 rounded border border-dashed border-white/25 hover:border-[#c8a45d]/50 flex items-center justify-center cursor-pointer text-gray-500 hover:text-[#c8a45d] transition-colors flex-shrink-0"
                                  title="Upload side images"
                                >
                                  <Upload size={10} />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={draft.name}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'name', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white font-bold disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                            />
                          </td>

                          {/* Collection */}
                          <td className="p-3">
                            <select
                              value={draft.collection}
                              disabled={isSuccess || isPublishing || !!lockCollection}
                              onChange={(e) => updateDraftField(draft.id, 'collection', e.target.value)}
                              className="w-full bg-[#111] border border-white/10 rounded-lg p-2 text-white disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                            >
                              {collections.length > 0 ? (
                                collections.map((c) => (
                                  <option key={c.id} value={c.slug}>
                                    {c.name || c.title}
                                  </option>
                                ))
                              ) : (
                                <>
                                  <option value="lotus">Lotus Collection</option>
                                  <option value="lion">Lion Collection</option>
                                </>
                              )}
                            </select>
                          </td>

                          {/* Category */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={draft.category}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'category', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                            />
                          </td>

                          {/* Color(s) */}
                          <td className="p-3">
                            <input
                              type="text"
                              value={draft.colorInput || ''}
                              disabled={isSuccess || isPublishing}
                              placeholder="e.g. Black, White"
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsedColors = val.split(',').map(c => c.trim()).filter(Boolean);
                                setDrafts((prev) =>
                                  prev.map((d) =>
                                    d.id === draft.id
                                      ? { ...d, colorInput: val, colors: parsedColors }
                                      : d
                                  )
                                );
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                            />
                          </td>

                          {/* Price */}
                          <td className="p-3">
                            <input
                              type="number"
                              value={draft.price}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'price', Number(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                            />
                          </td>

                          {/* Discount Price */}
                          <td className="p-3">
                            <input
                              type="number"
                              value={draft.discountPrice || ''}
                              disabled={isSuccess || isPublishing}
                              onChange={(e) => updateDraftField(draft.id, 'discountPrice', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white disabled:opacity-50 focus:border-[#c8a45d]/50 outline-none"
                              placeholder="None"
                            />
                          </td>

                          {/* Stock (per size) */}
                          <td className="p-3 w-64">
                            <div className="flex flex-col gap-1 justify-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                                  const qty = draft.sizes?.[size] || 0;
                                  return (
                                    <div key={size} className="flex flex-col items-center min-w-[32px]">
                                      <span className="text-[7px] text-gray-500 font-bold uppercase mb-0.5">{size}</span>
                                      <input
                                        type="number"
                                        value={qty}
                                        disabled={isSuccess || isPublishing}
                                        onChange={(e) => {
                                          const newQty = Math.max(0, parseInt(e.target.value) || 0);
                                          const updatedSizes = { ...draft.sizes, [size]: newQty };
                                          const newTotal = Object.values(updatedSizes).reduce((a, b) => a + b, 0);
                                          setDrafts((prev) =>
                                            prev.map((d) =>
                                              d.id === draft.id
                                                ? { ...d, sizes: updatedSizes, countInStock: newTotal }
                                                : d
                                            )
                                          );
                                        }}
                                        className="w-8 bg-black/30 border border-white/10 rounded p-0.5 text-white text-center text-[9px] font-bold focus:border-[#c8a45d]/50 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-center text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                Total: <span className="text-primary font-bold">{draft.countInStock}</span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px]">
                              {isUploading && (
                                <>
                                  <Loader2 size={12} className="animate-spin text-[#c8a45d]" />
                                  <span className="text-[#c8a45d]">Uploading</span>
                                </>
                              )}
                              {isPublishing && (
                                <>
                                  <Loader2 size={12} className="animate-spin text-blue-400" />
                                  <span className="text-blue-400">Saving</span>
                                </>
                              )}
                              {isSuccess && (
                                <>
                                  <Check size={12} className="text-green-500" />
                                  <span className="text-green-500">Published</span>
                                </>
                              )}
                              {isError && (
                                <div className="group relative flex items-center gap-1 cursor-help animate-none" title={draft.errorMessage}>
                                  <AlertCircle size={12} className="text-red-500" />
                                  <span className="text-red-500">Failed</span>
                                </div>
                              )}
                              {draft.status === 'pending' && (
                                <span className="text-gray-500">Ready</span>
                              )}
                            </div>
                          </td>

                          {/* Delete */}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeDraft(draft.id)}
                              disabled={isSuccess || isPublishing || isUploading}
                              className="text-gray-500 hover:text-red-500 disabled:opacity-30 transition-colors p-1 animate-none cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#573B2D]/15 p-6 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] uppercase tracking-wider text-[#573B2D] font-bold">
            {drafts.length > 0 ? (
              <>
                {drafts.filter(d => d.status === 'success').length} of {drafts.length} Published
                {drafts.some(d => d.status === 'uploading') && ' (Media uploads in progress...)'}
              </>
            ) : (
              'No drafts loaded yet'
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onClose}
              disabled={isPublishingAll}
              className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#573B2D]/30 text-[#573B2D] hover:bg-[#573B2D]/10 transition-all cursor-pointer animate-none"
            >
              Cancel
            </button>
            <button
              onClick={handlePublishAll}
              disabled={drafts.length === 0 || hasUploading}
              className="bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#573B2D]/90 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none animate-none"
            >
              {isPublishingAll ? <Loader2 className="animate-spin text-[#FEFFEF]" size={16} /> : <Check size={16} className="text-[#FEFFEF]" />}
              Publish to Vault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
