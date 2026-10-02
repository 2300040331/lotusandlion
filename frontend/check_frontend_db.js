const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxwmpivtusrpktzptmqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d21waXZ0dXNycGt0enB0bXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNzI0MCwiZXhwIjoyMDkzODgzMjQwfQ.yekLIdpnA3ZFIrljVBHqqxvZqkcoJAWGawt4HuYZWmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendFetch() {
  console.log('Testing collections...');
  const { data: collections, error: cErr } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true);
  console.log('Collections error:', cErr);
  console.log('Collections data:', collections);

  console.log('\nTesting products relationship fetch (slug=lotus)...');
  const { data: colProducts, error: cpErr } = await supabase
    .from('collections')
    .select(`
      *,
      products(
        *,
        images:product_images(id, image_url, alt_text)
      )
    `)
    .eq('slug', 'lotus')
    .eq('is_active', true)
    .single();

  console.log('Relationship query error:', cpErr);
  console.log('Relationship query data (products count):', colProducts ? colProducts.products?.length : 'No collection data');
  if (colProducts && colProducts.products) {
    console.log('Products:', colProducts.products);
  }
}

testFrontendFetch();
