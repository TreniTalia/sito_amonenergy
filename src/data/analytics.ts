// Measurement ID di Google Analytics 4. Sta scritto in chiaro di proposito:
// un Measurement ID finisce comunque nell'HTML di ogni pagina, non è un
// segreto. Il segnaposto resta finché il cliente non fornisce quello vero;
// cambiarlo qui è l'unica modifica necessaria, poi serve un rebuild
// (la build è statica, una variabile d'ambiente sul container non la
// raggiungerebbe).
export const GA4_ID = 'G-XXXXXXXXXX';

// Con il segnaposto ancora in posizione lo script non si carica: meglio zero
// dati che dati sparati su una proprietà inesistente.
export const analyticsAttivo = !GA4_ID.includes('XXXXXXXXXX');
