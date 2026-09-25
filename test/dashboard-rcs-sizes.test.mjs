/**
 * La foto della dashboard RCS in home deve scaricare la variante più piccola
 * che basta a coprirla. Con `sizes="(min-width: 1024px) 46vw"` un desktop da
 * 1350px prendeva la 900 per mostrarla a 547px: PageSpeed Insights contava
 * 26 KiB sprecati. Qui, a densità 1, la variante scelta dal browser deve
 * essere la più piccola del srcset larga almeno quanto l'immagine a schermo.
 *
 * Parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright } from './helpers/dist-server.mjs';

describe('dashboard RCS: variante giusta per la larghezza', { skip: motivoSalto() }, () => {
  let server;
  let browser;

  before(async () => {
    server = await avviaServer();
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  for (const w of [360, 768, 1024, 1280, 1350, 1440, 1600, 1920, 2560]) {
    test(`${w}px`, async () => {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
      await page.goto(server.origin, { waitUntil: 'load' });
      const m = await page.evaluate(() => {
        const img = document.querySelector('.monitor img');
        const varianti = img.srcset.split(',').map((v) => {
          const [url, larghezza] = v.trim().split(/\s+/);
          return { url: new URL(url, location.href).href, w: parseInt(larghezza, 10) };
        });
        return { schermo: img.getBoundingClientRect().width, varianti, scelta: img.currentSrc };
      });
      await page.close();

      const scelta = m.varianti.find((v) => v.url === m.scelta);
      assert.ok(scelta, `variante scelta fuori dal srcset: ${m.scelta}`);
      const giusta = m.varianti
        .filter((v) => v.w >= m.schermo)
        .reduce((a, b) => (b.w < a.w ? b : a), { w: Infinity });
      assert.equal(
        scelta.w,
        giusta.w,
        `a schermo ${Math.round(m.schermo)}px: scaricata la ${scelta.w}, bastava la ${giusta.w}`,
      );
    });
  }
});
