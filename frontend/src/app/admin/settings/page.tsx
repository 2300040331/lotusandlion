'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useAdminData';
import AdminHeader from '@/components/admin/AdminHeader';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Truck, 
  Tag, 
  Zap, 
  Globe,
  Save,
  Lock,
  Loader2
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useStore } from '@/store/useStore';

const DEFAULT_SETTINGS: Record<string, { value: any; label: string; description: string }> = {
  globalDiscount: {
    value: { enabled: false, percentage: 0 },
    label: 'Global Discount',
    description: 'Apply a percentage discount to every visible product.',
  },
  flashSale: {
    value: { enabled: false, label: 'Lotus & Lion Sale', endsAt: '' },
    label: 'Flash Sale',
    description: 'Enable storefront flash sale messaging.',
  },
  shipping: {
    value: { freeThreshold: 5000, cost: 250 },
    label: 'Shipping',
    description: 'Configure checkout shipping rules.',
  },
  siteMeta: {
    value: { name: 'Lotus & Lion', tagline: 'Luxury essentials for the modern pioneer.', whatsapp: '', instagram: '', twitter: '', pinterest: '' },
    label: 'Site Identity & Socials',
    description: 'Store name, contact details, and social media links.',
  },
  maintenanceMode: {
    value: { enabled: false },
    label: 'Maintenance Mode',
    description: 'Temporarily restrict public storefront access.',
  },
};

export default function AdminSettings() {
  const { data: settingsMap, loading, refresh } = useSettings();
  const { userInfo } = useStore();
  const [localSettings, setLocalSettings] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...DEFAULT_SETTINGS, ...(settingsMap || {}) });
  }, [settingsMap]);

  const handleUpdate = async () => {
    if (userInfo?.role !== 'super-admin') {
      toast.error('Only Super Admins can modify global settings');
      return;
    }

    setSaving(true);
    try {
      // Map back to { key: value } for the multi-update endpoint
      const updates: any = {};
      Object.keys(localSettings).forEach(key => {
        updates[key] = localSettings[key].value;
      });

      // Special handling for nested siteMeta to flat DB columns if needed
      // But the backend /admin/settings handles mapping
      await api.put('/admin/settings', updates);
      toast.success('Global settings synced');
      refresh();
    } catch (error) {
      toast.error('Failed to sync settings');
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (key: string, newValue: any) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can modify global settings');
      return;
    }

    setLocalSettings({
      ...localSettings,
      [key]: { ...(localSettings[key] || DEFAULT_SETTINGS[key]), value: newValue }
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse flex items-center gap-4">
        <Lock size={16} /> Decrypting System Config...
      </div>
    </div>
  );

  const isSuperAdmin = userInfo?.role === 'super-admin';

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <AdminHeader title="System Config" subtitle="Master control over global site behavior." />
        <button 
          onClick={handleUpdate}
          disabled={saving || !isSuperAdmin}
          className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
            isSuperAdmin ? 'admin-btn-primary bg-[#573B2D] text-[#FEFFEF] hover:bg-[#573B2D]/90' : 'bg-[#573B2D]/20 text-[#573B2D]/50 cursor-not-allowed'
          }`}
        >
          {saving ? <Loader2 className="animate-spin text-[#FEFFEF]" size={16} /> : <Save className="text-[#FEFFEF]" size={16} />}
          Save Configuration
        </button>
      </div>

      {!isSuperAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 flex items-center gap-4">
           <ShieldCheck className="text-yellow-500" size={24} />
           <div>
             <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Read-Only Mode</p>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Your account level (Admin) can view but not modify system-wide settings.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* E-commerce Logic */}
        <div className="space-y-8">
          <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 text-primary rounded-lg"><Tag size={20} /></div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Promotional Control</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-white">Global Discount</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Apply % off to all products site-wide</p>
                </div>
                <div className="flex items-center gap-4">
                   <input 
                    type="number" 
                    min={0}
                    max={90}
                    value={localSettings.globalDiscount?.value?.percentage ?? 0}
                    onChange={(e) => updateValue('globalDiscount', { ...localSettings.globalDiscount.value, percentage: Number(e.target.value) })}
                    className="w-16 bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-center text-primary font-bold"
                    disabled={!isSuperAdmin}
                   />
                   <button 
                    onClick={() => updateValue('globalDiscount', { ...localSettings.globalDiscount.value, enabled: !localSettings.globalDiscount.value.enabled })}
                    className={`w-12 h-6 rounded-full transition-all relative ${localSettings.globalDiscount?.value?.enabled ? 'bg-primary' : 'bg-white/10'}`}
                    disabled={!isSuperAdmin}
                   >
                     <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.globalDiscount?.value?.enabled ? 'right-1' : 'left-1'}`} />
                   </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase text-white">Flash Sale Mode</p>
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Enable high-urgency banners and timers</p>
                </div>
                <button 
                  onClick={() => updateValue('flashSale', { ...localSettings.flashSale.value, enabled: !localSettings.flashSale.value.enabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${localSettings.flashSale?.value?.enabled ? 'bg-primary' : 'bg-white/10'}`}
                  disabled={!isSuperAdmin}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.flashSale?.value?.enabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Sale Label</label>
                  <input
                    type="text"
                    value={localSettings.flashSale?.value?.label ?? ''}
                    onChange={(e) => updateValue('flashSale', { ...localSettings.flashSale.value, label: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                    disabled={!isSuperAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Sale Timer Ends At</label>
                  <input
                    type="datetime-local"
                    value={localSettings.flashSale?.value?.endsAt ?? ''}
                    onChange={(e) => updateValue('flashSale', { ...localSettings.flashSale.value, endsAt: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                    disabled={!isSuperAdmin}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><Truck size={20} /></div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white">Shipping Configuration</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Free Shipping Threshold (INR)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={localSettings.shipping?.value?.freeThreshold ?? 0}
                    onChange={(e) => updateValue('shipping', { ...localSettings.shipping.value, freeThreshold: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                    disabled={!isSuperAdmin}
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Flat Rate Cost (INR)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={localSettings.shipping?.value?.cost ?? 0}
                    onChange={(e) => updateValue('shipping', { ...localSettings.shipping.value, cost: Number(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                    disabled={!isSuperAdmin}
                  />
               </div>
            </div>
          </section>
        </div>

        {/* System & SEO */}
        <div className="space-y-8">
           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Globe size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Site Identity & SEO</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Store Name</label>
                    <input 
                      type="text" 
                      value={localSettings.siteMeta?.value?.name ?? ''}
                      onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                      disabled={!isSuperAdmin}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Store Tagline</label>
                    <input 
                      type="text" 
                      value={localSettings.siteMeta?.value?.tagline ?? ''}
                      onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, tagline: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none"
                      disabled={!isSuperAdmin}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">WhatsApp Support Number</label>
                    <input 
                      type="text" 
                      value={localSettings.siteMeta?.value?.whatsapp ?? ''}
                      onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, whatsapp: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none text-[#25D366] font-bold"
                      placeholder="e.g. 919876543210"
                      disabled={!isSuperAdmin}
                    />
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Include country code without + (e.g. 91 for India)</p>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Social Media Channels</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-400">Instagram</label>
                        <input 
                          type="text" 
                          value={localSettings.siteMeta?.value?.instagram ?? ''}
                          onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, instagram: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] focus:border-primary outline-none"
                          placeholder="https://instagram.com/..."
                          disabled={!isSuperAdmin}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-400">Twitter (X)</label>
                        <input 
                          type="text" 
                          value={localSettings.siteMeta?.value?.twitter ?? ''}
                          onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, twitter: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] focus:border-primary outline-none"
                          placeholder="https://twitter.com/..."
                          disabled={!isSuperAdmin}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase font-bold text-gray-400">Pinterest</label>
                        <input 
                          type="text" 
                          value={localSettings.siteMeta?.value?.pinterest ?? ''}
                          onChange={(e) => updateValue('siteMeta', { ...localSettings.siteMeta.value, pinterest: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] focus:border-primary outline-none"
                          placeholder="https://pinterest.com/..."
                          disabled={!isSuperAdmin}
                        />
                      </div>
                    </div>
                  </div>
              </div>
           </section>

           <section className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg"><Zap size={20} /></div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Danger Zone</h2>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                 <div>
                    <p className="text-[10px] font-bold uppercase text-red-500">Maintenance Mode</p>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Block all public access to the storefront</p>
                 </div>
                 <button 
                  onClick={() => updateValue('maintenanceMode', { ...localSettings.maintenanceMode.value, enabled: !localSettings.maintenanceMode.value.enabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${localSettings.maintenanceMode?.value?.enabled ? 'bg-red-500' : 'bg-white/10'}`}
                  disabled={!isSuperAdmin}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.maintenanceMode?.value?.enabled ? 'right-1' : 'left-1'}`} />
                 </button>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}
