import { supabase } from '@/lib/supabase';

export const homepageService = {
  // Fetch all active homepage sections
  async getSections() {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
      return [];
    }
  },

  // Fetch specific section
  async getSection(sectionKey: string) {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .eq('section_key', sectionKey)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching section:', error);
      }
      return null;
    }
  },
};

export const navbarService = {
  // Fetch navbar configuration
  async getNavbarConfig() {
    try {
      const { data, error } = await supabase
        .from('navbar_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching navbar config:', error);
      return null;
    }
  },
};

export const footerService = {
  // Fetch footer configuration
  async getFooterConfig() {
    try {
      const { data, error } = await supabase
        .from('footer_config')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching footer config:', error);
      return null;
    }
  },
};

export const settingsService = {
  // Fetch website settings
  async getSettings() {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  },
};
