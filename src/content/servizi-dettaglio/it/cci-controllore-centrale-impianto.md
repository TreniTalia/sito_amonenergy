---
titolo: "CCI: Controllore Centrale d'Impianto"
lead: "Installazione, configurazione e gestione del Controllore Centrale d'Impianto in partnership con Teamware: le funzioni di osservabilità e controllabilità richieste dal distributore, conformi a CEI 0-16 V5."

# Foto Pexels, Neville Hawkins (https://www.pexels.com/photo/37061434/).
copertina: "../../../assets/img/tech/cover/cci-controllore-centrale-impianto.jpg"
copertinaAlt: "Campo fotovoltaico con file di pannelli solari e una cabina tecnica sotto un cielo nuvoloso"
seoTitle: "CCI Controllore Centrale d'Impianto: PF1, PF2, CEI 0-16"
seoDescription: "Installazione e gestione del Controllore Centrale d'Impianto (CCI) in partnership con Teamware: funzioni PF1 osservabilità e PF2 controllabilità conformi a CEI 0-16 V5 e Delibera ARERA 564/2025/R/eel."
ordine: 7
area: "controllo"
diagramma: "osservabilita-controllabilita"

problema:
  - "Il distributore che accoglie in rete un impianto di produzione ha bisogno di due cose che un impianto passivo non richiede: sapere in ogni momento come sta funzionando, e poterne limitare la potenza immessa quando la rete lo richiede. Senza un dispositivo dedicato, nessuna delle due è possibile dall'esterno dell'impianto."
  - "Il Controllore Centrale d'Impianto è quel dispositivo. Legge i parametri di funzionamento dell'impianto e li rende disponibili al distributore (è la funzione che CEI 0-16 V5 chiama PF1, osservabilità) e riceve dal distributore il comando di limitare la potenza attiva immessa, fino ad azzerarla se necessario: è la funzione PF2, controllabilità."
  - "Installiamo, configuriamo e gestiamo il CCI in partnership con Teamware: dalla scelta della configurazione più adatta all'impianto fino all'esercizio quotidiano, così che PF1 e PF2 restino operative senza che il cliente debba occuparsene."

parametri:
  - titolo: "PF1 · Osservabilità"
    testo: "Il CCI legge in tempo reale i parametri di funzionamento dell'impianto e li rende disponibili al distributore: è la condizione perché la rete sappia come sta lavorando ogni impianto connesso."
    icona: "fa6-solid:eye"
  - titolo: "PF2 · Controllabilità"
    testo: "Su comando del distributore, il CCI limita la potenza attiva immessa dall'impianto in rete, fino ad azzerarla se la sicurezza della rete lo richiede."
    icona: "fa6-solid:sliders"
  - titolo: "Conforme a CEI 0-16 V5"
    testo: "Le funzioni PF1 e PF2 sono quelle definite dalla versione 5 della regola tecnica di connessione alle reti AT e MT, il riferimento che il distributore applica a ogni impianto attivo."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Delibera ARERA 564/2025/R/eel"
    testo: "La delibera disciplina tempi e modalità di adeguamento degli impianti già connessi alle funzioni di osservabilità e controllabilità, con i contributi previsti per chi rispetta le scadenze."
    icona: "fa6-solid:gauge-high"
  - titolo: "In partnership con Teamware"
    testo: "Installazione, configurazione e gestione del CCI si svolgono in partnership con Teamware: la competenza tecnologica sul dispositivo, il rapporto diretto con l'impianto restano nostri."
    icona: "fa6-solid:handshake"
  - titolo: "Integrazione con RCS"
    testo: "Dove l'impianto è già supervisionato dal nostro sistema RCS, i dati del CCI entrano nello stesso quadro di controllo, senza una piattaforma separata da consultare."
    icona: "fa6-solid:network-wired"

fasi:
  - titolo: "Analisi dell'impianto e scelta della configurazione"
    testo: "Verifica della potenza installata, del punto di connessione e dei requisiti applicabili, per definire quale configurazione di CCI serve a quello specifico impianto."
  - titolo: "Installazione e configurazione, con Teamware"
    testo: "Messa in opera del dispositivo, configurazione delle funzioni PF1 e PF2 e dei parametri di comunicazione con il distributore, in partnership con Teamware."
  - titolo: "Collaudo delle funzioni PF1 e PF2"
    testo: "Verifica che l'osservabilità restituisca dati coerenti con lo stato reale dell'impianto e che il comando di limitazione della potenza attiva, inviato in prova, venga eseguito correttamente."
  - titolo: "Esercizio e gestione continuativa"
    testo: "Passaggio in servizio del CCI con la gestione affidata al nostro team: monitoraggio del corretto funzionamento e intervento in caso di anomalia sulle funzioni di osservabilità o controllabilità."

strumentazione:
  - modello: "Controllore Centrale d'Impianto (CCI)"
    nota: "Apparato gestito"

norma:
  codice: "CEI 0-16 V5"
  titolo: "Regola tecnica di connessione alle reti AT e MT: funzioni di osservabilità e controllabilità"
  note: "La versione 5 della CEI 0-16 introduce le funzioni PF1 (osservabilità: il CCI legge e rende disponibile al distributore lo stato dell'impianto) e PF2 (controllabilità: il distributore può limitare la potenza attiva immessa fino ad azzerarla). La Delibera ARERA 564/2025/R/eel disciplina tempi e contributi per l'adeguamento degli impianti già connessi a queste funzioni."

faq:
  - d: "Che cosa fa esattamente il Controllore Centrale d'Impianto?"
    r: "Rende l'impianto osservabile e controllabile dal distributore: legge i parametri di funzionamento e li trasmette (funzione PF1), e riceve il comando di limitare la potenza attiva immessa in rete quando il distributore lo richiede (funzione PF2)."
  - d: "Che differenza c'è fra PF1 e PF2?"
    r: "PF1 è l'osservabilità: il CCI rende leggibile al distributore lo stato dell'impianto. PF2 è la controllabilità: sulla base di un comando esterno del distributore, il CCI limita la potenza attiva immessa, fino ad azzerarla se necessario. La prima è lettura, la seconda è comando."
  - d: "Chi è Teamware e che ruolo ha?"
    r: "Teamware è il partner tecnologico con cui installiamo, configuriamo e gestiamo il CCI. La competenza sul dispositivo e sull'integrazione con le funzioni richieste dal distributore è condivisa con loro; il rapporto con l'impianto e la sua gestione operativa restano nostri."
  - d: "Che cos'è la Delibera ARERA 564/2025/R/eel?"
    r: "È la delibera che disciplina tempi e modalità con cui gli impianti già connessi alla rete devono adeguarsi alle funzioni di osservabilità e controllabilità, con i contributi previsti per chi rispetta le scadenze indicate."
  - d: "Il CCI serve anche a impianti già in esercizio?"
    r: "Sì. Gli impianti connessi prima dell'introduzione di questi requisiti possono adeguarsi installando il CCI: è il caso più frequente delle richieste che gestiamo insieme a Teamware, non solo le nuove connessioni."

correlati:
  - "rcs-monitoraggio-cabina-mt"
  - "teledistacco-a72"
  - "verifica-protezioni-at-mt"
---
