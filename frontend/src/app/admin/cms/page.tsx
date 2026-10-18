'use client';

import { useEffect, useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import { Layout, Monitor, Menu as MenuIcon, Plus, Edit2, Trash2, Save, ExternalLink, X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AdminCMS() {
  const { data: hero, refresh: refreshHero } = useAdminData('/admin/content/hero');
  const { data: home, refresh: refreshHome } = useAdminData('/admin/content/home');
  const { data: navbar, refresh: refreshNavbar } = useAdminData('/admin/content/navbar');
  const { data: footer, refresh: refreshFooter } = useAdminData('/admin/content/footer');
  const { data: pages, refresh: refreshPages } = useAdminData('/admin/content/pages');

  const [editingPage, setEditingPage] = useState<any>(null);
  const [heroForm, setHeroForm] = useState<any>(null);
  const [homeForm, setHomeForm] = useState<any>(null);
  const [navForm, setNavForm] = useState<any[] | null>(null);
  const [footerForm, setFooterForm] = useState<any[] | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [savingHero, setSavingHero] = useState(false);

  useEffect(() => {
    if (hero?.data) setHeroForm(hero.data);
  }, [hero]);

  useEffect(() => {
    if (home?.data) setHomeForm(home.data);
  }, [home]);

  const handleUpdateHero = async () => {
    setSavingHero(true);
    try {
      await api.put('/admin/content/hero', heroForm || hero?.data);
      toast.success('Hero content updated');
      refreshHero();
    } catch (error) {
      toast.error('Failed to update hero');
    } finally {
      setSavingHero(false);
    }
  };

  const saveNavbar = async () => {
    try {
      await api.put('/admin/content/navbar', {
        items: (navForm || []).map((item, index) => ({ ...item, order: index + 1 })),
      });
      toast.success('Navigation links updated');
      setNavForm(null);
      refreshNavbar();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update navigation');
    }
  };

  const saveHome = async () => {
    try {
      await api.put('/admin/content/home', homeForm);
      toast.success('Homepage collections updated');
      refreshHome();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update homepage');
    }
  };

  const saveFooter = async () => {
    try {
      await api.put('/admin/content/footer', { groups: footerForm || [] });
      toast.success('Footer structure updated');
      setFooterForm(null);
      refreshFooter();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update footer');
    }
  };

  const deletePage = async () => {
    if (!pageToDelete) return;
    try {
      await api.delete(`/admin/content/pages/${pageToDelete}`);
      toast.success('Page deleted');
      refreshPages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    } finally {
      setPageToDelete(null);
    }
  };

  const savePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage.id) {
        await api.put(`/admin/content/pages/${editingPage.id}`, editingPage);
        toast.success('Page updated');
      } else {
        await api.post('/admin/content/pages', editingPage);
        toast.success('Page created');
      }
      setEditingPage(null);
      refreshPages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving page');
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <AdminHeader title="CMS Control" subtitle="Dynamically manage website content and structure." />

      <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Monitor size={20} /></div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Homepage Visuals</h2>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Upload main slider, Lotus, Lion, and Artist collection pictures.</p>
            </div>
          </div>
          <button
            onClick={saveHome}
            className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save size={16} className="text-[#FEFFEF]" /> Save Homepage
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#573B2D]">Main Sliding Hero Archive</h3>
            <button
              onClick={() => setHomeForm({ 
                ...homeForm, 
                slides: [...(homeForm?.slides || []), { title: '', subtitle: '', eyebrow: '', ctaText: 'Shop Now', ctaLink: '/shop', image: '', mobileImage: '', desktopObjectPosition: 'center center', mobileObjectPosition: 'center center' }] 
              })}
              className="text-[10px] font-bold text-[#573B2D] uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} className="text-[#573B2D]" /> Add New Slide
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {(homeForm?.slides || []).map((slide: any, index: number) => (
              <div key={index} className="bg-black/30 border border-white/5 rounded-2xl p-6 space-y-4 relative group">
                <button 
                  onClick={() => {
                    const next = [...homeForm.slides];
                    next.splice(index, 1);
                    setHomeForm({ ...homeForm, slides: next });
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="md:col-span-1 space-y-5">
                    <label className="text-[8px] uppercase font-bold text-gray-500 mb-2 block">Slide Image</label>
                    <ImageUploader
                      multiple={false}
                      folder="lotus-lion/home/hero"
                      existingImages={slide.image ? [slide.image] : []}
                      onUpload={(urls) => {
                        const next = [...homeForm.slides];
                        next[index].image = urls[0];
                        setHomeForm({ ...homeForm, slides: next });
                      }}
                    />
                    <div>
                      <label className="text-[8px] uppercase font-bold text-gray-500 mb-2 block">Phone Hero Image</label>
                      <ImageUploader
                        multiple={false}
                        folder="lotus-lion/home/hero-mobile"
                        existingImages={slide.mobileImage ? [slide.mobileImage] : []}
                        onUpload={(urls) => {
                          const next = [...homeForm.slides];
                          next[index].mobileImage = urls[0];
                          setHomeForm({ ...homeForm, slides: next });
                        }}
                      />
                      <p className="mt-2 text-[10px] leading-5 text-gray-500">Use a tall mobile crop so the model stays centered on phones.</p>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Eyebrow</label>
                        <input
                          value={slide.eyebrow || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].eyebrow = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          placeholder="e.g. Online Exclusive"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Title</label>
                        <input
                          value={slide.title || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].title = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          placeholder="e.g. Lotus & Lion"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-bold"
                        />
                        <label className="flex min-h-10 items-center gap-2 pt-2 text-[10px] uppercase tracking-wider text-gray-400">
                          <input
                            type="checkbox"
                            checked={slide.title?.trim() === 'Lotus & Lion'
                              ? slide.brandTitleVisibilityOverridden === true && slide.showTitle === true
                              : slide.showTitle !== false}
                            onChange={(e) => {
                              const next = [...homeForm.slides];
                              next[index].showTitle = e.target.checked;
                              if (next[index].title?.trim() === 'Lotus & Lion') {
                                next[index].brandTitleVisibilityOverridden = true;
                              }
                              setHomeForm({ ...homeForm, slides: next });
                            }}
                          />
                          Show title on banner
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] uppercase font-bold text-gray-500">Subtitle</label>
                      <input
                        value={slide.subtitle || ''}
                        onChange={(e) => {
                          const next = [...homeForm.slides];
                          next[index].subtitle = e.target.value;
                          setHomeForm({ ...homeForm, slides: next });
                        }}
                        placeholder="Describe the mood of this slide..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Button Text</label>
                        <input
                          value={slide.ctaText || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].ctaText = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Attaching Page (URL)</label>
                        <input
                          value={slide.ctaLink || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].ctaLink = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          placeholder="/collections/lotus"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Desktop Alignment</label>
                        <input
                          value={slide.desktopObjectPosition || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].desktopObjectPosition = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          placeholder="center center"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-500">Phone Alignment</label>
                        <input
                          value={slide.mobileObjectPosition || ''}
                          onChange={(e) => {
                            const next = [...homeForm.slides];
                            next[index].mobileObjectPosition = e.target.value;
                            setHomeForm({ ...homeForm, slides: next });
                          }}
                          placeholder="center center"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/5">
            {[
              ['lotus', 'Lotus Collection'],
              ['lion', 'Lion Collection'],
              ['artist', 'Artist Outfits'],
            ].map(([key, label]) => (
              <div key={key} className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">{label}</h3>
                <ImageUploader
                  multiple={false}
                  folder={`lotus-lion/home/${key}`}
                  existingImages={homeForm?.collections?.[key]?.image ? [homeForm.collections[key].image] : []}
                  onUpload={(urls) => setHomeForm({
                    ...homeForm,
                    collections: {
                      ...(homeForm?.collections || {}),
                      [key]: { ...(homeForm?.collections?.[key] || {}), image: urls[0] },
                    },
                  })}
                />
                {(key === 'lotus' || key === 'lion') && (
                  <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-[10px] uppercase tracking-wider text-gray-300">
                    <input
                      type="checkbox"
                      checked={homeForm?.collections?.[key]?.showIcon === true}
                      onChange={(e) => setHomeForm({
                        ...homeForm,
                        collections: {
                          ...(homeForm?.collections || {}),
                          [key]: { ...(homeForm?.collections?.[key] || {}), showIcon: e.target.checked },
                        },
                      })}
                    />
                    Show collection symbol
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero Management */}
        <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg"><Monitor size={20} /></div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Hero Section</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Main Title</label>
              <input 
                type="text" 
                value={heroForm?.title || ''}
                onChange={(e) => setHeroForm({...heroForm, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Subtitle</label>
              <input 
                type="text" 
                value={heroForm?.subtitle || ''}
                onChange={(e) => setHeroForm({...heroForm, subtitle: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Background Image</label>
              <ImageUploader 
                multiple={false} 
                existingImages={heroForm?.image ? [heroForm.image] : []}
                onUpload={(urls) => setHeroForm({...heroForm, image: urls[0]})}
              />
            </div>
            <button 
              onClick={handleUpdateHero}
              disabled={savingHero}
              className="admin-btn-primary w-full bg-[#573B2D] text-[#FEFFEF] py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#573B2D]/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {savingHero ? 'Syncing...' : <><Save size={16} className="text-[#FEFFEF]" /> Save Hero Config</>}
            </button>
          </div>
        </section>

        {/* Navigation & Footer (Overview) */}
        <div className="space-y-8">
           <section className="bg-[#111] border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><MenuIcon size={20} /></div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Global Navigation</h2>
                </div>
                <button
                  onClick={() => setNavForm(navbar?.data || [])}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Edit Links
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                 {navbar?.data?.map((item: any, i: number) => (
                   <span key={item.id || `nav-item-${i}`} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400">
                     {item.label}
                   </span>
                 ))}
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Layout size={20} /></div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Site Footer</h2>
                </div>
                <button
                  onClick={() => setFooterForm(footer?.data || [])}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                >
                  Edit Structure
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {footer?.data?.map((group: any, i: number) => (
                   <div key={group.id || `footer-group-${i}`} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[8px] font-bold uppercase text-gray-500 mb-1">{group.heading}</p>
                      <p className="text-[10px] text-white font-bold">{group.links?.length} Links</p>
                   </div>
                 ))}
              </div>
           </section>
        </div>
      </div>

      {/* Pages Management */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Monitor size={20} /></div>
             <h2 className="text-sm font-bold uppercase tracking-widest text-white">Custom Pages</h2>
          </div>
          <button 
            onClick={() => setEditingPage({ title: '', slug: '', body: '', isPublished: true })}
            className="bg-white border border-[#573B2D]/30 text-[#573B2D] px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[#573B2D]/10 transition-all cursor-pointer shadow-sm"
          >
            <Plus size={16} className="text-[#573B2D]" /> New Page
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {pages?.map((page: any, i: number) => (
             <motion.div 
               key={page.id || `page-${i}`}
               whileHover={{ y: -5 }}
               className="bg-[#111] border border-white/5 rounded-2xl p-6 group hover:border-primary/30 transition-all"
             >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${page.isPublished ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {page.isPublished ? 'Live' : 'Draft'}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingPage(page)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 size={14} /></button>
                    <button onClick={() => setPageToDelete(page.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight mb-1">{page.title}</h3>
                <p className="text-[10px] text-gray-500 font-mono">/{page.slug}</p>
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                   <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Last Modified: {new Date(page.updatedAt).toLocaleDateString()}</span>
                   <Link href={`/${page.slug}`} target="_blank" className="text-gray-400 hover:text-primary transition-colors"><ExternalLink size={14} /></Link>
                </div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Page Edit Modal */}
      <Modal 
        isOpen={!!editingPage} 
        onClose={() => setEditingPage(null)} 
        title={editingPage?.id ? 'Edit Page' : 'Create New Page'}
        size="xl"
      >
        <form onSubmit={savePage} className="space-y-6">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500">Page Title</label>
                <input 
                  type="text" 
                  value={editingPage?.title}
                  onChange={(e) => setEditingPage({...editingPage, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500">Slug (URL Path)</label>
                <input 
                  type="text" 
                  value={editingPage?.slug}
                  onChange={(e) => setEditingPage({...editingPage, slug: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
                  placeholder="e.g. shipping-policy"
                  required
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500">Page Content (Rich Text)</label>
              <RichTextEditor 
                content={editingPage?.body || ''} 
                onChange={(html) => setEditingPage({...editingPage, body: html})}
              />
           </div>

           <div className="flex items-center justify-between pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editingPage?.isPublished}
                  onChange={(e) => setEditingPage({...editingPage, isPublished: e.target.checked})}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Published (Visible to customers)</span>
              </label>
              <button 
                type="submit"
                className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/90 transition-all cursor-pointer shadow-sm"
              >
                Save Page
              </button>
           </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!navForm}
        onClose={() => setNavForm(null)}
        title="Edit Navigation Links"
        size="lg"
      >
        <div className="space-y-4">
          {(navForm || []).map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
              <input
                value={item.label || ''}
                onChange={(e) => setNavForm((navForm || []).map((nav, i) => i === index ? { ...nav, label: e.target.value } : nav))}
                placeholder="Label"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
              />
              <input
                value={item.href || ''}
                onChange={(e) => setNavForm((navForm || []).map((nav, i) => i === index ? { ...nav, href: e.target.value } : nav))}
                placeholder="/path"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
              />
              <button
                onClick={() => setNavForm((navForm || []).filter((_, i) => i !== index))}
                className="p-3 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setNavForm([...(navForm || []), { label: '', href: '/', order: (navForm || []).length + 1 }])}
              className="bg-white border border-[#573B2D]/30 text-[#573B2D] px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/10 cursor-pointer shadow-sm transition-all"
            >
              Add Link
            </button>
            <button
              onClick={saveNavbar}
              className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/90 cursor-pointer shadow-sm transition-all"
            >
              Save Links
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!footerForm}
        onClose={() => setFooterForm(null)}
        title="Edit Footer Structure"
        size="xl"
      >
        <div className="space-y-6">
          {(footerForm || []).map((group, groupIndex) => (
            <div key={groupIndex} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                <input
                  value={group.heading || ''}
                  onChange={(e) => setFooterForm((footerForm || []).map((g, i) => i === groupIndex ? { ...g, heading: e.target.value } : g))}
                  placeholder="Group heading"
                  className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                />
                <button
                  onClick={() => setFooterForm((footerForm || []).filter((_, i) => i !== groupIndex))}
                  className="p-3 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                >
                  <X size={16} />
                </button>
              </div>
              {(group.links || []).map((link: any, linkIndex: number) => (
                <div key={linkIndex} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                  <input
                    value={link.label || ''}
                    onChange={(e) => {
                      const next = [...(footerForm || [])];
                      next[groupIndex].links[linkIndex] = { ...link, label: e.target.value };
                      setFooterForm(next);
                    }}
                    placeholder="Label"
                    className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                  />
                  <input
                    value={link.href || ''}
                    onChange={(e) => {
                      const next = [...(footerForm || [])];
                      next[groupIndex].links[linkIndex] = { ...link, href: e.target.value };
                      setFooterForm(next);
                    }}
                    placeholder="/path"
                    className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      const next = [...(footerForm || [])];
                      next[groupIndex].links = next[groupIndex].links.filter((_: any, i: number) => i !== linkIndex);
                      setFooterForm(next);
                    }}
                    className="p-3 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const next = [...(footerForm || [])];
                  next[groupIndex].links = [...(next[groupIndex].links || []), { label: '', href: '/' }];
                  setFooterForm(next);
                }}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Add Footer Link
              </button>
            </div>
          ))}
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setFooterForm([...(footerForm || []), { heading: '', links: [] }])}
              className="bg-white border border-[#573B2D]/30 text-[#573B2D] px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/10 cursor-pointer shadow-sm transition-all"
            >
              Add Group
            </button>
            <button
              onClick={saveFooter}
              className="admin-btn-primary bg-[#573B2D] text-[#FEFFEF] px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#573B2D]/90 cursor-pointer shadow-sm transition-all"
            >
              Save Footer
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!pageToDelete}
        onClose={() => setPageToDelete(null)}
        onConfirm={deletePage}
        title="Delete Page?"
        message="This custom page will be removed from the storefront and CMS list."
        confirmText="Delete"
      />
    </div>
  );
}
