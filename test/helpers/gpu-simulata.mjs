/**
 * Chromium headless disegna WebGL con SwiftShader, cioè in software: la
 * pagina lo riconosce (src/lib/grafica.ts) e al posto del digital twin mostra
 * il fermo della scena. Per verificare anche il ramo con la GPU — e per
 * fotografare la scena da cui nasce quel fermo — questo script, passato a
 * `addInitScript`, fa credere alla pagina di avere una GPU vera: toglie
 * `failIfMajorPerformanceCaveat` dalle richieste di contesto e sostituisce il
 * nome del renderer. La scena poi gira davvero, lenta ma corretta.
 *
 * Gira dentro la pagina: niente riferimenti a variabili di questo modulo.
 */
export function simulaGpu() {
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo, attributi) {
    if (attributi?.failIfMajorPerformanceCaveat) attributi = { ...attributi, failIfMajorPerformanceCaveat: false };
    return getContext.call(this, tipo, attributi);
  };
  const UNMASKED_RENDERER_WEBGL = 0x9246;
  for (const Contesto of [WebGLRenderingContext, WebGL2RenderingContext]) {
    const getParameter = Contesto.prototype.getParameter;
    Contesto.prototype.getParameter = function (p) {
      return p === UNMASKED_RENDERER_WEBGL || p === this.RENDERER ? 'GPU simulata dai test' : getParameter.call(this, p);
    };
  }
}
