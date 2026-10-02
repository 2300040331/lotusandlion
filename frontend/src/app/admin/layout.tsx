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
      <div className="flex min-h-screen items-center justify-center bg-[#fcfbf7] text-[10px] font-bold uppercase tracking-[0.3em] text-[#4f4b43]">
        Opening admin sign in...
      </div>
    );
  }

  return (
    <div className="admin-panel flex min-h-screen bg-[#fcfbf7] text-[#1c1c1c] selection:bg-[#c8a45d] selection:text-black">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-[#e7dcc6] transition-all duration-500 flex flex-col sticky top-0 h-screen z-50 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-[#e7dcc6]">
          {!isSidebarCollapsed && (
            <Link href="/" className="group flex items-center gap-2">
               <div className="w-8 h-8 border border-[#c8a45d] flex items-center justify-center text-[#c8a45d] font-bold">L</div>
               <span className="brand-heading text-[#1c1c1c] tracking-[0.18em] uppercase text-[12px]">Lotus & Lion</span>
            </Link>
          )}
          {isSidebarCollapsed && (
            <div className="w-8 h-8 border border-[#c8a45d] flex items-center justify-center text-[#c8a45d] font-bold mx-auto">L</div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 hover:bg-[#f7f1e6] transition-colors ml-2 text-[#c8a45d]"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-grow py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {!isSidebarCollapsed && (
            <p className="px-4 text-[8px] font-bold uppercase tracking-[0.3em] text-[#c8a45d] mb-4">Website Control</p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-[#c8a45d] text-black' 
                    : 'text-[#4f4b43] hover:bg-[#f7f1e6] hover:text-[#1c1c1c]'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-black' : 'group-hover:text-[#c8a45d] transition-colors'} />
                {!isSidebarCollapsed && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.name}</span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-white" 
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#e7dcc6] space-y-2">
          {!isSidebarCollapsed && (
             <div className="px-4 py-3 bg-[#fcf8ef] flex items-center gap-3 mb-4 border border-[#e7dcc6]">
                <div className="w-8 h-8 border border-[#c8a45d] flex items-center justify-center text-[#c8a45d] text-xs font-bold uppercase">
                   {userInfo.name.charAt(0)}
                </div>
                <div className="flex-grow overflow-hidden">
                   <p className="text-[10px] font-bold uppercase text-[#1c1c1c] truncate">{userInfo.name}</p>
                   <span className="text-[8px] font-bold uppercase text-[#c8a45d] tracking-widest">{userInfo.role}</span>
                </div>
             </div>
          )}
          <button 
            onClick={logoutHandler}
            className="w-full flex items-center gap-4 px-4 py-3.5 text-[#df0029] hover:bg-[#df0029]/10 transition-all group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Logout</span>
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
