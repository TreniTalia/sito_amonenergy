// Il digital twin dell'hero vale la pena solo su una GPU vera. Senza
// accelerazione il browser disegna WebGL con un rasterizzatore software, e la
// scena costa ~200ms di CPU a fotogramma, sessanta volte al secondo: sulla
// macchina di PageSpeed Insights, che non ha GPU, faceva 10,7s di Total
// Blocking Time. Lo stesso capita a una macchina virtuale, a un desktop
// remoto o a un Chrome con l'accelerazione hardware spenta.

// Rasterizzatori software per nome: SwiftShader (Chrome), llvmpipe e
// softpipe (Mesa, Linux), Microsoft Basic Render Driver (WARP, Windows).
const SOFTWARE = /swiftshader|llvmpipe|softpipe|basic render driver|software/i;

/** true se il nome del renderer WebGL è quello di un rasterizzatore software. */
export function rendererSoftware(renderer: string | null | undefined): boolean {
  return Boolean(renderer && SOFTWARE.test(renderer));
}

/**
 * true se il browser disegna WebGL2 (quello che chiede three.js) su una GPU
 * vera. Apre un contesto di prova e lo rilascia subito: i browser tengono
 * vivi pochi contesti per pagina, e la scena ne aprirà uno suo.
 */
export function graficaAccelerata(): boolean {
  // Con `failIfMajorPerformanceCaveat` è il browser stesso a rifiutare il
  // contesto quando disegnerebbe in software, o quando WebGL2 manca del tutto.
  const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
  if (!gl) return false;
  // Seconda rete, per i browser che l'opzione non la onorano.
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return !rendererSoftware(renderer);
}
