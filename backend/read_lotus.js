const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxwmpivtusrpktzptmqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d21waXZ0dXNycGt0enB0bXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNzI0MCwiZXhwIjoyMDkzODgzMjQwfQ.yekLIdpnA3ZFIrljVBHqqxvZqkcoJAWGawt4HuYZWmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function readLotus() {
  const { data: collection, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', 'lotus')
    .single();

  console.log('Lotus Collection row in DB:', JSON.stringify(collection, null, 2));
}

readLotus();
