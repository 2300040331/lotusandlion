'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ComingSoon from '@/components/ComingSoon';
import { SITE_MODE } from '@/config/siteMode';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/forgot-password');

  // Admin routes remain completely accessible and untouched
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // When SITE_MODE is COMING_SOON, show the Coming Soon experience to public visitors
  if (SITE_MODE === 'COMING_SOON') {
    // Retain auth route for admin login if needed, without public storefront chrome
    if (isAuthRoute) {
      return (
        <main className="min-h-screen bg-[#FEFFEF] flex items-center justify-center p-4">
          {children}
        </main>
      );
    }

    // All public pages (homepage, collections, products, cart, etc.) render Coming Soon
    return <ComingSoon />;
  }

  // When SITE_MODE is LIVE, render the complete original storefront exactly as before
  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
