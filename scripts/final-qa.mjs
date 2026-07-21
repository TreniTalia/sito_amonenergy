import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, ext) {
  let files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full, ext));
    else if (entry.name.endsWith(ext)) files.push(full);
  }
  return files;
}

const htmlFiles = walk('dist', '.html');
let forms = 0;
let telLinks = 0;
let mailtoLinks = 0;

for (const f of htmlFiles) {
  const c = readFileSync(f, 'utf-8');
  forms += (c.match(/<form/g) || []).length;
  telLinks += (c.match(/href="tel:/g) || []).length;
  mailtoLinks += (c.match(/href="mailto:/g) || []).length;
}

console.log(`HTML pages: ${htmlFiles.length}`);
console.log(`<form> elements total: ${forms}`);
console.log(`tel: links total: ${telLinks}`);
console.log(`mailto: links total: ${mailtoLinks}`);

const jsFiles = walk('dist/_astro', '.js');
const jsTotal = jsFiles.reduce((sum, f) => sum + statSync(f).size, 0);
console.log(`Separate .js chunk files: ${jsFiles.length}, total: ${(jsTotal / 1024).toFixed(2)} KB`);

let inlineTotal = 0;
for (const f of htmlFiles) {
  const c = readFileSync(f, 'utf-8');
  const scripts = [...c.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  for (const [, attrs, body] of scripts) {
    if (attrs.includes('application/ld+json') || !body.trim()) continue;
    inlineTotal += Buffer.byteLength(body, 'utf-8');
  }
}
console.log(`Inline JS across all pages (sum, not deduped): ${(inlineTotal / 1024).toFixed(2)} KB`);

const homeSize = statSync('dist/index.html').size;
console.log(`Home page HTML size: ${(homeSize / 1024).toFixed(2)} KB`);
