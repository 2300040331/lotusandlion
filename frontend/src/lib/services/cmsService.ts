import api from '@/lib/api';

export const homepageService = {
  // Fetch all active homepage sections
  async getSections() {
    try {
      const { data } = await api.get('/admin/homepage/sections');
      return Array.isArray(data) ? data.filter((s: any) => s.is_active) : [];
    } catch (error) {
      console.error('Error fetching homepage sections:', error);
      return [];
    }
  },

  // Fetch specific section
  async getSection(sectionKey: string) {
    try {
      const { data } = await api.get('/admin/homepage/sections');
      if (Array.isArray(data)) {
        return data.find((s: any) => s.section_key === sectionKey && s.is_active) || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching section:', error);
      return null;
    }
  },
};

export const navbarService = {
  // Fetch navbar configuration
  async getNavbarConfig() {
    try {
      const { data } = await api.get('/admin/content/navbar');
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
      const { data } = await api.get('/admin/content/footer');
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
      const { data } = await api.get('/cms/settings');
      return data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  },
};
