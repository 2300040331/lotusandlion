'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import DataTable from '@/components/admin/DataTable';
import { Search, User as UserIcon, Shield, Ban, Trash2, CheckCircle, Mail } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useStore } from '@/store/useStore';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const { data, loading, refresh } = useUsers(`?search=${search}&role=${role}`);
  const { userInfo } = useStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${id}`, { isBlocked: !currentStatus });
      toast.success(currentStatus ? 'User unblocked' : 'User blocked');
      refresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const changeRole = async (id: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${id}`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      refresh();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) return;
    try {
      await api.delete(`/admin/users/${isDeleting}`);
      toast.success('User removed');
      refresh();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    {
      header: 'User',
      accessor: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary font-bold border border-white/5">
             {item.name.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-white">{item.name}</p>
            <p className="text-[8px] text-gray-500">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
           <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
             item.role === 'super-admin' ? 'bg-purple-500/10 text-purple-500' : 
             item.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-white/10 text-gray-400'
           }`}>
             {item.role}
           </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (item: any) => (
        <div className="flex items-center gap-2">
          {item.isBlocked ? (
            <div className="flex items-center gap-1 text-red-500 text-[8px] font-bold uppercase tracking-widest">
              <Ban size={10} /> Blocked
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-500 text-[8px] font-bold uppercase tracking-widest">
              <CheckCircle size={10} /> Active
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Last Login',
      accessor: (item: any) => (
        <p className="text-[8px] text-gray-500 font-bold uppercase">
          {item.lastLogin ? new Date(item.lastLogin).toLocaleString() : 'Never'}
        </p>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          {userInfo?.role === 'super-admin' && (
             <>
                <button 
                  onClick={() => toggleBlockStatus(item.id, item.isBlocked)}
                  className={`p-2 rounded-lg transition-colors ${item.isBlocked ? 'text-green-500 hover:bg-green-500/5' : 'text-red-500 hover:bg-red-500/5'}`}
                  title={item.isBlocked ? 'Unblock' : 'Block'}
                >
                  <Ban size={14} />
                </button>
                <div className="relative group">
                  <button className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                    <Shield size={14} />
                  </button>
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-white border border-[#573B2D]/20 rounded-lg p-1 z-50 shadow-2xl">
                    <button onClick={() => changeRole(item.id, 'user')} className="block w-full text-left px-3 py-2 text-[8px] uppercase font-bold text-[#573B2D]/70 hover:text-[#573B2D] hover:bg-[#573B2D]/10 rounded">User</button>
                    <button onClick={() => changeRole(item.id, 'admin')} className="block w-full text-left px-3 py-2 text-[8px] uppercase font-bold text-[#573B2D] hover:bg-[#573B2D]/10 rounded">Admin</button>
                    <button onClick={() => changeRole(item.id, 'super-admin')} className="block w-full text-left px-3 py-2 text-[8px] uppercase font-bold text-purple-700 hover:bg-purple-500/10 rounded">Super Admin</button>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDeleting(item.id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                  disabled={userInfo?.id === item.id}
                >
                  <Trash2 size={14} />
                </button>
             </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <AdminHeader title="Citizen Registry" subtitle="Manage account permissions and roles." />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <select 
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="bg-[#111] border border-white/5 rounded-xl py-3 px-6 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-primary/50 appearance-none text-gray-400"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
          <option value="super-admin">Super Admins</option>
        </select>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.users || []} 
        loading={loading} 
        emptyMessage="No users found in the registry."
      />

      <ConfirmDialog 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Exile User?"
        message="Are you sure you want to permanently delete this user account? This cannot be undone."
      />
    </div>
  );
}
