const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxwmpivtusrpktzptmqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d21waXZ0dXNycGt0enB0bXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNzI0MCwiZXhwIjoyMDkzODgzMjQwfQ.yekLIdpnA3ZFIrljVBHqqxvZqkcoJAWGawt4HuYZWmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendFetch() {
  console.log('Testing getProductBySlug("lotus-wrap")...');
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      collection:collections(id, name, slug),
      images:product_images(id, image_url, cloudinary_public_id, alt_text, display_order),
      variants:product_variants(id, size, color, quantity)
    `)
    .eq('is_visible', true)
    .lte('release_date', new Date().toISOString())
    .eq('slug', 'lotus-wrap')
    .single();

  console.log('Single product error:', error);
  console.log('Single product data:', data);
}

testFrontendFetch();
