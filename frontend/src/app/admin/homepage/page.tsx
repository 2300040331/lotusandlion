'use client';

import { useEffect, useState } from 'react';
import { GripVertical, Megaphone, Plus, Save, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';

const emptySection = {
  type: 'banner',
  title: '',
  eyebrow: '',
  subtitle: '',
  body: '',
  media: { image: '', video: '', alt: '' },
  ctas: [{ label: 'Shop now', href: '/products', style: 'primary' }],
  order: 0,
  isEnabled: true,
};

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const load = async () => {
    const [sectionResponse, announcementResponse] = await Promise.all([
      api.get('/admin/homepage/sections'),
      api.get('/admin/announcements'),
    ]);
    setSections(sectionResponse.data);
    setAnnouncements(announcementResponse.data);
  };

  useEffect(() => {
    load().catch(() => toast.error('Could not load homepage builder'));
  }, []);

  const saveSection = async (section: any, index: number) => {
    const payload = { ...section, order: index + 1 };
    const request = section.id ? api.put(`/admin/homepage/sections/${section.id}`, payload) : api.post('/admin/homepage/sections', payload);
    const { data } = await request;
    setSections((current) => current.map((item, itemIndex) => itemIndex === index ? data : item));
    toast.success('Homepage section saved');
  };

  const deleteSection = async (section: any) => {
    if (section.id) await api.delete(`/admin/homepage/sections/${section.id}`);
    setSections((current) => current.filter((item) => item !== section));
    toast.success('Homepage section removed');
  };

  const saveAnnouncement = async (announcement: any, index: number) => {
    const request = announcement.id ? api.put(`/admin/announcements/${announcement.id}`, announcement) : api.post('/admin/announcements', announcement);
    const { data } = await request;
    setAnnouncements((current) => current.map((item, itemIndex) => itemIndex === index ? data : item));
    toast.success('Announcement saved');
  };

  return (
    <div className="space-y-10 pb-24">
      <AdminHeader title="Dynamic Homepage Builder" subtitle="Add, remove, reorder, publish, and disable storefront sections without code changes." />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#573B2D]">Homepage Sections</h2>
          <button onClick={() => setSections([...sections, { ...emptySection, order: sections.length + 1 }])} className="inline-flex items-center gap-2 border border-[#573B2D] bg-white px-5 py-3 text-[10px] uppercase font-bold tracking-[0.18em] text-[#573B2D] hover:bg-[#573B2D]/10 rounded-lg transition-colors cursor-pointer shadow-sm">
            <Plus size={14} className="text-[#573B2D]" /> Add Section
          </button>
        </div>
        {sections.map((section, index) => (
          <div key={section.id || index} className="border border-[#573B2D]/15 bg-white p-5 rounded-xl shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GripVertical className="text-[#573B2D]/60" size={18} />
                <select value={section.type} onChange={(e) => setSections(sections.map((item, i) => i === index ? { ...item, type: e.target.value } : item))} className="border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] font-bold bg-[#FEFFEF]">
                  {['hero', 'collection-grid', 'product-rail', 'banner', 'marquee', 'journal', 'editorial', 'trust-bar', 'custom'].map((type) => <option key={type}>{type}</option>)}
                </select>
                <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#573B2D] font-bold">
                  <input type="checkbox" checked={section.isEnabled} onChange={(e) => setSections(sections.map((item, i) => i === index ? { ...item, isEnabled: e.target.checked } : item))} />
                  Enabled
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveSection(section, index)} className="admin-btn-primary inline-flex items-center gap-2 bg-[#573B2D] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FEFFEF] rounded-lg hover:bg-[#573B2D]/90 transition-all cursor-pointer shadow-sm"><Save size={14} className="text-[#FEFFEF]" /> Save</button>
                <button onClick={() => deleteSection(section)} className="border border-red-500/30 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {['eyebrow', 'title', 'subtitle'].map((field) => (
                <input key={field} value={section[field] || ''} onChange={(e) => setSections(sections.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))} placeholder={field} className="border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
              ))}
              <input value={section.media?.image || ''} onChange={(e) => setSections(sections.map((item, i) => i === index ? { ...item, media: { ...(item.media || {}), image: e.target.value } } : item))} placeholder="Image URL" className="border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
              <textarea value={section.body || ''} onChange={(e) => setSections(sections.map((item, i) => i === index ? { ...item, body: e.target.value } : item))} placeholder="Body copy" className="min-h-24 border border-[#573B2D]/20 p-3 text-sm outline-none md:col-span-2 rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
            </div>
          </div>
        ))}
      </section>

      <section id="announcements" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[#573B2D]">
            <Megaphone size={18} />
            <h2 className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#573B2D]">Announcement Bars</h2>
          </div>
          <button onClick={() => setAnnouncements([...announcements, { message: '', placement: 'top-bar', isActive: true }])} className="inline-flex items-center gap-2 border border-[#573B2D] bg-white px-5 py-3 text-[10px] uppercase font-bold tracking-[0.18em] text-[#573B2D] hover:bg-[#573B2D]/10 rounded-lg transition-colors cursor-pointer shadow-sm">
            <Plus size={14} className="text-[#573B2D]" /> Add Announcement
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {announcements.map((announcement, index) => (
            <div key={announcement.id || index} className="border border-[#573B2D]/15 bg-white p-5 rounded-xl shadow-sm">
              <textarea value={announcement.message || ''} onChange={(e) => setAnnouncements(announcements.map((item, i) => i === index ? { ...item, message: e.target.value } : item))} placeholder="Announcement message" className="min-h-20 w-full border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <input value={announcement.linkLabel || ''} onChange={(e) => setAnnouncements(announcements.map((item, i) => i === index ? { ...item, linkLabel: e.target.value } : item))} placeholder="Link label" className="border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
                <input value={announcement.linkHref || ''} onChange={(e) => setAnnouncements(announcements.map((item, i) => i === index ? { ...item, linkHref: e.target.value } : item))} placeholder="/products" className="border border-[#573B2D]/20 p-3 text-sm outline-none rounded-lg text-[#573B2D] bg-[#FEFFEF]" />
                <button onClick={() => saveAnnouncement(announcement, index)} className="admin-btn-primary bg-[#573B2D] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FEFFEF] rounded-lg hover:bg-[#573B2D]/90 transition-all cursor-pointer shadow-sm">Save</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
