// Una riga di testo SVG non va a capo da sola: ogni etichetta dei diagrammi a
// blocchi deve quindi spezzarsi a build-time, prima di finire nel markup.
// Stima prudente della larghezza: 0,6 em per carattere in Inter/Sora bold.
// Va usata con la dimensione MOBILE del testo (la più larga in unità di
// viewBox, perché lo schermo stretto ingrandisce il font mantenendo fisso il
// viewBox): è il caso peggiore, e se il testo entra lì entra anche a
// dimensione desktop. Oltre la larghezza utile del box il testo si spezza
// alla parola, al massimo su due righe: un testo che avrebbe bisogno di una
// terza riga perde silenziosamente le parole in eccesso, quindi le
// etichette dei diagrammi vanno scelte (o accorciate) perché ci stiano in due.
export function righe(testo: string, em: number, max: number): string[] {
  const parole = testo.split(' ');
  const out: string[] = [''];
  for (const p of parole) {
    const prova = out[out.length - 1] ? `${out[out.length - 1]} ${p}` : p;
    if (prova.length * em * 0.6 <= max || !out[out.length - 1]) out[out.length - 1] = prova;
    else out.push(p);
  }
  return out.slice(0, 2);
}
