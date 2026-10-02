require('dotenv').config();
const supabase = require('./src/config/supabase');

async function updateBucketLimit() {
  const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'lotus-lion';
  console.log(`Attempting to update Supabase bucket: "${BUCKET_NAME}" limits...`);
  
  // Set size limit to 50MB (50 * 1024 * 1024 bytes)
  const { data, error } = await supabase.storage.updateBucket(BUCKET_NAME, {
    public: true,
    file_size_limit: 52428800, // 50MB in bytes
    fileSizeLimit: 52428800
  });

  if (error) {
    console.error('Failed to update bucket:', error);
  } else {
    console.log('Bucket limits updated successfully:', data);
  }
}

updateBucketLimit();
