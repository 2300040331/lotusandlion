'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Layout,
  Menu as MenuIcon,
  Crown,
  Flower2,
  PenLine,
  Layers3,
  Megaphone,
  FolderTree
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Control Center', href: '/admin/control-center', icon: Monitor },
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Homepage Builder', href: '/admin/homepage', icon: Layers3 },
  { name: 'Collections Manager', href: '/admin/collections', icon: FolderTree },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Blog Studio', href: '/admin/blogs', icon: PenLine },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'CMS Control', href: '/admin/cms', icon: Layout },
  { name: 'Announcements', href: '/admin/homepage#announcements', icon: Megaphone },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
];

const persistedStore = useStore as typeof useStore & {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (callback: () => void) => () => void;
  };
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userInfo, setUserInfo } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(persistedStore.persist.hasHydrated());
    return persistedStore.persist.onFinishHydration(() => setHasHydrated(true));
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'super-admin' && !userInfo.isAdmin)) {
      toast.error('Unauthorized access');
      router.push('/login?redirect=/admin/control-center');
    }
  }, [hasHydrated, userInfo, router]);

  const logoutHandler = async () => {
    try {
      await api.post('/auth/logout');
      setUserInfo(null);
      localStorage.removeItem('lotus-lion-storage');
      router.push('/login?redirect=/admin/control-center');
      toast.success('Logged out');
    } catch (error) {
      setUserInfo(null);
      router.push('/login?redirect=/admin/control-center');
    }
  };

  if (!hasHydrated || !userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'super-admin' && !userInfo.isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FEFFEF] text-[10px] font-bold uppercase tracking-[0.3em] text-[#573B2D]">
        Opening admin sign in...
      </div>
    );
  }

  return (
    <div className="admin-panel flex min-h-screen bg-[#FEFFEF] text-[#573B2D] selection:bg-[#573B2D] selection:text-[#FEFFEF]">
      {/* Sidebar */}
      <aside 
        className={`bg-[#FEFFEF] border-r border-[#573B2D]/15 transition-all duration-500 flex flex-col sticky top-0 h-screen z-50 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-[#573B2D]/15">
          {!isSidebarCollapsed && (
            <Link href="/" className="group flex items-center gap-2">
               <div className="w-8 h-8 border border-[#573B2D] flex items-center justify-center text-[#573B2D] font-bold">L</div>
               <span className="brand-heading text-[#573B2D] tracking-[0.18em] uppercase text-[12px]">Lotus & Lion</span>
            </Link>
          )}
          {isSidebarCollapsed && (
            <div className="w-8 h-8 border border-[#573B2D] flex items-center justify-center text-[#573B2D] font-bold mx-auto">L</div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-[#573B2D]/10 transition-colors ml-2 text-[#573B2D]"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {!isSidebarCollapsed && (
            <p className="px-4 text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#573B2D] mb-4">Website Control</p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-[#573B2D] text-[#FEFFEF] font-bold shadow-sm' 
                    : 'text-[#573B2D] font-bold hover:bg-[#573B2D]/10'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-[#FEFFEF]' : 'text-[#573B2D]'} />
                {!isSidebarCollapsed && (
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{item.name}</span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-[#FEFFEF]" 
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#573B2D]/20 space-y-2">
          {!isSidebarCollapsed && (
             <div className="px-4 py-3 bg-white flex items-center gap-3 mb-4 border border-[#573B2D]/20 shadow-sm">
                <div className="w-8 h-8 border border-[#573B2D] flex items-center justify-center text-[#573B2D] text-xs font-bold uppercase">
                   {userInfo.name.charAt(0)}
                </div>
                <div className="flex-grow overflow-hidden">
                   <p className="text-[11px] font-bold uppercase text-[#573B2D] truncate">{userInfo.name}</p>
                   <span className="text-[9px] font-bold uppercase text-[#573B2D] tracking-widest">{userInfo.role}</span>
                </div>
             </div>
          )}
          <button 
            onClick={logoutHandler}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-[#573B2D] font-bold hover:bg-[#573B2D]/10 transition-all group"
          >
            <LogOut size={20} className="text-[#573B2D] group-hover:translate-x-1 transition-transform" />
            {!isSidebarCollapsed && (
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow min-h-screen">
        <div className="p-8 md:p-12 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
