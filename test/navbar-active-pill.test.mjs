/**
 * Pill di vetro dell'indicatore di pagina attiva nella navbar desktop.
 *
 * La pill non ha una posizione fissa in CSS: uno script la misura sul link
 * `aria-current="page"` e la sposta lì (le etichette non sono larghe
 * uguali). Il test verifica che, per ciascuna pagina, il link giusto porti
 * `aria-current="page"` e che la pill combaci davvero con la sua geometria
 * — non solo che lo script sia partito senza errori.
 *
 * Parte da `dist` già costruito, come gli altri test Playwright del repo.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright } from './helpers/dist-server.mjs';

const skip = motivoSalto();

describe('pill attiva della navbar desktop', { skip }, () => {
  let server;
  let browser;
  let origin;

  before(async () => {
    server = await avviaServer();
    origin = server.origin;
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  const PAGES = [
    ['', 'Home'],
    ['azienda/', 'Azienda'],
    ['servizi/', 'Servizi'],
    ['lavori/', 'Lavori'],
    ['contatti/', 'Contatti'],
  ];

  for (const [slug, label] of PAGES) {
    test(`/${slug}: "${label}" è aria-current e la pill combacia`, async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${origin}${slug}`, { waitUntil: 'load' });

      const active = page.locator('.ds-nav-link[aria-current="page"]');
      await assert.doesNotReject(active.waitFor({ state: 'visible', timeout: 2000 }));
      await assert.doesNotReject(async () => {
        const text = (await active.textContent())?.trim();
        assert.equal(text, label, `il link "aria-current" è "${text}", atteso "${label}"`);
      });

      const geo = await page.evaluate(() => {
        const nav = document.querySelector('.ds-nav');
        const pill = document.querySelector('.ds-nav-pill');
        const link = document.querySelector('.ds-nav-link[aria-current="page"]');
        const navRect = nav.getBoundingClientRect();
        const pillRect = pill.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        return {
          opacity: getComputedStyle(pill).opacity,
          pillLeft: pillRect.left - navRect.left,
          pillWidth: pillRect.width,
          linkLeft: linkRect.left - navRect.left,
          linkWidth: linkRect.width,
        };
      });

      assert.equal(geo.opacity, '1', 'la pill è invisibile (opacity != 1)');
      assert.ok(
        Math.abs(geo.pillLeft - geo.linkLeft) < 1,
        `pill disallineata: left=${geo.pillLeft.toFixed(1)} vs link left=${geo.linkLeft.toFixed(1)}`,
      );
      assert.ok(
        Math.abs(geo.pillWidth - geo.linkWidth) < 1,
        `larghezza pill errata: pill=${geo.pillWidth.toFixed(1)} vs link=${geo.linkWidth.toFixed(1)}`,
      );

      await ctx.close();
    });
  }
});
