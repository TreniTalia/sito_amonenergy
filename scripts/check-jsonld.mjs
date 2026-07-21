import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const htmlFiles = walk('dist').filter((f) => !f.includes('\\admin\\'));
let totalBlocks = 0;
let errors = 0;

for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');
  const matches = [...content.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  for (const m of matches) {
    totalBlocks++;
    try {
      const obj = JSON.parse(m[1]);
      if (!obj['@context'] || !obj['@type']) {
        console.log(`MISSING @context/@type in ${file}`);
        errors++;
      }
    } catch (e) {
      console.log(`INVALID JSON in ${file}:`, e.message);
      errors++;
    }
  }
}

console.log(`${htmlFiles.length} HTML files scanned, ${totalBlocks} JSON-LD blocks, ${errors} errors`);
