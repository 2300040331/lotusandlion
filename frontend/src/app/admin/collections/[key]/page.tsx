'use client';

import { useEffect, useState, use } from 'react';
import { Crown, Flower2, Plus, Save, Upload } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import ImageUploader from '@/components/admin/ImageUploader';
import { formatINR } from '@/lib/currency';
import { useDropzone } from 'react-dropzone';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function CollectionControlPage({ params }: { params: Promise<{ key: string }> }) {
  const { key: rawKey } = use(params);
  const key = rawKey;
  const [collection, setCollection] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const Icon = key === 'lotus' ? Flower2 : key === 'lion' ? Crown : Crown;

  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const refreshProducts = () => {
    api.get(`/admin/collections/${key}`).then(({ data }) => {
      setProducts(data.products || []);
    }).catch(() => undefined);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setDroppedFiles(acceptedFiles);
      setIsBulkImportOpen(true);
    },
  });

  useEffect(() => {
    api.get(`/admin/collections/${key}`).then(({ data }) => {
      setCollection(data.collection);
      setProducts(data.products || []);
    }).catch((error: any) => {
      const message = error.response?.data?.message || error.message || 'Could not load collection';
      toast.error(message);
    });
  }, [key]);

  const update = (path: string, value: any) => {
    setCollection((current: any) => {
      const next = { ...current };
      const parts = path.split('.');
      let target = next;
      parts.slice(0, -1).forEach((part) => {
        target[part] = { ...(target[part] || {}) };
        target = target[part];
      });
      target[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    try {
      const { data } = await api.put(`/admin/collections/${key}`, collection);
      setCollection(data);
      toast.success(`${collection?.name || 'Collection'} saved`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Save failed');
    }
  };

  if (!collection) return <div className="py-24 text-center uppercase tracking-[0.18em] text-[#777]">Loading collection control...</div>;

  return (
    <div className="space-y-8 pb-24">
      <AdminHeader title={`${collection.name || collection.title || 'Collection'} Control`} subtitle="Independent categories, banners, drops, homepage blocks, and featured products." />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-[#c8a45d]/20 bg-[#111] p-6">
          <div className="mb-6 flex items-center gap-3 text-[#c8a45d]">
            <Icon size={22} />
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em]">Collection Hero</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={collection.hero?.eyebrow || ''} onChange={(e) => update('hero.eyebrow', e.target.value)} placeholder="Eyebrow" className="border p-3 text-sm outline-none" />
            <input value={collection.hero?.title || ''} onChange={(e) => update('hero.title', e.target.value)} placeholder="Title" className="border p-3 text-sm outline-none" />
            <input value={collection.hero?.subtitle || ''} onChange={(e) => update('hero.subtitle', e.target.value)} placeholder="Subtitle" className="border p-3 text-sm outline-none md:col-span-2" />
            <input value={collection.hero?.image || ''} onChange={(e) => update('hero.image', e.target.value)} placeholder="Hero image URL" className="border p-3 text-sm outline-none md:col-span-2" />
          </div>
          <ImageUploader
            multiple={false}
            folder={`lotus-lion/collections/${key}`}
            existingImages={collection.hero?.image ? [collection.hero.image] : []}
            onUpload={(urls) => update('hero.image', urls[0])}
          />
        </div>

        <div className="border border-white/10 bg-[#111] p-6">
          <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.2em] text-[#c8a45d]">Drop Schedule</h2>
          <div className="space-y-3">
            {(collection.dropSchedules || []).map((drop: any, index: number) => (
              <div key={drop.id || index} className="grid gap-3 border border-white/10 bg-white/5 p-4">
                <input value={drop.title || ''} onChange={(e) => {
                  const next = [...(collection.dropSchedules || [])];
                  next[index] = { ...drop, title: e.target.value };
                  setCollection({ ...collection, dropSchedules: next });
                }} placeholder="Drop title" className="border p-3 text-sm outline-none" />
                <input type="datetime-local" value={drop.launchAt?.slice?.(0, 16) || ''} onChange={(e) => {
                  const next = [...(collection.dropSchedules || [])];
                  next[index] = { ...drop, launchAt: e.target.value, status: 'scheduled' };
                  setCollection({ ...collection, dropSchedules: next });
                }} className="border p-3 text-sm outline-none" />
              </div>
            ))}
            <button onClick={() => setCollection({ ...collection, dropSchedules: [...(collection.dropSchedules || []), { title: '', status: 'scheduled', countdownEnabled: true }] })} className="inline-flex items-center gap-2 border border-[#c8a45d]/40 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-[#c8a45d]">
              <Plus size={14} /> Add Drop
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-white/10 bg-[#111] p-6">
          <h2 className="mb-5 text-[12px] font-bold uppercase tracking-[0.2em] text-[#c8a45d]">Categories</h2>
          <div className="space-y-3">
            {(collection.categories || []).map((category: any, index: number) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input value={category.name || ''} onChange={(e) => {
                  const next = [...collection.categories];
                  next[index] = { ...category, name: e.target.value };
                  setCollection({ ...collection, categories: next });
                }} placeholder="Category" className="border p-3 text-sm outline-none" />
                <input value={category.slug || ''} onChange={(e) => {
                  const next = [...collection.categories];
                  next[index] = { ...category, slug: e.target.value };
                  setCollection({ ...collection, categories: next });
                }} placeholder="slug" className="border p-3 text-sm outline-none" />
              </div>
            ))}
            <button onClick={() => setCollection({ ...collection, categories: [...(collection.categories || []), { name: '', slug: '', isVisible: true }] })} className="text-[10px] uppercase tracking-[0.18em] text-[#c8a45d]">Add category</button>
          </div>
        </div>

        <div className="border border-white/10 bg-[#111] p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#c8a45d]">Products In This Collection</h2>
              <button 
                onClick={() => {
                  setDroppedFiles([]);
                  setIsBulkImportOpen(true);
                }}
                className="text-[10px] font-bold uppercase tracking-[0.18em] border border-[#c8a45d]/40 text-[#c8a45d] px-3 py-1.5 hover:bg-[#c8a45d]/10 transition-all cursor-pointer flex items-center gap-1.5 animate-none"
              >
                <Upload size={12} /> Add Products
              </button>
            </div>
            <div className="max-h-[260px] space-y-3 overflow-y-auto pr-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="text-sm text-white">{product.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#777]">{product.category} / stock {product.countInStock} / {formatINR(product.discountPrice || product.price)}</p>
                  </div>
                  <span className={product.isVisible ? 'text-[#c8a45d]' : 'text-[#777]'}>{product.isVisible ? 'Visible' : 'Hidden'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={`mt-4 border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragActive ? 'border-[#c8a45d] bg-[#c8a45d]/5' : 'border-white/10 hover:border-[#c8a45d]/30 bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload size={16} className="text-[#c8a45d]" />
            <span className="text-[9px] uppercase font-bold tracking-wider text-white">
              {isDragActive ? 'Drop here to add products' : 'Drag & drop images/csv here'}
            </span>
            <span className="text-[7px] uppercase tracking-wider text-gray-500">
              to import products directly to this collection
            </span>
          </div>
        </div>
      </section>

      <button onClick={save} className="fixed bottom-8 right-8 inline-flex items-center gap-2 bg-[#c8a45d] px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-black shadow-2xl">
        <Save size={16} /> Save Collection
      </button>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => {
          setIsBulkImportOpen(false);
          setDroppedFiles([]);
        }}
        onSuccess={refreshProducts}
        lockCollection={key}
        initialFiles={droppedFiles}
      />
    </div>
  );
}
