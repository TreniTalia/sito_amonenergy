/**
 * Le foto di un progetto: la cover e la galleria caricate dal pannello
 * diventano una sola sequenza, quella che il lightbox scorre.
 *
 * - la cover viene sempre prima;
 * - una foto caricata sia come cover sia nella galleria compare una volta;
 * - senza cover fa da cover la prima foto della galleria;
 * - il testo alternativo della cover è quello scritto a mano, le altre foto
 *   ne ricevono uno automatico ("<titolo>, foto 2 di 5").
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fotoProgetto } from '../src/lib/progetti.ts';

// Basta la forma che la funzione legge: `src` identifica il file.
const img = (nome) => ({ src: `/_astro/${nome}.jpg`, width: 2000, height: 1500, format: 'jpg' });
const COVER = img('cover');
const A = img('a');
const B = img('b');

const testi = { titolo: 'Stazione elettrica Troia', altCopertina: 'Vista d’insieme della stazione' };

describe('fotoProgetto', () => {
  test('nessuna foto: sequenza vuota', () => {
    assert.deepEqual(fotoProgetto({}, testi), []);
    assert.deepEqual(fotoProgetto({ galleria: [] }, testi), []);
  });

  test('solo cover: una foto col testo alternativo scritto a mano', () => {
    assert.deepEqual(fotoProgetto({ immagine: COVER }, testi), [{ src: COVER, alt: testi.altCopertina }]);
  });

  test('cover e galleria: la cover per prima, poi la galleria nell’ordine del pannello', () => {
    const foto = fotoProgetto({ immagine: COVER, galleria: [A, B] }, testi);
    assert.deepEqual(
      foto.map((f) => f.src),
      [COVER, A, B],
    );
    assert.equal(foto[0].alt, testi.altCopertina);
    assert.equal(foto[1].alt, 'Stazione elettrica Troia, foto 2 di 3');
    assert.equal(foto[2].alt, 'Stazione elettrica Troia, foto 3 di 3');
  });

  test('la cover ripetuta nella galleria compare una volta sola', () => {
    const foto = fotoProgetto({ immagine: COVER, galleria: [A, img('cover'), B] }, testi);
    assert.deepEqual(
      foto.map((f) => f.src.src),
      ['/_astro/cover.jpg', '/_astro/a.jpg', '/_astro/b.jpg'],
    );
    assert.equal(foto[2].alt, 'Stazione elettrica Troia, foto 3 di 3');
  });

  test('senza cover la prima foto della galleria fa da cover, con testo automatico', () => {
    const foto = fotoProgetto({ galleria: [A, B] }, testi);
    assert.deepEqual(
      foto.map((f) => f.src),
      [A, B],
    );
    assert.equal(foto[0].alt, 'Stazione elettrica Troia, foto 1 di 2');
  });

  test('in inglese il testo automatico è inglese', () => {
    const foto = fotoProgetto({ immagine: COVER, galleria: [A] }, { ...testi, titolo: 'Troia substation', lingua: 'en' });
    assert.equal(foto[1].alt, 'Troia substation, photo 2 of 2');
  });
});
