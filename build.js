const fs = require('fs');

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';

fs.writeFileSync(
  'env-config.js',
  `window.__env__ = ${JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key })};\n`
);

console.log('[build] env-config.js written.');
