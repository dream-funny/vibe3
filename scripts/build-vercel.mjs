import { writeFile } from 'node:fs/promises';

const config = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

await writeFile(
  new URL('../public/supabase-config.js', import.meta.url),
  `window.__SUPABASE_CONFIG__ = ${JSON.stringify(config)};\n`,
  'utf8',
);

console.log('Vercel static files prepared.');
