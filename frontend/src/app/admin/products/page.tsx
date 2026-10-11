'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import { Plus, Search, Edit2, Trash2, Star, Eye, EyeOff, Filter, Upload } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import Link from 'next/link';
import { formatINR } from '@/lib/currency';
import BulkImportModal from '@/components/admin/BulkImportModal';

export default function AdminProducts() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { data, loading, refresh } = useProducts(`?search=${search}&category=${category}`);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleDelete = async () => {
    if (!isDeleting) return;
    try {
      await api.delete(`/admin/products/${isDeleting}`);
      toast.success('Product deleted');
      refresh();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      await api.patch(`/admin/products/${id}/featured`);
      refresh();
      toast.success('Featured status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleVisibility = async (id: string) => {
    try {
      await api.patch(`/admin/products/${id}/visibility`);
      refresh();
      toast.success('Visibility updated');
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: (item: any) => (
        <div className="flex items-center gap-4">
          <img src={item.image} className="w-10 h-16 object-contain rounded bg-white/5" alt="" />
          <div>
            <p className="text-[10px] font-bold uppercase text-white truncate w-40">{item.name}</p>
            <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">{item.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (item: any) => (
        <div>
          <p className="text-xs font-bold text-primary">{formatINR(item.price)}</p>
          {item.discountPrice > 0 && (
            <p className="text-[8px] text-gray-500 line-through">{formatINR(item.discountPrice)}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Inventory',
      accessor: (item: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.countInStock < 10 ? 'bg-red-500' : 'bg-green-500'}`} />
            <span className={`text-[10px] font-bold ${item.countInStock < 10 ? 'text-red-500' : 'text-gray-400'}`}>
              {item.countInStock} In Stock
            </span>
          </div>
          <div className="flex gap-1">
             {Object.keys(item.sizes || {}).map(s => (
               <span key={s} className="text-[7px] px-1 bg-white/5 text-gray-500 border border-white/5 rounded">
                 {s}:{item.sizes[s]}
               </span>
             ))}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div className="flex items-center gap-3">
          <button 
            onClick={() => toggleFeatured(item.id)}
            className={`p-1.5 rounded-lg transition-colors ${item.isFeatured ? 'bg-yellow-500/10 text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
            title="Toggle Featured"
          >
            <Star size={14} fill={item.isFeatured ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={() => toggleVisibility(item.id)}
            className={`p-1.5 rounded-lg transition-colors ${item.isVisible ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}
            title="Toggle Visibility"
          >
            {item.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          <Link 
            href={`/admin/products/${item.id}`}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Edit2 size={14} />
          </Link>
          <button 
            onClick={() => setIsDeleting(item.id)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <AdminHeader title="Inventory" subtitle="Manage your luxury product catalog." />

      {/* Toolbar & Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-grow w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#573B2D]" size={16} />
            <input 
              type="text" 
              placeholder="Search products by name or category..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#573B2D]/25 rounded-xl py-3 pl-12 pr-4 text-xs text-[#573B2D] placeholder-[#573B2D]/60 focus:outline-none focus:border-[#573B2D] shadow-sm font-medium"
            />
          </div>
          <div className="relative shrink-0">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#573B2D]" size={14} />
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white border border-[#573B2D]/25 rounded-xl py-3 pl-10 pr-10 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-[#573B2D] appearance-none text-[#573B2D] shadow-sm cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="Essentials">Essentials</option>
              <option value="T-Shirts">T-Shirts</option>
              <option value="Hoodies">Hoodies</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 h-fit shrink-0 w-full md:w-auto justify-end">
          <button 
            onClick={() => setIsBulkImportOpen(true)}
            className="border border-[#573B2D] text-[#573B2D] bg-white hover:bg-[#573B2D]/10 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Upload size={16} />
            Bulk Import
          </button>
          <Link 
            href="/admin/products/new"
            className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#573B2D]/90 transition-all h-fit shadow-sm"
          >
            <Plus size={16} />
            New Product
          </Link>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.products || []} 
        loading={loading} 
        emptyMessage="No products found in the vault."
      />

      <ConfirmDialog 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Burn from Vault?"
        message="Are you sure you want to delete this product? This action is permanent and cannot be undone."
      />

      <BulkImportModal 
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
