import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.vercel', 'output', 'static');
const shellFiles = ['index.html', 'styles.css', 'sw.js', 'MANUAL.md', '.nojekyll'];
const shellDirectories = ['assets', 'js'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of shellFiles) {
  await cp(path.join(root, file), path.join(output, file));
}

for (const directory of shellDirectories) {
  await cp(path.join(root, directory), path.join(output, directory), { recursive: true });
}

const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();

if (supabaseUrl && new URL(supabaseUrl).protocol !== 'https:') {
  throw new Error('SUPABASE_URL precisa usar HTTPS.');
}

const config = supabaseUrl && supabaseAnonKey
  ? { supabaseUrl, supabaseAnonKey }
  : { supabaseUrl: '', supabaseAnonKey: '' };

await writeFile(path.join(output, 'config.json'), `${JSON.stringify(config, null, 2)}\n`);
console.log('Build estático do Franlin Car Veículos gerado.');
