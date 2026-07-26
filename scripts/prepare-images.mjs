/**
 * One-off image preparation for the assets dropped in info_utili/foto_utili.
 *
 * Two jobs:
 *  1. RCS platform screenshots — blur out the signed-in account, then soften the
 *     outer edges so the UI melts into the panel it sits in rather than reading
 *     as a rectangle pasted on top. Client and plant names are published as-is,
 *     by the brand owner's decision.
 *  2. Stock photography — downscale to a sane source size and convert to webp,
 *     so the repo does not carry 3 MB originals Astro would only shrink anyway.
 *
 * Redaction rectangles are in *fractions* of the source image, so they survive
 * any later re-export at a different resolution.
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SRC = 'info_utili/foto_utili';
const OUT_RCS = 'src/assets/img/rcs';
const OUT_PHOTO = 'src/assets/img/photos';
mkdirSync(OUT_RCS, { recursive: true });
mkdirSync(OUT_PHOTO, { recursive: true });

/**
 * Border mask for `dest-in`, which reads the *alpha* channel, not luminance:
 * opaque in a band along each edge, fully transparent through the middle. The
 * four bands overlap at the corners, which is what gives the natural vignette.
 */
function edgeMaskSvg(w, h, fx, fy) {
  const fw = Math.round(w * fx);
  const fh = Math.round(h * fy);
  const grad = (id, x1, y1, x2, y2) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
       <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
       <stop offset="45%" stop-color="#fff" stop-opacity="0.45"/>
       <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
     </linearGradient>`;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        ${grad('l', '0%', '0', '100%', '0')}
        ${grad('r', '100%', '0', '0%', '0')}
        ${grad('t', '0', '0%', '0', '100%')}
        ${grad('b', '0', '100%', '0', '0%')}
      </defs>
      <rect x="0" y="0" width="${fw}" height="${h}" fill="url(#l)"/>
      <rect x="${w - fw}" y="0" width="${fw}" height="${h}" fill="url(#r)"/>
      <rect x="0" y="0" width="${w}" height="${fh}" fill="url(#t)"/>
      <rect x="0" y="${h - fh}" width="${w}" height="${fh}" fill="url(#b)"/>
    </svg>`,
  );
}

/**
 * @param {object} o
 * @param {string} o.input
 * @param {string} o.output
 * @param {[number,number,number,number]} [o.crop]  fractional l,t,w,h of source
 * @param {Array<[number,number,number,number]>} [o.redact] fractional rects, post-crop
 * @param {number} o.width  output width
 * @param {number} [o.edge] edge-blur radius, 0 disables
 */
async function screenshot({ input, output, crop, redact = [], width, edge = 11 }) {
  let img = sharp(input);
  const meta = await img.metadata();

  if (crop) {
    const [l, t, w, h] = crop;
    img = img.extract({
      left: Math.round(meta.width * l),
      top: Math.round(meta.height * t),
      width: Math.round(meta.width * w),
      height: Math.round(meta.height * h),
    });
  }

  let buf = await img.resize({ width, fit: 'inside' }).png().toBuffer();
  let { width: W, height: H } = await sharp(buf).metadata();

  // --- redaction: lift each rect, blur it past legibility, drop it back
  for (const [l, t, w, h] of redact) {
    const r = {
      left: Math.max(0, Math.round(W * l)),
      top: Math.max(0, Math.round(H * t)),
      width: Math.min(W, Math.round(W * w)),
      height: Math.min(H, Math.round(H * h)),
    };
    // Scaled to the rect, so a small target gets a tight blur instead of a
    // smeared blob: enough to make the text unrecoverable, no more.
    const patch = await sharp(buf)
      .extract(r)
      .blur(Math.max(5, Math.min(14, r.height * 0.25)))
      .toBuffer();
    buf = await sharp(buf)
      .composite([{ input: patch, left: r.left, top: r.top }])
      .png()
      .toBuffer();
  }

  // --- progressive edge blur: a blurred copy masked to the border band
  if (edge > 0) {
    const soft = await sharp(buf).blur(edge).ensureAlpha().toBuffer();
    const mask = await sharp(edgeMaskSvg(W, H, 0.07, 0.1)).png().toBuffer();
    const softEdges = await sharp(soft)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    buf = await sharp(buf).composite([{ input: softEdges, blend: 'over' }]).png().toBuffer();
  }

  await sharp(buf).webp({ quality: 88 }).toFile(output);
  const out = await sharp(output).metadata();
  console.log(`  ${path.basename(output)}  ${out.width}x${out.height}`);
}

async function photo({ input, output, width = 2400, quality = 80 }) {
  await sharp(input).resize({ width, fit: 'inside', withoutEnlargement: true }).webp({ quality }).toFile(output);
  const m = await sharp(output).metadata();
  console.log(`  ${path.basename(output)}  ${m.width}x${m.height}`);
}

console.log('RCS screenshots:');
await screenshot({
  input: `${SRC}/home/rcs-index.png`,
  output: `${OUT_RCS}/rcs-lista-impianti.webp`,
  // drop the empty right third: the table is what carries the proof
  crop: [0, 0, 0.73, 1],
  redact: [
    [0.004, 0.883, 0.107, 0.042], // signed-in user in the sidebar
  ],
  width: 1900,
});
await screenshot({
  input: `${SRC}/home/detail-rcs.png`,
  output: `${OUT_RCS}/rcs-dettaglio-impianto.webp`,
  redact: [
    [0.004, 0.883, 0.107, 0.042], // signed-in user in the sidebar
  ],
  width: 1700,
});

console.log('Map:');
await photo({ input: `${SRC}/home/location.png`, output: `${OUT_PHOTO}/coverage-map.webp`, width: 2000, quality: 84 });

console.log('Stock:');
// Only what the site actually imports gets emitted — an unused source image in
// src/assets is dead weight in the repo. The rest of info_utili/foto_utili stays
// a library: add a line here when a slot for one of them exists.
//   american-…-VuR4oHZ3ucc → trasformatore di potenza in sottostazione
//   american-…-Zy1mDOLhUB4 → isolatori e sezionatori AT
//   jason-mavrommatis       → eolico di crinale al tramonto
//   karsten-wurth           → parco eolico su campi coltivati
//   raymond-sime            → quadro di controllo con PLC Siemens
const stock = [['matthew-henry-yETqkLnhsUI-unsplash.jpg', 'tralicci-tramonto-linee.webp']];
for (const [from, to] of stock) {
  await photo({ input: `${SRC}/immagini stock/${from}`, output: `${OUT_PHOTO}/${to}` });
}
