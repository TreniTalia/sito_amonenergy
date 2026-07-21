import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [, , path = '/', ...rest] = process.argv;
const outDir = 'C:\\Users\\franc\\AppData\\Local\\Temp\\claude\\C--Users-franc-Desktop-apps-sito-amon\\ae748bee-e597-4977-845f-5e96970704a9\\scratchpad\\screenshots';
mkdirSync(outDir, { recursive: true });

const viewports = {
  360: { width: 360, height: 740 },
  390: { width: 390, height: 844 },
  768: { width: 768, height: 1024 },
  1024: { width: 1024, height: 768 },
  1440: { width: 1440, height: 900 },
};

const widths = rest.length ? rest.map(Number) : [360, 768, 1024, 1440];

const browser = await chromium.launch();
for (const w of widths) {
  const vp = viewports[w] ?? { width: w, height: 900 };
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`http://localhost:4321${path}`, { waitUntil: 'networkidle' });
  const slug = path.replace(/\//g, '_') || 'home';
  const file = `${outDir}\\${slug}_${w}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
  await page.close();
}
await browser.close();
