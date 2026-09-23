/**
 * Regressione di layout e di fondale dell'hero su viewport reali.
 *
 * 1. OCCHIELLO SOTTO LA NAVBAR. L'header è `fixed`: non sta nel flusso e non
 *    spinge nulla. Il padding superiore dell'hero valeva `pt-16` (64px) contro
 *    un'isola alta 78px, così su schermi bassi — dove la colonna di testo cresce
 *    e smette di stare centrata — l'occhiello scivolava dietro al vetro.
 *
 * 2. UN SOLO FONDALE PER FASCIA. Sotto l'hero non deve mai restare scoperto
 *    il navy pieno della sezione. Da 768px in su il fondale è il digital twin
 *    in WebGL; sotto, su richiesta esplicita del cliente, è una foto reale
 *    (posa lunga su un parco eolico) su `.hero-photo::before`, e il canvas —
 *    che lì non ha nemmeno contesto GL — resta `display:none`. Restano
 *    vietati a ogni larghezza i vecchi fondali (video/picture/img) mai
 *    sostituiti in modo pulito, che tornavano a affacciarsi ogni volta che il
 *    fondale "giusto" della fascia non stava dipingendo.
 *
 * 3. WEBGL SOLO DA 768px IN SU. Sotto quella soglia `three` (~700KB) non si
 *    scarica affatto: il canvas resta nel DOM ma nascosto e senza contesto
 *    GL, e il fondale è la foto CSS. Da 768px in su il digital twin gira come
 *    sempre, `is-ready` compreso, anche con `prefers-reduced-motion`.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è, perche' `npm
 * test` deve restare eseguibile senza una build.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright } from './helpers/dist-server.mjs';

const skip = motivoSalto();

describe('layout dell’hero su viewport reali', { skip }, () => {
  let server;
  let browser;
  let origin;

  before(async () => {
    // Il media element chiede byte-range: senza `accept-ranges` alcuni
    // browser rifiutano di partire, e il test misurerebbe il server, non la
    // pagina.
    server = await avviaServer({ acceptRanges: true });
    origin = server.origin;
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  /** Apre la home a una viewport data e restituisce le misure che ci interessano. */
  const load = async (width, height, { reducedMotion = 'no-preference' } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, reducedMotion });
    const page = await ctx.newPage();
    let videoBytes = 0;
    let videoRequests = 0;
    let threeRequests = 0;
    page.on('request', (q) => {
      if (/\.(mp4|webm)(\?|$)/.test(q.url())) videoRequests++;
      if (/three\.module/.test(q.url())) threeRequests++;
    });
    page.on('response', async (r) => {
      if (!/\.(mp4|webm)(\?|$)/.test(r.url())) return;
      try {
        videoBytes += (await r.body()).length;
      } catch {
        /* risposta annullata: i byte non sono arrivati */
      }
    });
    await page.goto(origin, { waitUntil: 'load' });
    // Il canvas si monta dopo il primo paint e sfuma in 0.5s.
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const wrap = document.querySelector('.ds-header-wrap');
      const eyebrow = document.querySelector('.hero .ds-eyebrow');
      const twin = document.querySelector('.hero .hero-twin');
      const photo = document.querySelector('.hero .hero-photo');
      return {
        headerBottom: wrap.getBoundingClientRect().bottom,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        heroBg: getComputedStyle(hero).backgroundColor,
        legacyBackdrops: hero.querySelectorAll('video, .hero-media, picture, img').length,
        twinPresent: Boolean(twin),
        twinDisplay: twin ? getComputedStyle(twin).display : 'assente',
        twinReady: twin ? twin.classList.contains('is-ready') : false,
        twinWidth: twin ? Math.round(twin.getBoundingClientRect().width) : 0,
        photoPresent: Boolean(photo),
        photoDisplay: photo ? getComputedStyle(photo).display : 'assente',
        photoWidth: photo ? Math.round(photo.getBoundingClientRect().width) : 0,
        photoBeforeBg: photo ? getComputedStyle(photo, '::before').backgroundImage : 'none',
      };
    });
    await ctx.close();
    return { ...m, videoBytes, videoRequests, threeRequests, clearance: m.eyebrowTop - m.headerBottom };
  };

  // navy-950 (#0A2A44): è il fondo pieno della sezione ed è lo stesso colore con
  // cui il canvas pulisce, così nel frame prima che dipinga non c'è stacco.
  const NAVY_950 = 'rgb(10, 42, 68)';

  /** Le verifiche sul fondale che valgono identiche a ogni larghezza: mai il
   *  navy nudo della sezione, mai i vecchi fondali mai ripuliti. Quale dei
   *  due fondali "giusti" (canvas o foto) debba coprirlo è specifico della
   *  fascia, e lo verificano assertMobileBackdrop/assertDesktopBackdrop. */
  const assertBackdrop = (m) => {
    assert.equal(
      m.legacyBackdrops,
      0,
      `nell'hero è tornato un fondale che non è né il digital twin né la foto (${m.legacyBackdrops} fra video/picture/img)`,
    );
    assert.ok(m.twinPresent, 'manca il canvas del digital twin nel DOM');
    assert.ok(m.photoPresent, 'manca .hero-photo, il fondale fotografico sotto 768px');
    assert.equal(m.heroBg, NAVY_950, 'l’hero non ha il fondo navy pieno sotto al fondale attivo');
    assert.equal(m.videoBytes, 0, `scaricato un video di fondo (${m.videoBytes} byte in ${m.videoRequests} richieste)`);
  };

  /** Sotto 768px: niente WebGL, il canvas resta nascosto di proposito e il
   *  fondale è la foto su .hero-photo::before. */
  const assertMobileBackdrop = (m, width) => {
    assertBackdrop(m);
    assert.equal(m.threeRequests, 0, `three.js scaricato sotto 768px (${m.threeRequests} richieste)`);
    assert.equal(m.twinReady, false, 'il canvas ha dipinto un frame WebGL: sotto 768px non dovrebbe montare three.js');
    assert.equal(
      m.twinDisplay,
      'none',
      'il canvas del digital twin è visibile sotto 768px: dovrebbe restare display:none, coperto dalla foto',
    );
    assert.equal(m.photoDisplay, 'block', 'sotto 768px .hero-photo dovrebbe essere il fondale visibile ma non lo è');
    assert.ok(
      Math.abs(m.photoWidth - width) <= 1,
      `la foto non copre la larghezza dell’hero (${m.photoWidth}px su ${width}px)`,
    );
    assert.notEqual(
      m.photoBeforeBg,
      'none',
      'manca il fermo-immagine CSS della foto (.hero-photo::before) sotto 768px: sotto resterebbe scoperto il fondo della sezione',
    );
  };

  /** Da 768px in su: il digital twin gira in WebGL come sempre, la foto resta nascosta. */
  const assertDesktopBackdrop = (m, width) => {
    assertBackdrop(m);
    assert.ok(m.twinReady, 'il canvas non ha dipinto nemmeno un frame');
    assert.notEqual(m.twinDisplay, 'none', 'il canvas è nascosto: da 768px in su resterebbe scoperto il fondo della sezione');
    assert.ok(
      Math.abs(m.twinWidth - width) <= 1,
      `il canvas non copre la larghezza dell’hero (${m.twinWidth}px su ${width}px)`,
    );
    assert.equal(
      m.photoDisplay,
      'none',
      'da 768px in su .hero-photo dovrebbe restare nascosta, ma è visibile sopra al digital twin',
    );
  };

  // Il caso peggiore e' lo schermo *basso*, non stretto: e' l'altezza che fa
  // crescere la colonna oltre lo spazio centrabile e mette in gioco il padding.
  const PHONES = [
    [320, 568],
    [360, 640],
    [360, 740],
    [375, 667],
    [390, 844],
    [430, 932],
    [767, 700],
  ];

  for (const [w, h] of PHONES) {
    test(`${w}x${h}: l’occhiello resta libero e il fondale è la foto, con il canvas nascosto`, async () => {
      const m = await load(w, h);
      assert.ok(
        m.clearance > 0,
        `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px: il padding dell’hero non copre l’isola fissa (${m.headerBottom.toFixed(1)}px)`,
      );
      assertMobileBackdrop(m, w);
    });
  }

  // Il digital twin non è un video: gira in WebGL da 768px in su, senza gating.
  for (const [w, h] of [
    [768, 800],
    [844, 390], // landscape corto: qui l'isola cresce a ~104px
    [1280, 900],
    [1920, 1080],
  ]) {
    test(`${w}x${h}: il digital twin dipinge e l’occhiello resta libero`, async () => {
      const m = await load(w, h);
      assertDesktopBackdrop(m, w);
      assert.ok(m.clearance > 0, `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px`);
    });
  }

  // È il caso che prima scopriva il fondale: il canvas veniva nascosto e sotto
  // riemergeva il vecchio pattern. Ora resta al suo posto e dipinge un fermo.
  test('con prefers-reduced-motion il canvas resta e dipinge un fotogramma fermo', async () => {
    const m = await load(1280, 900, { reducedMotion: 'reduce' });
    assertDesktopBackdrop(m, 1280);
  });
});
