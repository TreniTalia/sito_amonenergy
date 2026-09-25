/**
 * Il pannello /admin e i file dei progetti devono restare d'accordo.
 *
 * 1. CAMPI ALLINEATI ALLO SCHEMA. Il campo Potenza esisteva nello schema e in
 *    tutti i file ma non nel pannello: chi aggiungeva un progetto non poteva
 *    compilarlo. Qui l'elenco dei campi del pannello deve coincidere con
 *    quello dello schema, né uno in più (l'interruttore "full-bleed" che non
 *    faceva più niente) né uno in meno.
 *
 * 2. LIMITI DI LUNGHEZZA RISPETTATI. I `maxlength` del pannello sono tarati
 *    sullo spazio delle card dello slider. Un file che li supera si vede male
 *    e, peggio, il pannello si rifiuta di salvarlo finché qualcuno non lo
 *    accorcia: i contenuti in repository devono starci già dentro.
 *
 * 3. DESCRIZIONE COME CAMPO DI TESTO. Nel corpo markdown l'editor poteva
 *    mettere titoli ed elenchi che rompono la card: la descrizione vive nel
 *    frontmatter, e il corpo resta vuoto.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG = readFileSync(path.join(ROOT, 'public/admin/config.yml'), 'utf8');
const SCHEMA = readFileSync(path.join(ROOT, 'src/content.config.ts'), 'utf8');
const DIR = path.join(ROOT, 'src/content/progetti');

// Il blocco della collection progetti nel config: dalla sua riga `- name:`
// alla collection successiva. I campi sono mappe su una riga sola.
const bloccoProgetti = CONFIG.slice(CONFIG.indexOf('- name: "progetti"'), CONFIG.indexOf('- name: "servizi"'));
const campiPannello = [...bloccoProgetti.matchAll(/^\s+- \{ (.*) \}$/gm)].map(([, riga]) => ({
  name: riga.match(/name: "(\w+)"/)?.[1],
  widget: riga.match(/widget: "(\w+)"/)?.[1],
  maxlength: Number(riga.match(/maxlength: (\d+)/)?.[1] ?? Infinity),
  multiple: /multiple: true/.test(riga),
}));

// I campi dello schema zod della collection progetti.
const bloccoSchema = SCHEMA.slice(SCHEMA.indexOf('const progetti'), SCHEMA.indexOf('const servizi'));
const campiSchema = [...bloccoSchema.matchAll(/^\s+(\w+): (?:z\.|image\(|facoltativo\()/gm)].map(([, nome]) => nome);

// Valore YAML scalare su una riga. Il pannello scrive senza virgolette, e le
// aggiunge singole solo quando servono (es. '[DATO DA CONFERMARE]', dove un
// apice interno si raddoppia); i file scritti a mano usano le doppie. Le
// virgolette non contano nella lunghezza del testo.
const scalare = (v) => {
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replaceAll("''", "'");
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  return v;
};

// Frontmatter con valori scalari su una riga, come li scrive il pannello.
const leggi = (file) => {
  const testo = readFileSync(path.join(DIR, file), 'utf8');
  const [, fm, corpo] = testo.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const dati = Object.fromEntries(
    [...fm.matchAll(/^(\w+): (.*?)\s*$/gm)].map(([, k, v]) => [k, scalare(v)]),
  );
  return { dati, corpo: corpo.trim() };
};
const FILE = readdirSync(DIR).filter((f) => f.endsWith('.md'));

describe('pannello e contenuti dei progetti', () => {
  test('il pannello ha esattamente i campi dello schema', () => {
    const nomiPannello = campiPannello.map((c) => (c.name === 'body' ? 'descrizione' : c.name)).sort();
    assert.deepEqual(nomiPannello, [...campiSchema].sort());
  });

  test('la galleria si carica con un upload multiplo', () => {
    const galleria = campiPannello.find((c) => c.name === 'galleria');
    assert.ok(galleria, 'campo galleria assente dal pannello');
    assert.equal(galleria.widget, 'image');
    assert.ok(galleria.multiple, 'la galleria deve accettare più foto insieme');
  });

  test('la descrizione è un campo di testo con limite, non il corpo markdown', () => {
    assert.ok(!campiPannello.some((c) => c.name === 'body'), 'il corpo markdown è ancora nel pannello');
    for (const nome of ['descrizione', 'descrizioneEn']) {
      const campo = campiPannello.find((c) => c.name === nome);
      assert.equal(campo?.widget, 'text', `${nome} deve essere un campo text`);
      assert.ok(Number.isFinite(campo.maxlength), `${nome} senza maxlength`);
    }
    for (const f of FILE) assert.equal(leggi(f).corpo, '', `${f}: il corpo deve restare vuoto`);
  });

  test('ogni testo mostrato sulle card ha un limite di lunghezza', () => {
    for (const nome of ['titolo', 'titoloEn', 'descrizione', 'descrizioneEn', 'committente', 'tipologia', 'tipologiaEn', 'potenza', 'provincia', 'kv']) {
      const campo = campiPannello.find((c) => c.name === nome);
      assert.ok(Number.isFinite(campo?.maxlength), `${nome} senza maxlength`);
    }
  });

  for (const f of FILE) {
    test(`${f} rispetta i limiti del pannello`, () => {
      const { dati } = leggi(f);
      for (const campo of campiPannello) {
        const valore = dati[campo.name];
        if (valore === undefined || !Number.isFinite(campo.maxlength)) continue;
        assert.ok(
          valore.length <= campo.maxlength,
          `${campo.name} è lungo ${valore.length}, il limite è ${campo.maxlength}: "${valore}"`,
        );
      }
    });
  }
});
