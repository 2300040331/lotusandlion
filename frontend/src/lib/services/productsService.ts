import api from '@/lib/api';

export const productsService = {
  // Fetch all visible products
  async getProducts(collectionIdentifier?: string) {
    try {
      const params: Record<string, string> = {};
      if (collectionIdentifier) {
        params.collectionType = collectionIdentifier;
      }
      const { data } = await api.get('/products', { params });
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Fetch single product by slug
  async getProductBySlug(slug: string) {
    try {
      const { data } = await api.get(`/products/${encodeURIComponent(slug)}`);
      return data || null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Fetch featured products
  async getFeaturedProducts(limit = 8) {
    try {
      const { data } = await api.get('/products/featured');
      return Array.isArray(data) ? data.slice(0, limit) : [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Fetch trending products
  async getTrendingProducts(limit = 6) {
    try {
      const { data } = await api.get('/products/featured');
      return Array.isArray(data) ? data.slice(0, limit) : [];
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(query: string) {
    try {
      const { data } = await api.get('/products', { params: { keyword: query, limit: 20 } });
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Check stock
  async checkStock(productId: string) {
    try {
      const { data } = await api.get(`/products/${encodeURIComponent(productId)}`);
      return Number(data?.countInStock ?? data?.stock_quantity ?? 0);
    } catch (error) {
      console.error('Error checking stock:', error);
      return 0;
    }
  },
};
