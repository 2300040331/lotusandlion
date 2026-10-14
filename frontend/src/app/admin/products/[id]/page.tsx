'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Save, Package, Tag, DollarSign, Layers, Calendar, Star, Eye, Zap, Loader2, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProductFormPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === 'new';
  
  const { data: product, loading } = useAdminData(isNew ? '' : `/admin/products/${id}`);
  
  const [enableColors, setEnableColors] = useState(false);
  const [colorsList, setColorsList] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [sizesList, setSizesList] = useState<string[]>(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  const [newSizeInput, setNewSizeInput] = useState('');

  useEffect(() => {
    api.get('/admin/collections').then(({ data }) => {
      setCollections(data || []);
    }).catch(() => undefined);
  }, []);

  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    price: 0,
    discountPrice: 0,
    category: 'Lotus Collections',
    collection: 'lotus',
    collectionType: 'lotus',
    countInStock: 0,
    sizes: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    variants: [],
    isFeatured: false,
    isVisible: true,
    isPublished: true,
    flashSale: false,
    releaseDate: '',
    tags: [],
    image: '',
    images: [],
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product && !isNew) {
      const formattedDate = product.releaseDate 
        ? (() => {
            const date = new Date(product.releaseDate);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
          })() 
        : '';

      const productVariants = product.variants || [];
      const hasActualColors = productVariants.some((v: any) => v.color && v.color !== 'Default');
      const uniqueColors = [...new Set(productVariants.map((v: any) => v.color || 'Default'))].filter(c => c !== 'Default') as string[];
      
      setEnableColors(hasActualColors);
      setColorsList(hasActualColors ? uniqueColors : []);

      // Parse and merge database-defined sizes with default ones
      const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const variantSizes = productVariants.map((v: any) => v.size).filter(Boolean);
      const dbSizes = product.sizes ? Object.keys(product.sizes) : [];
      const mergedSizes = [...new Set([...defaultSizes, ...variantSizes, ...dbSizes])];
      setSizesList(mergedSizes);

      setFormData({
        ...formData, // Keep defaults for missing fields
        ...product,
        variants: productVariants,
        sizes: product.sizes || formData.sizes,
        images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
        releaseDate: formattedDate,
      });
    }
  }, [product, isNew]);

  useEffect(() => {
    if (isNew) {
      const initialVariants = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => ({
        color: 'Default',
        size,
        quantity: 0
      }));
      setFormData((prev: any) => ({
        ...prev,
        variants: initialVariants
      }));
    }
  }, [isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/products', formData);
        toast.success('Product created successfully');
      } else {
        await api.put(`/admin/products/${id}`, formData);
        toast.success('Product updated successfully');
      }
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const updateSize = (size: string, qty: number) => {
    const currentVariants = [...(formData.variants || [])];
    const idx = currentVariants.findIndex((v: any) => v.color === 'Default' && v.size === size);
    if (idx >= 0) {
      currentVariants[idx].quantity = qty;
    } else {
      currentVariants.push({ color: 'Default', size, quantity: qty });
    }

    const newSizes = { ...formData.sizes, [size]: qty };
    const totalStock = Object.values(newSizes).reduce((a: any, b: any) => a + b, 0);

    setFormData({
      ...formData,
      sizes: newSizes,
      variants: currentVariants,
      countInStock: totalStock
    });
  };

  const updateVariantQty = (color: string, size: string, qty: number) => {
    const currentVariants = [...(formData.variants || [])];
    const idx = currentVariants.findIndex((v: any) => v.color === color && v.size === size);
    if (idx >= 0) {
      currentVariants[idx].quantity = qty;
    } else {
      currentVariants.push({ color, size, quantity: qty });
    }
    
    const totalStock = currentVariants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
    
    setFormData({
      ...formData,
      variants: currentVariants,
      countInStock: totalStock
    });
  };

  const handleAddColor = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanColor = newColorInput.trim();
    if (!cleanColor) return;
    
    const formattedColor = cleanColor.charAt(0).toUpperCase() + cleanColor.slice(1);
    if (colorsList.includes(formattedColor)) {
      toast.error('Color already exists');
      return;
    }

    const updatedColorsList = [...colorsList, formattedColor];
    setColorsList(updatedColorsList);
    setNewColorInput('');

    setFormData((prev: any) => {
      const currentVariants = [...(prev.variants || [])];
      
      sizesList.forEach((size) => {
        const exists = currentVariants.some((v: any) => v.color === formattedColor && v.size === size);
        if (!exists) {
          currentVariants.push({
            color: formattedColor,
            size,
            quantity: 0
          });
        }
      });

      return {
        ...prev,
        variants: currentVariants
      };
    });

    toast.success(`Color ${formattedColor} added`);
  };

  const handleRemoveColor = (colorToRemove: string) => {
    const updatedColorsList = colorsList.filter(c => c !== colorToRemove);
    setColorsList(updatedColorsList);

    setFormData((prev: any) => {
      const currentVariants = (prev.variants || []).filter((v: any) => v.color !== colorToRemove);
      
      let finalVariants = currentVariants;
      if (updatedColorsList.length === 0) {
        finalVariants = sizesList.map(size => ({
          color: 'Default',
          size,
          quantity: 0
        }));
      }

      const totalStock = finalVariants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);

      return {
        ...prev,
        variants: finalVariants,
        countInStock: totalStock
      };
    });

    toast.success(`Color ${colorToRemove} removed`);
  };

  const handleAddCustomSize = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanSize = newSizeInput.trim().toUpperCase();
    if (!cleanSize) return;
    if (sizesList.includes(cleanSize)) {
      toast.error('Size already exists');
      return;
    }

    const updatedSizesList = [...sizesList, cleanSize];
    setSizesList(updatedSizesList);
    setNewSizeInput('');

    setFormData((prev: any) => {
      const updatedSizes = { ...prev.sizes, [cleanSize]: 0 };
      const currentVariants = [...(prev.variants || [])];
      
      const activeColors = enableColors && colorsList.length > 0
        ? colorsList
        : ['Default'];

      activeColors.forEach(color => {
        const exists = currentVariants.some((v: any) => v.color === color && v.size === cleanSize);
        if (!exists) {
          currentVariants.push({
            color,
            size: cleanSize,
            quantity: 0
          });
        }
      });

      return {
        ...prev,
        sizes: updatedSizes,
        variants: currentVariants
      };
    });

    toast.success(`Size ${cleanSize} added`);
  };

  if (loading && !isNew) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-primary" size={40} />
    </div>
  );

  if (!product && !isNew) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <p className="text-gray-400">Piece not found in the archives.</p>
      <button onClick={() => router.push('/admin/products')} className="text-primary text-[10px] uppercase font-bold tracking-widest">Back to catalog</button>
    </div>
  );

  return (
    <div className="space-y-12 pb-24 text-white">
      <div className="flex items-center justify-between">
        <AdminHeader 
          title={isNew ? "New Creation" : "Edit Piece"} 
          subtitle={isNew ? "Add a new luxury item to your catalog." : `Refining ${product?.name}`} 
        />
        <div className="flex gap-4">
           <button 
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#573B2D]/30 text-[#573B2D] hover:bg-[#573B2D]/10 transition-all animate-none cursor-pointer"
           >
             Discard
           </button>
           <button 
            onClick={handleSubmit}
            disabled={saving}
            className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#573B2D]/90 transition-all cursor-pointer shadow-sm"
           >
             {saving ? <Loader2 className="animate-spin text-[#FEFFEF]" size={16} /> : <Save className="text-[#FEFFEF]" size={16} />}
             {isNew ? 'Publish Piece' : 'Commit Changes'}
           </button>
        </div>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit}>
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg"><Package size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Product Identity</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-300">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs focus:border-primary outline-none text-white font-bold"
                    placeholder="e.g. Signature Oversized Hoodie"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-300">Description (HTML Content)</label>
                  <RichTextEditor 
                    content={formData.description}
                    onChange={(html) => setFormData({...formData, description: html})}
                  />
                </div>
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Tag size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Collection Path</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-300">Store Collection</label>
                  <select
                    value={formData.collection}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const selectedColl = collections.find(c => c.id === selectedVal || c.slug === selectedVal);
                      setFormData({
                        ...formData,
                        collection: selectedVal,
                        collectionType: selectedVal,
                        category: selectedColl ? (selectedColl.name || selectedColl.title) : selectedVal,
                      });
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-white bg-[#111]"
                  >
                    {collections.length > 0 ? (
                      collections.map(c => (
                        <option key={c.id} value={c.slug}>
                          {c.name || c.title} (/{c.slug})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="lotus">Lotus Collection</option>
                        <option value="lion">Lion Collection</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-300">Category Label</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-white"
                  />
                </div>
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Layers size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Visual Assets</h2>
              </div>
              <ImageUploader 
                existingImages={formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : [])}
                onUpload={(urls) => setFormData({...formData, images: urls, image: urls[0]})}
                folder={`lotus-lion/products/${formData.collectionType}`}
              />
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Layers size={20} /></div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Size & Color Inventory</h2>
                </div>
                
                {/* Color Option Toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <span className="text-[10px] font-bold uppercase text-gray-700">Enable Colors</span>
                  <input 
                    type="checkbox" 
                    checked={enableColors} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEnableColors(checked);
                      if (checked) {
                        const activeColors = colorsList.length > 0 ? colorsList : ['Black', 'White'];
                        if (colorsList.length === 0) {
                          setColorsList(activeColors);
                        }
                        
                        const newVariants: any[] = [];
                        activeColors.forEach((color) => {
                          sizesList.forEach((size) => {
                            const existing = formData.variants?.find((v: any) => v.color === color && v.size === size);
                            newVariants.push({
                              color,
                              size,
                              quantity: existing ? existing.quantity : 0
                            });
                          });
                        });
                        const totalStock = newVariants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
                        setFormData({
                          ...formData,
                          variants: newVariants,
                          countInStock: totalStock
                        });
                      } else {
                        const defaultVariants = sizesList.map(size => {
                          const existing = formData.variants?.find((v: any) => v.size === size);
                          return {
                            color: 'Default',
                            size,
                            quantity: existing ? existing.quantity : 0
                          };
                        });
                        const totalStock = defaultVariants.reduce((sum: number, v: any) => sum + (Number(v.quantity) || 0), 0);
                        setFormData({
                          ...formData,
                          variants: defaultVariants,
                          countInStock: totalStock
                        });
                      }
                    }}
                    className="rounded bg-white/5 border-white/10 text-primary focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {enableColors && (
                <div className="space-y-4">
                  {/* Colors List Tags */}
                  <div className="flex flex-wrap gap-2">
                    {colorsList.map((color) => (
                      <span 
                        key={color} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f1e6] border border-[#e7dcc6] text-[#4f4b43] rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-black/5 animate-none cursor-pointer border-none"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {colorsList.length === 0 && (
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider py-1.5">No colors configured. Add one below.</span>
                    )}
                  </div>

                  {/* Add Color Form Row */}
                  <div className="flex items-end gap-3 p-4 bg-white/5 rounded-xl border border-[#e7dcc6]/60">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] uppercase font-bold text-gray-600">Add New Color</label>
                      <input 
                        type="text" 
                        value={newColorInput}
                        onChange={(e) => setNewColorInput(e.target.value)}
                        className="w-full bg-black/5 border border-black/10 rounded-xl p-2.5 text-xs focus:border-primary outline-none text-black font-bold"
                        placeholder="e.g. Black, Mustard, Navy"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="admin-btn-primary bg-[#573B2D] hover:bg-[#573B2D]/90 text-[#FEFFEF] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest h-fit cursor-pointer border-none shadow-sm transition-all"
                    >
                      Add Color
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Size Addition UI */}
              <div className="flex items-end gap-3 p-4 bg-white/5 rounded-xl border border-[#e7dcc6]/60">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-600">Add Custom Size</label>
                  <input 
                    type="text" 
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    className="w-full bg-black/5 border border-black/10 rounded-xl p-2.5 text-xs focus:border-primary outline-none text-black uppercase font-bold"
                    placeholder="e.g. XXXL, FREE"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="admin-btn-primary bg-[#573B2D] hover:bg-[#573B2D]/90 text-[#FEFFEF] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest h-fit cursor-pointer border-none shadow-sm transition-all"
                >
                  Add Size
                </button>
              </div>

              <div className="space-y-6">
                {enableColors ? (
                  colorsList.map((color) => (
                    <div key={color} className="space-y-3 p-4 bg-[#fcfbf7] rounded-xl border border-[#e7dcc6]/80">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#c8a45d]">{color}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {sizesList.map((size) => {
                          const variant = formData.variants?.find((v: any) => v.color === color && v.size === size);
                          const qty = variant ? variant.quantity : 0;
                          return (
                            <div key={size} className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-gray-700 block text-center">Size {size}</label>
                              <input 
                                type="number" 
                                value={qty}
                                onChange={(e) => updateVariantQty(color, size, Number(e.target.value))}
                                className="w-full bg-black/5 border border-black/10 rounded-lg p-2 text-center text-xs font-bold focus:border-primary outline-none text-black"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {sizesList.map((size) => {
                       const variant = formData.variants?.find((v: any) => v.color === 'Default' && v.size === size);
                       const qty = variant ? variant.quantity : 0;
                       return (
                         <div key={size} className="space-y-2 p-4 bg-[#fcfbf7] rounded-xl border border-[#e7dcc6]/80">
                            <label className="text-[10px] uppercase font-bold text-gray-700 block text-center">Size {size}</label>
                            <input 
                              type="number" 
                              value={qty}
                              onChange={(e) => updateSize(size, Number(e.target.value))}
                              className="w-full bg-black/5 border border-black/10 rounded-lg p-2 text-center text-xs font-bold focus:border-primary outline-none text-black"
                            />
                         </div>
                       );
                     })}
                  </div>
                )}
              </div>
            </section>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><DollarSign size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Pricing (INR)</h2>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-300">Base Price (INR)</label>
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-white"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-300">Sale Price (INR)</label>
                    <input 
                      type="number" 
                      value={formData.discountPrice}
                      onChange={(e) => setFormData({...formData, discountPrice: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-white text-white"
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-300">Total Stock (Auto-calculated)</label>
                    <input 
                      type="number" 
                      value={formData.countInStock}
                      onChange={(e) => setFormData({...formData, countInStock: Number(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-blue-400 font-bold"
                    />
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-2 tracking-wide">
                      This value is auto-updated based on your size inventory. You may override it manually if necessary.
                    </p>
                 </div>
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg"><Star size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Visibility & Flags</h2>
              </div>
              <div className="space-y-4">
                 <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                       <Star size={14} className={formData.isFeatured ? 'text-yellow-500' : 'text-gray-600'} />
                       <span className="text-[10px] font-bold uppercase text-gray-400">Featured Piece</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} />
                    <div className={`w-10 h-5 rounded-full transition-all relative ${formData.isFeatured ? 'bg-yellow-500' : 'bg-white/10'}`}>
                       <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isFeatured ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                 </label>

                 <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                       <Eye size={14} className={formData.isVisible ? 'text-green-500' : 'text-gray-600'} />
                       <span className="text-[10px] font-bold uppercase text-gray-400">Public Visibility</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.isVisible} onChange={(e) => setFormData({...formData, isVisible: e.target.checked, isPublished: e.target.checked})} />
                    <div className={`w-10 h-5 rounded-full transition-all relative ${formData.isVisible ? 'bg-green-500' : 'bg-white/10'}`}>
                       <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.isVisible ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                 </label>

                 <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className={formData.flashSale ? 'text-primary' : 'text-gray-600'} />
                       <span className="text-[10px] font-bold uppercase text-gray-400">Flash Sale Active</span>
                    </div>
                    <input type="checkbox" className="hidden" checked={formData.flashSale} onChange={(e) => setFormData({...formData, flashSale: e.target.checked})} />
                    <div className={`w-10 h-5 rounded-full transition-all relative ${formData.flashSale ? 'bg-primary' : 'bg-white/10'}`}>
                       <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.flashSale ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                 </label>
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg"><Calendar size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Schedule Drop</h2>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-300">Release Date/Time</label>
                <input 
                  type="date" 
                  value={formData.releaseDate}
                  onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-white"
                />
                <p className="text-[8px] text-gray-400 uppercase font-bold leading-relaxed mt-2">
                  System will automatically publish this piece at the specified date.
                </p>
              </div>
           </section>
        </div>
      </form>
    </div>
  );
}
