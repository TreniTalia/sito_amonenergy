/**
 * Regressione di layout delle nove pagine tecniche di dettaglio, su viewport
 * reali: fasce di fondo alternate (nessuna coppia adiacente uguale), celle di
 * ParamGrid alte uguali riga per riga, FAQ affiancata al blocco di
 * introduzione, box "Verifiche collegate" uniformi (le stesse ServiceCard
 * della griglia Servizi, non più il box bianco `.correlato`) e pre-footer
 * classico (la stessa `CtaBand` della home, con fotografia).
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright, senzaMedia } from './helpers/dist-server.mjs';

const skip = motivoSalto('servizi/index.html');

const { ROTTE } = await import('../src/i18n/routes.ts');

// Le nove pagine tecniche sono le rotte `/servizi/<slug>/` di ROTTE, esclusa
// la sola hub `/servizi/` (v. lo stesso filtro in test/tech-pages.test.mjs).
const TECH_ROUTES = ROTTE.filter((r) => r.it.startsWith('/servizi/') && r.it !== '/servizi/');

const PAGINE = TECH_ROUTES.flatMap((r) => [r.it.replace(/^\//, ''), r.en.replace(/^\//, '')]);

describe('layout delle pagine tecniche di dettaglio', { skip }, () => {
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

  const misura = async (url, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await senzaMedia(page);
    await page.goto(origin + url, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const main = document.querySelector('main');
      const sezioni = [...main.querySelectorAll(':scope > section, :scope > div > section')];
      const fondo = (s) => getComputedStyle(s).backgroundColor;
      const righe = new Map();
      for (const c of document.querySelectorAll('.param-grid__item')) {
        const r = c.getBoundingClientRect();
        const k = Math.round(r.top);
        righe.set(k, [...(righe.get(k) ?? []), Math.round(r.height)]);
      }
      const faq = document.querySelector('.tech-faq');
      const faqIntro = document.querySelector('[data-faq-intro]');
      return {
        fondi: sezioni.map(fondo),
        paramRighe: [...righe.values()],
        faqAffiancata: faq && faqIntro ? faq.getBoundingClientRect().left > faqIntro.getBoundingClientRect().right : false,
        ctaBand: Boolean(document.querySelector('.cta-band')),
        correlatiCard: document.querySelectorAll('[data-correlati] .ds-card-service').length,
        correlatiBianchi: document.querySelectorAll('.correlato').length,
      };
    });
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of [1024, 1440]) {
      test(`${pagina} a ${width}px: fasce alternate, parametri allineati, FAQ affiancata, box uniformi, CTA classica`, async () => {
        const m = await misura(pagina, width);

        // Nessuna coppia di fasce adiacenti con lo stesso fondo, escluse la
        // cover (prima) e il pre-footer (ultima), che portano una fotografia
        // e non un colore piatto.
        const centrali = m.fondi.slice(1, -1);
        for (let i = 0; i < centrali.length - 1; i++) {
          assert.notEqual(centrali[i], centrali[i + 1], `fondi uguali adiacenti in ${pagina}: ${centrali.join(' | ')}`);
        }

        for (const riga of m.paramRighe) {
          assert.ok(Math.max(...riga) - Math.min(...riga) <= 1, `${pagina}: riga di ParamGrid non allineata (${riga.join(', ')})`);
        }

        assert.equal(m.faqAffiancata, true, `${pagina}: FAQ non affiancata all'introduzione a ${width}px`);
        assert.equal(m.ctaBand, true, `${pagina}: manca il pre-footer classico (.cta-band)`);
        assert.equal(m.correlatiBianchi, 0, `${pagina}: restano box .correlato bianchi`);
        assert.ok(m.correlatiCard >= 2, `${pagina}: attese almeno due card correlate, trovate ${m.correlatiCard}`);
      });
    }
  }
});
