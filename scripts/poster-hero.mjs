/**
 * Rigenera il fermo del digital twin: la foto della scena che l'hero mostra
 * da 768px in su quando il browser non ha una GPU (vedi src/lib/grafica.ts).
 * Va rifatto ogni volta che la scena in HeroTwin.astro cambia aspetto, se no
 * il fermo racconta una scena che non c'è più.
 *
 *   npm run build && node scripts/poster-hero.mjs
 *
 * Fotografa il solo canvas, senza velo, testo, header né banner dei cookie:
 * quelli la pagina li disegna sopra al fermo come sopra al canvas.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { avviaServer, motivoSalto, playwright } from '../test/helpers/dist-server.mjs';
import { simulaGpu } from '../test/helpers/gpu-simulata.mjs';

const motivo = motivoSalto();
if (motivo) throw new Error(motivo);

// 16:9 a 1920: la fascia di proporzioni in cui la camera della scena ha la
// sua inquadratura piena, con il campo fotovoltaico (che compare da 1200px).
const LARGHEZZA = 1920;
const ALTEZZA = 1080;
const DESTINAZIONE = fileURLToPath(new URL('../src/assets/img/photos/hero-desktop-twin', import.meta.url));

const server = await avviaServer();
const browser = await playwright.chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: LARGHEZZA, height: ALTEZZA }, deviceScaleFactor: 1 });
  await ctx.addInitScript(simulaGpu);
  const page = await ctx.newPage();
  await page.goto(server.origin, { waitUntil: 'load' });
  await page.addStyleTag({
    content: '.hero-scrim, .hero-depart, .ds-header-wrap, #cookie-consent { visibility: hidden !important; }',
  });
  await page.waitForSelector('.hero-twin.is-ready');
  // Dissolvenza d'ingresso (0.5s) finita e qualche fotogramma in più: in
  // SwiftShader ognuno costa ~200ms.
  await page.waitForTimeout(3000);
  const png = await page.locator('.hero-twin').screenshot();

  const avif = await sharp(png).avif({ quality: 55, effort: 9 }).toFile(`${DESTINAZIONE}.avif`);
  const webp = await sharp(png).webp({ quality: 80, effort: 6 }).toFile(`${DESTINAZIONE}.webp`);
  console.log(`avif ${avif.width}x${avif.height} ${avif.size} byte`);
  console.log(`webp ${webp.width}x${webp.height} ${webp.size} byte`);
} finally {
  await browser.close();
  await server.close();
}
