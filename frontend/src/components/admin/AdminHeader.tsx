'use client';

import { useStore } from '@/store/useStore';
import { Bell, Search, User } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { userInfo } = useStore();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="brand-heading text-3xl md:text-4xl uppercase mb-1.5 text-[#573B2D] font-bold">{title}</h1>
        {subtitle && (
          <p className="text-[#573B2D] text-[11px] uppercase tracking-[0.2em] font-bold">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#573B2D]" size={16} />
          <input 
            type="text" 
            placeholder="Search everything..." 
            className="bg-white border border-[#573B2D]/30 py-2.5 pl-10 pr-4 text-xs text-[#573B2D] placeholder-[#573B2D]/60 focus:outline-none focus:border-[#573B2D] transition-colors w-64 font-medium rounded-lg"
          />
        </div>

        <button className="p-2.5 bg-white border border-[#573B2D]/30 text-[#573B2D] hover:bg-[#573B2D]/10 transition-colors relative rounded-lg" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#573B2D] rounded-full border border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-[#573B2D]/30">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold uppercase text-[#573B2D] leading-tight">{userInfo?.name}</p>
            <p className="text-[10px] uppercase text-[#573B2D] font-extrabold tracking-widest">{userInfo?.role}</p>
          </div>
          <div className="w-10 h-10 border border-[#573B2D] bg-white rounded-lg flex items-center justify-center text-[#573B2D] font-bold overflow-hidden shadow-sm">
             <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
