/**
 * Il digital twin dell'hero parte solo con una GPU vera.
 *
 * Senza accelerazione grafica il browser disegna WebGL con un rasterizzatore
 * software (SwiftShader in Chrome, llvmpipe su Linux, WARP su Windows): la
 * scena costa ~200ms di CPU a fotogramma e blocca la pagina. È la macchina di
 * PageSpeed Insights, ma anche una macchina virtuale, un desktop remoto o un
 * Chrome con l'accelerazione hardware spenta. Lì l'hero mostra il fermo della
 * stessa scena, e three.js non si scarica.
 *
 * `failIfMajorPerformanceCaveat` fa già rifiutare il contesto al browser; il
 * nome del renderer è la seconda rete, per i browser che non lo onorano.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rendererSoftware } from '../src/lib/grafica.ts';

describe('riconoscimento del rendering WebGL software', () => {
  for (const nome of [
    'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)',
    'Google SwiftShader',
    'llvmpipe (LLVM 15.0.7, 256 bits)',
    'Mesa softpipe',
    'ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Software Rasterizer',
  ]) {
    test(`software: ${nome}`, () => assert.equal(rendererSoftware(nome), true));
  }

  for (const nome of [
    'ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 (0x00001E89) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    'Apple GPU',
    'Apple M2',
    'Mali-G78',
    'Adreno (TM) 740',
  ]) {
    test(`GPU: ${nome}`, () => assert.equal(rendererSoftware(nome), false));
  }

  // Un nome che il browser non rivela non basta a spegnere la scena: decide
  // `failIfMajorPerformanceCaveat`.
  test('nome assente o vuoto: non è una prova di rendering software', () => {
    assert.equal(rendererSoftware(null), false);
    assert.equal(rendererSoftware(undefined), false);
    assert.equal(rendererSoftware(''), false);
  });
});
