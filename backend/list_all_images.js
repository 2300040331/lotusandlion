const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxwmpivtusrpktzptmqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14d21waXZ0dXNycGt0enB0bXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNzI0MCwiZXhwIjoyMDkzODgzMjQwfQ.yekLIdpnA3ZFIrljVBHqqxvZqkcoJAWGawt4HuYZWmk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUrls() {
  console.log('--- Content ---');
  const { data: content } = await supabase.from('content').select('*');
  content.forEach(c => {
    console.log(`Key: ${c.key}`);
    console.log(JSON.stringify(c.data, null, 2));
  });

  console.log('--- Homepage Sections ---');
  const { data: sections } = await supabase.from('homepage_sections').select('*');
  console.log(JSON.stringify(sections, null, 2));

  console.log('--- Collections ---');
  const { data: cols } = await supabase.from('collections').select('*');
  console.log(JSON.stringify(cols, null, 2));
}

listUrls();
