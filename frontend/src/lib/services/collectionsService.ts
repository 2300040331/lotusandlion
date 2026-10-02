import { supabase } from '@/lib/supabase';

export const collectionsService = {
  // Fetch all active collections
  async getCollections() {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collections:', error);
      return [];
    }
  },

  // Fetch single collection by slug
  async getCollectionBySlug(slug: string) {
    try {
      const womenSlugs = ['lotus', 'women', 'womens'];
      const menSlugs = ['lion', 'men', 'mens'];
      
      let targetSlugs = [slug.toLowerCase()];
      if (womenSlugs.includes(slug.toLowerCase())) {
        targetSlugs = womenSlugs;
      } else if (menSlugs.includes(slug.toLowerCase())) {
        targetSlugs = menSlugs;
      }

      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .in('slug', targetSlugs)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching collection:', error);
      }
      return null;
    }
  },

  // Fetch collection with products
  async getCollectionWithProducts(slug: string) {
    try {
      const womenSlugs = ['lotus', 'women', 'womens'];
      const menSlugs = ['lion', 'men', 'mens'];
      
      let targetSlugs = [slug.toLowerCase()];
      if (womenSlugs.includes(slug.toLowerCase())) {
        targetSlugs = womenSlugs;
      } else if (menSlugs.includes(slug.toLowerCase())) {
        targetSlugs = menSlugs;
      }

      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          products(
            *,
            images:product_images(id, image_url, alt_text)
          )
        `)
        .in('slug', targetSlugs)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching collection with products:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          error
        });
      }
      return null;
    }
  },

  // Fetch featured collections
  async getFeaturedCollections() {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(2);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured collections:', error);
      return [];
    }
  },
};
