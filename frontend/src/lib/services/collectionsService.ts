import api from '@/lib/api';

export const collectionsService = {
  // Fetch all active collections
  async getCollections() {
    try {
      const { data } = await api.get('/collections');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  // Fetch single collection by slug
  async getCollectionBySlug(slug: string) {
    try {
      const { data } = await api.get(`/collections/${encodeURIComponent(slug)}`);
      return data;
    } catch (error) {
      console.error('Error fetching collection:', error);
      return null;
    }
  },

  // Fetch collection with products
  async getCollectionWithProducts(slug: string) {
    try {
      const { data } = await api.get(`/collections/${encodeURIComponent(slug)}/products`);
      if (!data) return null;
      return {
        ...data.collection,
        products: data.products || [],
      };
    } catch (error) {
      console.error('Error fetching collection with products:', error);
      return null;
    }
  },

  // Fetch featured collections
  async getFeaturedCollections() {
    try {
      const { data } = await api.get('/collections');
      return Array.isArray(data) ? data.slice(0, 2) : [];
    } catch (error) {
      console.error('Error fetching featured collections:', error);
      return [];
    }
  },
};
