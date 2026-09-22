---
titolo: "Teledistacco secondo l'Allegato A.72"
lead: "Verifica e diagnostica dei dispositivi RIGEDI e Modem A72, assistenza tecnica alla messa in servizio, analisi delle prestazioni e integrazione SCADA: il canale attraverso cui il distributore comanda il distacco dell'impianto quando la rete lo richiede."
seoTitle: "Teledistacco A72: verifica RIGEDI e Modem"
seoDescription: "Verifica e diagnostica dei dispositivi RIGEDI e Modem A72, messa in servizio, analisi delle prestazioni e integrazione SCADA per il teledistacco degli impianti di produzione secondo l'Allegato A.72."
ordine: 8
diagramma: "catena-a72"

problema:
  - "Un impianto di produzione connesso alla rete MT non decide da solo quando restare in servizio: in certe condizioni di rischio per la rete, è il distributore a dover poter comandare il distacco da remoto. È la funzione descritta dall'Allegato A.72 al Codice di Rete, applicata attraverso la procedura che sul campo tutti chiamano RIGEDI, e implementata sull'impianto con un dispositivo dedicato e un modem che riceve il comando."
  - "Il dispositivo da solo non basta: deve essere verificato, tenuto in efficienza e integrato con il resto dell'impianto perché il comando di distacco — e quello, altrettanto importante, di riconnessione — arrivi davvero e venga eseguito nei tempi previsti. Un modem che non risponde o una protezione di interfaccia mal configurata trasformano un requisito di sicurezza di rete in un punto cieco."
  - "Verifichiamo e diagnostichiamo i dispositivi RIGEDI e il Modem A72, assistiamo alla messa in servizio, analizziamo le prestazioni del collegamento e la conformità del sistema, supportiamo la comunicazione con il distributore nelle fasi di attivazione e integriamo il tutto con lo SCADA dell'impianto, così che il teledistacco sia un canale verificato e non solo installato."

parametri:
  - titolo: "Verifica del dispositivo RIGEDI"
    testo: "Controllo funzionale della protezione di interfaccia che riceve ed esegue il comando di distacco, secondo quanto previsto dall'Allegato A.72."
    icona: "fa6-solid:shield-halved"
  - titolo: "Diagnostica del Modem A72"
    testo: "Verifica del canale di ricezione del comando dal distributore: il modem è il punto in cui un teledistacco non pervenuto diventa invisibile finché non lo si cerca."
    icona: "fa6-solid:tower-broadcast"
  - titolo: "Messa in servizio assistita"
    testo: "Supporto tecnico nella fase di attivazione, dalla configurazione del dispositivo alla prima prova di comando con il distributore."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Analisi delle prestazioni"
    testo: "Verifica dei tempi di risposta del sistema e della conformità del comportamento del dispositivo rispetto a quanto richiesto per il teledistacco e la riconnessione."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Supporto nella comunicazione con il distributore"
    testo: "Assistenza nelle interlocuzioni tecniche con il distributore per le attivazioni, le verifiche periodiche e la gestione delle anomalie sul canale di teledistacco."
    icona: "fa6-solid:people-arrows"
  - titolo: "Integrazione SCADA"
    testo: "Lo stato del dispositivo di teledistacco entra nel sistema di supervisione dell'impianto, visibile insieme agli altri parametri di esercizio invece che su un canale a parte."
    icona: "fa6-solid:network-wired"

fasi:
  - titolo: "Sopralluogo e verifica del dispositivo esistente"
    testo: "Controllo dello stato del dispositivo RIGEDI e del Modem A72 già installati, o valutazione della configurazione necessaria per un impianto di nuova connessione."
  - titolo: "Messa in servizio e prima prova con il distributore"
    testo: "Configurazione del dispositivo, attivazione del canale di comunicazione e prova di ricezione del comando concordata con il distributore, per verificare che il sistema risponda correttamente."
  - titolo: "Analisi delle prestazioni e verifica di conformità"
    testo: "Misura dei tempi di risposta del sistema al comando di distacco e di riconnessione, e confronto con quanto richiesto dall'Allegato A.72."
  - titolo: "Integrazione SCADA ed esercizio"
    testo: "Collegamento dello stato del dispositivo al sistema di supervisione dell'impianto e passaggio in esercizio, con assistenza continuativa sulla comunicazione con il distributore."

strumentazione:
  - modello: "Dispositivo RIGEDI"
    nota: "Verificato e diagnosticato"
  - modello: "Modem A72"
    nota: "Verificato e diagnosticato"

norma:
  codice: "Allegato A.72 al Codice di Rete"
  titolo: "Allegato A.72 al Codice di Rete di Terna — disciplina del teledistacco degli impianti di produzione"
  note: "L'Allegato A.72 è un allegato al Codice di Rete di Terna, non una parte della CEI 0-16: definisce il teledistacco, cioè la possibilità per il distributore di comandare da remoto il distacco di un impianto di produzione quando la sicurezza della rete lo richiede, e la successiva riconnessione. Sul campo la procedura è nota come RIGEDI. Il quadro di connessione alla rete MT resta quello della CEI 0-16, la regola tecnica generale di connessione alle reti AT ed MT."

faq:
  - d: "Che cos'è il teledistacco secondo l'Allegato A.72?"
    r: "È la funzione che permette al distributore di comandare da remoto il distacco di un impianto di produzione connesso in MT, quando condizioni di rischio per la rete lo richiedono, e la sua successiva riconnessione. È implementata con un dispositivo dedicato e un modem che riceve il comando."
  - d: "Che cosa sono RIGEDI e Modem A72?"
    r: "RIGEDI è il nome con cui sul campo si indica la procedura di distacco applicata secondo l'Allegato A.72; il Modem A72 è il dispositivo che riceve dal distributore il comando di distacco o riconnessione e lo trasmette alla protezione di interfaccia dell'impianto."
  - d: "Perché serve una verifica periodica dei dispositivi?"
    r: "Perché un modem che non risponde o una protezione mal configurata non danno segnali evidenti finché non arriva un comando reale: la verifica e la diagnostica servono a intercettare il problema prima che sia il distributore a scoprirlo con un teledistacco non eseguito."
  - d: "Il servizio comprende anche la messa in servizio?"
    r: "Sì, assistiamo tecnicamente la messa in servizio del dispositivo e la prima prova di comando concordata con il distributore, oltre alla verifica e diagnostica sui sistemi già installati."
  - d: "Il teledistacco si integra con lo SCADA dell'impianto?"
    r: "Sì, integriamo lo stato del dispositivo di teledistacco nel sistema di supervisione dell'impianto, così l'informazione è visibile insieme agli altri parametri di esercizio invece che su un canale separato."

correlati:
  - "cci-controllore-centrale-impianto"
  - "verifica-protezioni-at-mt"
  - "lettura-contatori"
---
