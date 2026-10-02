const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxwmpivtusrpktzptmqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d21waXZ0dXNycGt0enB0bXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNzI0MCwiZXhwIjoyMDkzODgzMjQwfQ.yekLIdpnA3ZFIrljVBHqqxvZqkcoJAWGawt4HuYZWmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function readHomeSlides() {
  const { data: homeContent, error } = await supabase
    .from('content')
    .select('*')
    .eq('key', 'home')
    .single();

  console.log('Home content slides in DB:', JSON.stringify(homeContent?.data?.slides, null, 2));
}

readHomeSlides();
