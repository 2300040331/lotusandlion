import { supabase } from '@/lib/supabase';

export const productsService = {
  // Fetch all visible products
  async getProducts(collectionIdentifier?: string) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          collection:collections(id, name, slug),
          images:product_images(id, image_url, alt_text, display_order),
          variants:product_variants(id, size, color, quantity)
        `)
        .eq('is_visible', true)
        .lte('release_date', new Date().toISOString());

      if (collectionIdentifier) {
        // Check if the identifier is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(collectionIdentifier);
        
        if (isUuid) {
          query = query.eq('collection_id', collectionIdentifier);
        } else {
          // Fetch the collection ID by equivalent slug first
          const womenSlugs = ['lotus', 'women', 'womens'];
          const menSlugs = ['lion', 'men', 'mens'];
          
          let targetSlugs = [collectionIdentifier.toLowerCase()];
          if (womenSlugs.includes(collectionIdentifier.toLowerCase())) {
            targetSlugs = womenSlugs;
          } else if (menSlugs.includes(collectionIdentifier.toLowerCase())) {
            targetSlugs = menSlugs;
          }

          const { data: collectionData, error: collError } = await supabase
            .from('collections')
            .select('id')
            .in('slug', targetSlugs)
            .eq('is_active', true)
            .maybeSingle();
          
          if (collError || !collectionData) {
            console.warn(`Collection not found for slug: ${collectionIdentifier}`);
            return [];
          }
          
          query = query.eq('collection_id', collectionData.id);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Fetch single product by slug
  async getProductBySlug(slug: string) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let query = supabase
        .from('products')
        .select(`
          *,
          collection:collections(id, name, slug),
          images:product_images(id, image_url, cloudinary_public_id, alt_text, display_order),
          variants:product_variants(id, size, color, quantity)
        `)
        .eq('is_visible', true)
        .lte('release_date', new Date().toISOString());

      query = isUuid ? query.eq('id', slug) : query.eq('slug', slug);

      const { data, error } = await query.single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching product:', error);
      }
      return null;
    }
  },

  // Fetch featured products
  async getFeaturedProducts(limit = 8) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          collection:collections(id, name, slug),
          images:product_images(id, image_url, alt_text)
        `)
        .eq('is_visible', true)
        .eq('is_featured', true)
        .lte('release_date', new Date().toISOString())
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  },

  // Fetch trending products
  async getTrendingProducts(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          collection:collections(id, name, slug),
          images:product_images(id, image_url, alt_text)
        `)
        .eq('is_visible', true)
        .eq('is_trending', true)
        .lte('release_date', new Date().toISOString())
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  },

  // Search products
  async searchProducts(query: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          collection:collections(id, name, slug),
          images:product_images(id, image_url, alt_text)
        `)
        .eq('is_visible', true)
        .lte('release_date', new Date().toISOString())
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },

  // Check stock
  async checkStock(productId: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data?.stock_quantity || 0;
    } catch (error) {
      console.error('Error checking stock:', error);
      return 0;
    }
  },
};
