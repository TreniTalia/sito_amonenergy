// Measurement ID di Google Analytics 4. Sta scritto in chiaro di proposito:
// un Measurement ID finisce comunque nell'HTML di ogni pagina, non è un
// segreto. Proprietà GA4 "amonenergy.it", creata al go-live (24/09/2026):
// quella del vecchio WordPress non è più dell'azienda. Per cambiarla basta
// questa riga, poi serve un rebuild (la build è statica, una variabile
// d'ambiente sul container non la raggiungerebbe).
export const GA4_ID = 'G-QVTG80ZB2R';

// Con il segnaposto ancora in posizione lo script non si carica: meglio zero
// dati che dati sparati su una proprietà inesistente.
export const analyticsAttivo = !GA4_ID.includes('XXXXXXXXXX');
