const fs = require('fs');
const readline = require('readline');

async function searchLogs() {
  const fileStream = fs.createReadStream('/Users/dineshpabbathi/.gemini/antigravity/brain/0247ea8c-8041-481e-ae2c-3ef855ad3ff4/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const urls = new Set();

  for await (const line of rl) {
    if (line.includes('storage/v1/object/public/lotus-lion')) {
      const matches = line.match(/https:\/\/mxwmpivtusrpktzptmqt\.supabase\.co\/storage\/v1\/object\/public\/lotus-lion\/[^\s"'}]+/g);
      if (matches) {
        matches.forEach(m => urls.add(m));
      }
    }
  }

  console.log('Found Supabase image URLs in logs:', Array.from(urls));
}

searchLogs();
