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
