'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Crown, Flower2, Layers3, Megaphone, Settings, ShoppingBag, Users } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';

const modules = [
  { title: 'Homepage Builder', href: '/admin/homepage', icon: Layers3, body: 'Create, order, enable, and disable visible homepage sections.' },
  { title: 'Lotus Collection', href: '/admin/collections/lotus', icon: Flower2, body: 'Manage Lotus products, banners, categories, drops, and collection hero.' },
  { title: 'Lion Collection', href: '/admin/collections/lion', icon: Crown, body: 'Manage Lion products, banners, categories, drops, and collection hero.' },
  { title: 'Product Control', href: '/admin/products', icon: ShoppingBag, body: 'Edit pricing, media, SEO, stock, visibility, flags, and drop dates.' },
  { title: 'Website Settings', href: '/admin/settings', icon: Settings, body: 'Brand settings, integrations, Stripe, and website preferences.' },
];

export default function ControlCenterPage() {
  const { data } = useAdminData('/admin/control-center');

  const stats = [
    { label: 'Products synced', value: data?.products?.length || 0 },
    { label: 'CMS sections', value: data?.sections?.length || 0 },
    { label: 'Static pages', value: data?.pages?.length || 0 },
  ];

  return (
    <div className="space-y-10 pb-24">
      <AdminHeader title="Super Admin Control Center" subtitle="One place to control the complete Lotus & Lion storefront." />

      <section className="border border-[#c8a45d]/25 bg-[#111] p-8">
        <div className="grid gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-white/10 bg-white/5 p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#c8a45d]">{stat.label}</p>
              <p className="mt-3 text-4xl font-light text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((item, index) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Link href={item.href} className="group block h-full border border-[#c8a45d]/20 bg-[#111] p-6 transition hover:border-[#c8a45d] hover:bg-[#141414]">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-11 w-11 place-items-center border border-[#c8a45d]/40 text-[#c8a45d]">
                  <item.icon size={20} />
                </div>
                <ArrowUpRight className="text-[#c8a45d] opacity-60 transition group-hover:translate-x-1 group-hover:-translate-y-1" size={18} />
              </div>
              <h2 className="brand-heading mt-8 text-2xl uppercase text-white">{item.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#b9b9b9]">{item.body}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="border border-white/10 bg-[#111] p-6">
          <div className="mb-5 flex items-center gap-3 text-[#c8a45d]">
            <Megaphone size={18} />
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em]">Live Announcements</h2>
          </div>
          <div className="space-y-3">
            {(data?.announcements || []).map((item: any) => (
              <div key={item.id} className="border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white">{item.message}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[#777]">{item.placement}</p>
              </div>
            ))}
            {!data?.announcements?.length && <p className="text-sm text-[#777]">No announcement bars yet.</p>}
          </div>
        </div>
        <div className="border border-white/10 bg-[#111] p-6">
          <div className="mb-5 flex items-center gap-3 text-[#c8a45d]">
            <Users size={18} />
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em]">Detected Frontend Modules</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data?.modules || []).map((item: string) => (
              <span key={item} className="border border-[#c8a45d]/25 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-[#d8d8d8]">{item}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
