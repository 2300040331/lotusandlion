'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Crown, Flower2, Heart, LogOut, Menu, Search, Shield, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const navLinks = [
  { label: 'WOMEN', href: '/collections/lotus' },
  { label: 'MEN', href: '/collections/lion' },
  { label: 'THE SUMMER EDIT', href: '/collections/summer' },
  { label: 'SALE / BEST SELLER', href: '/collections/sale' },
  { label: 'ABOUT', href: '/about' },
];

const Navbar = () => {
  const { userInfo, setUserInfo, cartItems } = useStore();
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const [isOpen, setIsOpen] = useState(false);
  const [navItems, setNavItems] = useState<any[]>(navLinks);
  const [announcement, setAnnouncement] = useState<any>(null);

  useEffect(() => {
    // Start with default navLinks
    setNavItems(navLinks);
    
    api.get('/cms/site').then(({ data }) => {
      const topBar = data.announcements?.find?.((item: any) => item.placement === 'top-bar') || data.announcements?.[0];
      setAnnouncement(topBar || null);

      if (data.collections?.length) {
        const womenSlugs = ['lotus', 'women', 'womens'];
        const menSlugs = ['lion', 'men', 'mens'];
        
        const womenColl = data.collections.find((c: any) => 
          womenSlugs.includes(c.slug?.toLowerCase()) || c.hero?.gender === 'women'
        );
        const menColl = data.collections.find((c: any) => 
          menSlugs.includes(c.slug?.toLowerCase()) || c.hero?.gender === 'men'
        );
        
        const updatedLinks = navLinks.map(link => {
          if (link.label === 'WOMEN' && womenColl) {
            return { ...link, href: `/collections/${womenColl.slug}` };
          }
          if (link.label === 'MEN' && menColl) {
            return { ...link, href: `/collections/${menColl.slug}` };
          }
          return link;
        });
        setNavItems(updatedLinks);
      }
    }).catch(() => undefined);
  }, []);

  const logoutHandler = async () => {
    try {
      await api.post('/auth/logout');
      toast.success('Signed out');
    } catch {
      toast.success('Signed out');
    } finally {
      setUserInfo(null);
      localStorage.removeItem('lotus-lion-storage');
    }
  };

  const cartCount = safeCartItems.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  const isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'super-admin' || userInfo?.isAdmin;

  return (
    <header className="sticky top-0 z-50 bg-[#FEFFEF] text-[#573B2D]">
      {announcement?.message && (
        <div className="bg-[#573B2D] px-4 py-2 text-center text-[11px] uppercase tracking-[0.18em] text-[#FEFFEF]">
          {announcement.linkHref ? <Link href={announcement.linkHref} className="hover:text-[#FEFFEF]/80 transition-colors">{announcement.message}</Link> : announcement.message}
        </div>
      )}
      <div className="border-b border-[#573B2D]/15">
        <div className="mx-auto max-w-[1440px] px-3 sm:px-8">
          <div className="flex h-20 items-center justify-between md:h-20 relative">
            {/* Left Section: Desktop Logo & Mobile Menu */}
            <div className="flex flex-1 items-center justify-start pr-4">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] md:hidden text-[#573B2D]"
                aria-label="Open menu"
              >
                <Menu size={31} strokeWidth={1.8} /> <span className="hidden">Menu</span>
              </button>

              <Link href="/" className="hidden md:flex items-center">
                <Image
                  src="/lotus-and-lion-wordmark.png"
                  alt="Lotus & Lion"
                  width={180}
                  height={17}
                  priority
                  className="h-4 sm:h-4.5 md:h-[19px] w-auto max-w-[160px] md:max-w-[175px] object-contain"
                />
              </Link>
            </div>

            {/* Center Logo for Mobile */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
              <Link href="/" className="flex items-center">
                <Image
                  src="/lotus-and-lion-wordmark.png"
                  alt="Lotus & Lion"
                  width={150}
                  height={14}
                  priority
                  className="h-4 sm:h-[18px] w-auto max-w-[140px] object-contain"
                />
              </Link>
            </div>

            {/* Center Section: Navigation Options (Desktop only) */}
            <nav className="hidden items-center justify-center gap-5 md:flex lg:gap-8 px-2">
              {navItems.map((item) => (
                <Link 
                  key={`primary-${item.label}`} 
                  href={item.href} 
                  className="text-[11px] lg:text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-70 whitespace-nowrap transition-opacity"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Section: Icons */}
            <div className="flex flex-1 items-center justify-end gap-3 sm:gap-5 text-[#573B2D]">
              <Link href="/products" aria-label="Search" className="hover:opacity-75 transition-opacity">
                <Search size={28} strokeWidth={1.8} className="md:h-[19px] md:w-[19px]" />
              </Link>
              <Link href="/wishlist" aria-label="Wishlist" className="hidden sm:block hover:opacity-75 transition-opacity">
                <Heart size={19} />
              </Link>
              {userInfo ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" aria-label="Admin portal" className="hidden md:block hover:opacity-75 transition-opacity">
                      <Shield size={19} />
                    </Link>
                  )}
                  <Link href={isAdmin ? "/admin" : "/"} aria-label="Account" className="hidden md:block hover:opacity-75 transition-opacity">
                    <User size={19} className={isAdmin ? "text-primary" : ""} />
                  </Link>
                  <button onClick={logoutHandler} aria-label="Logout" className="hidden sm:block hover:opacity-75 transition-opacity">
                    <LogOut size={19} />
                  </button>
                </>
              ) : (
                <Link href="/login" aria-label="Account" className="hidden md:block hover:opacity-75 transition-opacity">
                  <User size={19} />
                </Link>
              )}
              <Link href="/cart" className="relative hover:opacity-75 transition-opacity" aria-label="Cart">
                <ShoppingBag size={28} strokeWidth={1.8} className="md:h-5 md:w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center bg-[#573B2D] px-1 text-[9px] font-bold text-[#FEFFEF]">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[80] bg-[#FEFFEF] text-[#573B2D] md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-[#573B2D]/15 px-5">
            <Image
              src="/lotus-and-lion-wordmark.png"
              alt="Lotus & Lion"
              width={160}
              height={15}
              className="h-4 sm:h-4.5 w-auto max-w-[150px] object-contain"
            />
            <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="text-[#573B2D]">
              <X size={22} />
            </button>
          </div>
          <div className="divide-y divide-[#573B2D]/15">
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-${item.label}-${idx}`}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block px-5 py-5 text-sm uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75 transition-opacity"
              >
                {item.label === 'Heritage' && <Flower2 size={14} className="inline -mt-0.5 mr-2" />}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
