'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const footerGroups = [
  {
    heading: 'COMPANY',
    links: [
      { label: 'Our story', href: '/about' },
      { label: 'Contact US', href: '/contact' },
      { label: 'Bulk Orders', href: '/bulk-orders' }
    ]
  },
  {
    heading: 'SUPPORT',
    links: [
      { label: 'Return Cancel & Refund policy', href: '/refund-policy' },
      { label: 'Track your order', href: '/track-order' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
      { label: 'Terms of Service', href: '/terms' }
    ]
  },
];

const Footer = () => {
  const [email, setEmail] = useState('');
  const [cmsFooter, setCmsFooter] = useState<any[] | null>(null);
  const [theme, setTheme] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.get('/cms/site').then(({ data }) => {
      if (Array.isArray(data.footer) && data.footer.length) setCmsFooter(data.footer);
      if (data.theme) setTheme(data.theme);
      if (data.settings) setSettings(data.settings);
    }).catch(() => undefined);
  }, []);

  const handleNewsletter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast.error('Enter an email address');
      return;
    }
    toast.success('Newsletter signup saved');
    setEmail('');
  };

  return (
    <footer className="bg-[#FEFFEF] text-[#573B2D] border-t border-[#573B2D]/20">
      <div className="border-b border-[#573B2D]/15 px-4 py-10 sm:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Link href="/" className="inline-block mb-3">
              <Image
                src="/lotus-and-lion-wordmark.png"
                alt="Lotus & Lion"
                width={220}
                height={21}
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 max-w-lg text-sm leading-7 text-[#573B2D]/80">
              Premium everyday and occasion wear crafted with clean silhouettes, reliable fabrics, and timeless color.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="md:justify-self-end">
            <label className="block text-[12px] uppercase tracking-[0.18em] text-[#573B2D]">Newsletter</label>
            <div className="mt-4 flex min-w-[300px] border-b border-[#573B2D]/30">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail"
                className="w-full bg-transparent py-3 text-sm outline-none text-[#573B2D] placeholder-[#573B2D]/50"
              />
              <button className="px-3 text-[12px] uppercase tracking-[0.18em] text-[#573B2D] hover:opacity-75 transition-opacity">Subscribe</button>
            </div>
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-3">
        {footerGroups.map((group: any) => (
          <div key={group.heading || group.title}>
            <h4 className="mb-5 text-[13px] uppercase tracking-[0.18em] text-[#573B2D] font-bold">{group.heading || group.title}</h4>
            <ul className="space-y-3">
              {(Array.isArray(group.links) ? group.links : []).map((link: any) => (
                <li key={link.label || link}>
                  <Link href={link.href || '/products'} className="text-sm text-[#573B2D]/75 hover:text-[#573B2D] transition-colors">
                    {link.label || link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#573B2D]/15 px-4 py-5 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-3 text-[12px] text-[#573B2D]/70 md:flex-row md:items-center">
          <p>© 2026 - LOTUS & LION - Original Atelier Storefront</p>
          <div className="flex gap-5">
            <Link href={settings?.instagram_url || "https://instagram.com"} target="_blank" className="hover:text-[#573B2D] transition-colors">Instagram</Link>
            <Link href={settings?.twitter_url || "https://twitter.com"} target="_blank" className="hover:text-[#573B2D] transition-colors">Twitter</Link>
            <Link href={settings?.pinterest_url || "https://pinterest.com"} target="_blank" className="hover:text-[#573B2D] transition-colors">Pinterest</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
