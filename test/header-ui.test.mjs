/**
 * Selettore di lingua (globo) e pulsante "torna su", su viewport reali.
 *
 * 1. GLOBO. Da 768px in su sta nella navbar: al clic apre Italiano/English,
 *    con la lingua corrente segnata (`aria-current`) e link alla pagina
 *    gemella; Esc lo chiude e rimette il focus sul globo. Sotto 768px non c'è
 *    nella navbar: vive nel menu a scomparsa, come riga che si apre sul posto.
 * 2. TORNA SU. Solo da 1024px in su: nascosto finché la pagina è in cima,
 *    compare dopo lo scorrimento, e al clic riporta in cima. Su telefono e
 *    tablet non esiste.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright, senzaMedia } from './helpers/dist-server.mjs';

const skip = motivoSalto('servizi/index.html');

describe('globo della lingua e torna su', { skip }, () => {
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

  const apri = async (pagina, width, height = 900) => {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    await senzaMedia(page);
    await page.goto(server.origin + pagina, { waitUntil: 'load' });
    await page.addStyleTag({ content: '#cookie-consent{display:none!important}' });
    return page;
  };

  for (const [pagina, attese] of [
    ['servizi/', { corrente: 'Italiano', it: '/servizi/', en: '/en/services/' }],
    ['en/services/', { corrente: 'English', it: '/servizi/', en: '/en/services/' }],
  ]) {
    test(`${pagina} a 1440px: il globo apre le due lingue e Esc lo chiude`, async () => {
      const page = await apri(pagina, 1440);
      const globo = page.locator('.lang-globe');
      assert.ok(await globo.isVisible(), 'il globo non è visibile nella navbar');
      assert.ok(await page.locator('#lang-list-desktop').isHidden(), 'la scelta è aperta prima del clic');
      await globo.click();
      const voci = await page
        .locator('#lang-list-desktop a')
        .evaluateAll((a) => a.map((x) => ({ nome: x.textContent.trim(), href: x.getAttribute('href'), corrente: x.getAttribute('aria-current') })));
      assert.deepEqual(
        voci.map((v) => [v.nome, v.href]),
        [
          ['Italiano', attese.it],
          ['English', attese.en],
        ],
      );
      assert.deepEqual(voci.filter((v) => v.corrente === 'true').map((v) => v.nome), [attese.corrente]);
      assert.equal(await globo.getAttribute('aria-expanded'), 'true');
      await page.keyboard.press('Escape');
      assert.ok(await page.locator('#lang-list-desktop').isHidden(), 'Esc non chiude la scelta');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('lang-globe')), true, 'il focus non torna sul globo');
      await page.close();
    });
  }

  test('a 390px il globo non è nella navbar ma nel menu a scomparsa', async () => {
    const page = await apri('servizi/', 390, 844);
    assert.ok(await page.locator('.lang-globe').isHidden(), 'il globo compare nella navbar su telefono');
    await page.click('#nav-toggle');
    const riga = page.locator('.lang-row');
    await riga.click();
    assert.equal(await riga.getAttribute('aria-expanded'), 'true');
    const nomi = await page.locator('#lang-list-mobile a').allTextContents();
    assert.deepEqual(nomi.map((n) => n.trim()), ['Italiano', 'English']);
    await page.close();
  });

  for (const width of [390, 768]) {
    test(`a ${width}px il pulsante torna su non c'è`, async () => {
      const page = await apri('servizi/', width);
      await page.evaluate(() => window.scrollTo(0, 3000));
      await page.waitForTimeout(200);
      assert.ok(await page.locator('.back-to-top').isHidden());
      await page.close();
    });
  }

  // La navbar deve contenere logo, voci, globo, CTA e hamburger a ogni
  // larghezza: fra 768 e 1048px (in inglese le voci sono più larghe) il CTA
  // usciva dall'isola, e a 320px l'hamburger usciva dallo schermo.
  test('la navbar contiene tutti i suoi elementi da 320 a 1400px, IT ed EN', async () => {
    const fuori = [];
    for (const pagina of ['servizi/', 'en/services/power-transformer-testing/']) {
      for (const width of [320, 360, 390, 430, 768, 784, 800, 820, 848, 900, 1024, 1048, 1180, 1280, 1400]) {
        const page = await apri(pagina, width, 700);
        const r = await page.evaluate(() => {
          const nb = document.querySelector('.ds-navbar').getBoundingClientRect();
          return ['.ds-navbar > a', '.ds-nav', '.lang-globe', '.ds-header-cta', '#nav-toggle']
            .map((s) => [s, document.querySelector(s)?.getBoundingClientRect()])
            .filter(([, r]) => r && r.width && (r.left < nb.left + 1 || r.right > nb.right - 1))
            .map(([s, r]) => `${s} ${Math.round(r.left)}..${Math.round(r.right)} fuori da ${Math.round(nb.left)}..${Math.round(nb.right)}`);
        });
        if (r.length) fuori.push(`${pagina} a ${width}px: ${r.join('; ')}`);
        await page.close();
      }
    }
    assert.deepEqual(fuori, []);
  });

  test('a 360px i valori dei pannelli strumentazione restano dentro il pannello', async () => {
    const fuori = [];
    for (const pagina of ['servizi/sfra/', 'en/services/power-transformer-testing/', 'en/services/partial-discharge-measurement/']) {
      const page = await apri(pagina, 360, 800);
      const r = await page.evaluate(() =>
        [...document.querySelectorAll('.spec-panel__value')]
          .filter((d) => d.getBoundingClientRect().right > d.closest('.spec-panel').getBoundingClientRect().right - 8)
          .map((d) => d.textContent.trim()),
      );
      if (r.length) fuori.push(`${pagina}: ${r.join(', ')}`);
      await page.close();
    }
    assert.deepEqual(fuori, []);
  });

  test('a 1440px torna su compare dopo lo scorrimento e riporta in cima', async () => {
    const page = await apri('servizi/', 1440);
    const btn = page.locator('.back-to-top');
    assert.equal(await btn.evaluate((b) => b.classList.contains('is-visible')), false, 'visibile già in cima');
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForFunction(() => document.querySelector('.back-to-top')?.classList.contains('is-visible'));
    await btn.click();
    await page.waitForFunction(() => window.scrollY === 0);
    await page.close();
  });
});
