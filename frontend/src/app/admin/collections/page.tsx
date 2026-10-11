'use client';

import { useEffect, useState } from 'react';
import { FolderTree, Plus, Edit2, Trash2, Save, Upload } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Link from 'next/link';
import BulkImportCollectionsModal from '@/components/admin/BulkImportCollectionsModal';

export default function CollectionsManagerPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '', slug: '', gender: 'women' });
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkCollectionsOpen, setIsBulkCollectionsOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<any>(null);

  const loadCollections = async () => {
    try {
      const { data } = await api.get('/admin/collections');
      setCollections(data || []);
    } catch (error) {
      toast.error('Could not load collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollection.name) return toast.error('Name is required');
    
    setIsSaving(true);
    try {
      const payload = {
        name: newCollection.name,
        slug: newCollection.slug,
        hero: { gender: newCollection.gender }
      };
      await api.post('/admin/collections', payload);
      toast.success('Collection created');
      setIsModalOpen(false);
      setNewCollection({ name: '', slug: '', gender: 'women' });
      loadCollections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create collection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    try {
      await api.delete(`/admin/collections/${collectionToDelete.id}`);
      toast.success('Collection deleted');
      setCollections(collections.filter(c => c.id !== collectionToDelete.id));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete collection');
    } finally {
      setCollectionToDelete(null);
    }
  };

  if (loading) return <div className="py-24 text-center uppercase tracking-[0.18em] text-[#777]">Loading collections...</div>;

  return (
    <div className="space-y-8 pb-24">
      <AdminHeader 
        title="Collections Manager" 
        subtitle="Create and manage distinct collections for your store." 
      />

      <div className="flex justify-between items-center bg-white border border-[#573B2D]/20 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <FolderTree size={20} className="text-[#573B2D]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#573B2D]">Collections Manager</h2>
        </div>
        <div className="flex gap-3 h-fit">
          <button 
            onClick={() => setIsBulkCollectionsOpen(true)}
            className="border border-[#573B2D] text-[#573B2D] hover:bg-[#573B2D]/10 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.18em] flex items-center gap-2 transition-colors rounded-xl cursor-pointer"
          >
            <Upload size={14} /> Bulk Import
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-6 py-3 text-[10px] font-bold uppercase tracking-[0.18em] flex items-center gap-2 hover:bg-[#573B2D]/90 transition-colors rounded-xl shadow-sm"
          >
            <Plus size={14} /> Add Collection
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {[{
          title: "Women's Collections",
          items: collections.filter(c => c.hero?.gender === 'women' || c.slug === 'lotus')
        }, {
          title: "Men's Collections",
          items: collections.filter(c => c.hero?.gender === 'men' || c.slug === 'lion')
        }, {
          title: "Other Collections",
          items: collections.filter(c => c.hero?.gender !== 'women' && c.hero?.gender !== 'men' && c.slug !== 'lotus' && c.slug !== 'lion')
        }].map((group, idx) => group.items.length > 0 && (
          <div key={idx} className="space-y-4">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#573B2D] pb-2 border-b border-[#573B2D]/20">{group.title}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map(collection => (
                <div key={collection.id} className="border border-[#573B2D]/20 bg-white p-6 rounded-2xl hover:border-[#573B2D] transition-all group relative shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#573B2D] mb-1">{collection.name || collection.title}</h3>
                      <p className="text-[11px] text-[#573B2D]/80 font-mono font-medium">/{collection.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCollectionToDelete(collection)}
                        className="p-2 text-[#573B2D]/60 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-[#573B2D]/15 flex justify-between items-center">
                    <span className="text-[11px] text-[#573B2D] uppercase tracking-widest font-bold">
                      {collection.categories?.length || 0} Categories
                    </span>
                    <Link 
                      href={`/admin/collections/${collection.slug}`}
                      className="text-[#573B2D] hover:underline transition-colors text-[11px] font-bold uppercase tracking-[0.1em] flex items-center gap-1"
                    >
                      Manage <Edit2 size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Collection"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500">Collection Name</label>
            <input 
              type="text" 
              value={newCollection.name}
              onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
              placeholder="e.g. Women's Summer Edit"
              className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm focus:border-[#c8a45d] outline-none text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500">Slug (Optional)</label>
            <input 
              type="text" 
              value={newCollection.slug}
              onChange={(e) => setNewCollection({...newCollection, slug: e.target.value})}
              placeholder="e.g. womens-summer (auto-generated if left blank)"
              className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm focus:border-[#c8a45d] outline-none text-white font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-gray-500">Target Gender</label>
            <select 
              value={newCollection.gender}
              onChange={(e) => setNewCollection({...newCollection, gender: e.target.value})}
              className="w-full bg-[#111] border border-white/10 rounded-xl p-3 text-sm focus:border-[#c8a45d] outline-none text-white"
            >
              <option value="women">Women</option>
              <option value="men">Men</option>
              <option value="unisex">Unisex / Other</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-[#c8a45d] text-black px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#b08e4d] transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!collectionToDelete}
        onClose={() => setCollectionToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${collectionToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete Collection"
      />

      <BulkImportCollectionsModal
        isOpen={isBulkCollectionsOpen}
        onClose={() => setIsBulkCollectionsOpen(false)}
        onSuccess={loadCollections}
      />
    </div>
  );
}
