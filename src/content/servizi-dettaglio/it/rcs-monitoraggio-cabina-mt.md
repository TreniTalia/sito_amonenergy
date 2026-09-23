---
titolo: "Monitoraggio e controllo di cabina MT con RCS"
lead: "Il nostro sistema proprietario di supervisione da remoto: analisi del guasto in tempo reale, richiusura automatica e storicizzazione dei dati, con una Control Room attiva 24 ore su 24, 365 giorni l'anno."

# Foto Pexels, panumas nikhomkhai (https://www.pexels.com/photo/17489156/).
copertina: "../../../assets/img/tech/cover/rcs-monitoraggio-cabina-mt.jpg"
copertinaAlt: "Dettaglio di un rack server con indicatori luminosi blu in una sala di controllo"
seoTitle: "RCS: monitoraggio e controllo cabina MT da remoto"
seoDescription: "RCS, il sistema proprietario Amon Energy per il monitoraggio di cabina MT: analisi guasti in tempo reale, richiusura automatica, integrazione SCADA e Control Room attiva 24/7/365."
ordine: 6
area: "controllo"
diagramma: "catena-rcs"

problema:
  - "Una cabina MT senza supervisione remota è visibile solo quando qualcuno la raggiunge fisicamente. Un guasto transitorio che si estingue da solo, una manovra da eseguire fuori orario, un parametro che scivola fuori soglia: senza un sistema che legga lo stato dell'impianto in tempo reale, la prima notizia arriva spesso dal cliente che segnala il fermo impianto, non dalla cabina stessa."
  - "RCS è il sistema di supervisione e controllo che abbiamo sviluppato per colmare quella distanza. Analizza il tipo di guasto rilevato dall'interruttore, distingue un evento transitorio da uno persistente e, quando il guasto risulta estinto, richiude in automatico senza attendere l'intervento manuale: è la differenza fra un impianto fermo per minuti e uno fermo per ore."
  - "Tutto passa dalla nostra Control Room: web app in cloud accessibile da PC, tablet e smartphone, cronologia degli eventi per ogni cabina, reset delle protezioni e manovre manuali da remoto quando serve l'intervento di un operatore. Più strutture in gestione sono visibili da un'unica schermata, con la stessa immediatezza con cui si leggerebbe un solo quadro."

parametri:
  - titolo: "Richiusura automatica"
    testo: "L'algoritmo RCS riconosce il tipo di guasto e, quando è transitorio ed estinto, richiude l'interruttore senza attendere l'operatore: il fermo impianto si misura in minuti, non in ore."
    icona: "fa6-solid:arrows-rotate"
  - titolo: "Web app in cloud"
    testo: "Un'unica piattaforma accessibile da PC, tablet e smartphone mostra lo stato di ogni cabina in gestione, con la possibilità di eseguire manovre manuali da remoto quando serve l'intervento umano."
    icona: "fa6-solid:cloud"
  - titolo: "Storicizzazione dei dati"
    testo: "Ogni evento (guasto, manovra, richiusura, allarme) resta archiviato con data, ora e parametri rilevati: una cronologia consultabile, non solo un allarme che lampeggia e sparisce."
    icona: "fa6-solid:database"
  - titolo: "Reset protezioni da remoto"
    testo: "Quando un intervento non richiede la presenza in cabina, il reset delle protezioni si esegue dalla Control Room: meno trasferte, meno tempo fra il guasto e il ripristino."
    icona: "fa6-solid:power-off"
  - titolo: "Integrazione SCADA"
    testo: "RCS dialoga con i sistemi SCADA del cliente o del distributore, così i dati di cabina entrano nel quadro di supervisione più ampio dell'impianto senza una piattaforma separata da consultare."
    icona: "fa6-solid:network-wired"
  - titolo: "Control Room 24/7/365"
    testo: "La supervisione non si ferma la sera né nei festivi: un guasto notturno viene analizzato nello stesso momento in cui accade, non alla prima ora utile del giorno dopo."
    icona: "fa6-solid:satellite-dish"

fasi:
  - titolo: "Installazione e configurazione dell'unità RCS"
    testo: "Messa in opera dell'unità in cabina, collegamento agli organi di manovra e alle protezioni esistenti, configurazione dei parametri di soglia e delle regole di richiusura automatica per quella specifica cabina."
  - titolo: "Collegamento alla Control Room"
    testo: "Attivazione del canale di comunicazione con la piattaforma cloud, prova di trasmissione dati e verifica che lo stato dell'impianto sia leggibile in tempo reale dalla web app."
  - titolo: "Taratura e collaudo funzionale"
    testo: "Simulazione di eventi di guasto per verificare che l'algoritmo distingua correttamente un transitorio da un guasto persistente e che la richiusura automatica intervenga nei tempi e alle condizioni previste."
  - titolo: "Esercizio e supervisione continua"
    testo: "Passaggio in servizio con la Control Room attiva: monitoraggio continuo, manovre da remoto quando servono, storicizzazione degli eventi e reperibilità per l'intervento in campo quando la richiusura remota non basta."

strumentazione:
  - modello: "Remote Control System (RCS)"
    nota: "Sistema proprietario"
  - modello: "Web app in cloud"
    nota: "Supervisione e manovra"

norma:
  codice: "CEI EN 50110-1"
  titolo: "Esercizio degli impianti elettrici"
  note: "Una manovra da remoto, come una richiusura automatica o un reset delle protezioni comandato dalla Control Room, resta un atto di esercizio dell'impianto elettrico, con gli stessi criteri di sicurezza di una manovra eseguita in loco. RCS non sostituisce questo quadro: lo automatizza dove l'automazione è sicura e lo lascia all'operatore qualificato dove serve una decisione in campo."

faq:
  - d: "Che cos'è il sistema RCS?"
    r: "È il sistema proprietario di supervisione e controllo di Amon Energy per cabine MT: analizza in tempo reale lo stato dell'impianto, riconosce i guasti transitori e richiude automaticamente l'interruttore quando il guasto è estinto, il tutto supervisionato dalla nostra Control Room attiva 24 ore su 24."
  - d: "Come funziona la richiusura automatica?"
    r: "L'algoritmo RCS distingue un guasto transitorio, che si estingue da solo, da un guasto persistente. Nel primo caso richiude l'interruttore senza attendere l'intervento manuale; nel secondo mantiene l'apertura e segnala l'evento alla Control Room per la valutazione di un operatore."
  - d: "Quali dati restano storicizzati?"
    r: "Ogni evento rilevante (guasti, manovre, richiusure, allarmi e reset delle protezioni) viene registrato con data, ora e parametri, così la cronologia della cabina è sempre consultabile, non solo l'ultimo stato in tempo reale."
  - d: "RCS può dialogare con lo SCADA del cliente?"
    r: "Sì, l'integrazione SCADA porta i dati di cabina all'interno del sistema di supervisione più ampio del cliente o del distributore, evitando una piattaforma separata da consultare in parallelo."
  - d: "Che cosa succede fuori dall'orario di ufficio?"
    r: "Nulla cambia: la Control Room è attiva 24 ore su 24, 365 giorni l'anno, e un guasto notturno o festivo viene analizzato nello stesso momento in cui si verifica."

correlati:
  - "cci-controllore-centrale-impianto"
  - "verifiche-trasformatori-di-potenza"
  - "prove-isolamento"
  - "lettura-contatori"
---
