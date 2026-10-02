import { supabase } from '@/lib/supabase';

export const blogsService = {
  // Fetch all published blogs
  async getBlogs(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
  },

  // Fetch featured blogs
  async getFeaturedBlogs(limit = 3) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured blogs:', error);
      return [];
    }
  },

  // Fetch single blog by slug
  async getBlogBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:author_id(name, avatar_url)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      if (error?.code !== 'PGRST116') {
        console.error('Error fetching blog:', error);
      }
      return null;
    }
  },

  // Search blogs
  async searchBlogs(query: string) {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('is_published', true)
        .ilike('title', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching blogs:', error);
      return [];
    }
  },
};
