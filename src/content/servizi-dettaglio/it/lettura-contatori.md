---
titolo: "Lettura e telelettura contatori di produzione"
lead: "Acquisizione, validazione e messa a disposizione dei dati di produzione e scambio: il dato di misura che serve al cliente per verificare l'impianto e al distributore per la propria contabilità di rete."

# Foto Pexels, Brett Sayles (https://www.pexels.com/photo/4330787/).
copertina: "../../../assets/img/tech/cover/lettura-contatori.jpg"
copertinaAlt: "Pannello di permutazione in fibra ottica con cavi turchesi e connettori bianchi"
seoTitle: "Lettura e telelettura contatori di produzione"
seoDescription: "Telelettura dei contatori di produzione e scambio: acquisizione periodica, validazione dei dati e portale di consultazione per impianti connessi in MT."
ordine: 9
area: "controllo"
diagramma: "catena-contatori"

problema:
  - "Un impianto di produzione ha almeno due contatori che contano cose diverse: quello di produzione, che misura l'energia generata dall'impianto, e quello di scambio, bidirezionale, che misura quanto viene immesso in rete e quanto eventualmente prelevato. Sono i dati con cui il cliente verifica la resa reale dell'impianto e con cui il distributore tiene la propria contabilità di rete."
  - "Il dato preso una volta sola, letto a vista sul display del contatore, dice poco: serve una lettura periodica, ripetibile, che raccolga i valori a intervalli regolari e li renda confrontabili nel tempo. Ed è un dato che va anche controllato, perché un valore anomalo (un salto improbabile, un contatore che non risponde) va intercettato prima di finire in un confronto o in una fattura."
  - "Ci occupiamo dell'intera catena: acquisizione periodica dai contatori di produzione e scambio, validazione dei dati raccolti per intercettare le anomalie, e messa a disposizione su un portale dove cliente e, dove previsto, distributore possono consultare lo storico delle misure."

parametri:
  - titolo: "Contatore di produzione e di scambio"
    testo: "Due misure distinte: quanto l'impianto genera e quanto scambia con la rete, in immissione e in prelievo. Confonderle porta a letture che non tornano con la produzione reale."
    icona: "fa6-solid:gauge-high"
  - titolo: "Acquisizione periodica"
    testo: "I dati vengono raccolti a intervalli regolari, non solo su richiesta: è quella regolarità a rendere confrontabile un mese di produzione con il precedente."
    icona: "fa6-solid:arrow-down-up-across-line"
  - titolo: "Validazione dei dati"
    testo: "Ogni lettura viene controllata per coerenza prima di entrare nello storico: un valore anomalo o un contatore muto vengono segnalati, non semplicemente riportati come se nulla fosse."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Portale di consultazione"
    testo: "Lo storico delle misure è consultabile dal cliente in ogni momento, senza dover richiedere ogni volta l'ultima lettura o rincorrere il dato sul display del contatore."
    icona: "fa6-solid:chart-simple"
  - titolo: "Integrazione con RCS"
    testo: "Dove l'impianto è già supervisionato dal nostro sistema RCS, i dati di produzione e scambio entrano nello stesso quadro di controllo del resto della cabina."
    icona: "fa6-solid:network-wired"

fasi:
  - titolo: "Censimento dei punti di misura"
    testo: "Identificazione dei contatori di produzione e di scambio dell'impianto, del loro protocollo di comunicazione e della periodicità di lettura richiesta."
  - titolo: "Attivazione dell'acquisizione periodica"
    testo: "Configurazione della raccolta automatica dei dati agli intervalli previsti, con prima verifica che i valori acquisiti corrispondano a quelli letti direttamente sul contatore."
  - titolo: "Validazione e messa a disposizione dei dati"
    testo: "Controllo di coerenza sui dati raccolti e pubblicazione sul portale di consultazione, con segnalazione delle anomalie (mancata lettura, valore fuori range) appena rilevate."
  - titolo: "Esercizio e assistenza continuativa"
    testo: "Manutenzione della catena di acquisizione, intervento sui contatori o sui collegamenti in caso di anomalia persistente, aggiornamento del portale con lo storico delle misure."

strumentazione:
  - modello: "Sistema di acquisizione dati"
    nota: "Gestito da Amon Energy"
  - modello: "Portale di consultazione"
    nota: "Storico delle misure"

norma:
  codice: "CEI 0-16"
  titolo: "Regola tecnica di riferimento per la connessione di Utenti attivi e passivi alle reti AT ed MT"
  note: "La regola tecnica di connessione richiede che gli impianti attivi rendano disponibili al distributore i dati di misura necessari alla gestione della rete: il contatore di produzione e quello di scambio sono la fonte di quel dato. Il quadro con cui organizziamo l'acquisizione, la validazione e la consultazione dei dati risponde a questa esigenza, comune a ogni impianto connesso in MT."

faq:
  - d: "Che differenza c'è fra contatore di produzione e contatore di scambio?"
    r: "Il contatore di produzione misura l'energia generata dall'impianto, tipicamente vicino all'inverter o al generatore. Il contatore di scambio, bidirezionale, misura l'energia immessa in rete e quella eventualmente prelevata: sono due dati diversi e vanno letti entrambi per avere il quadro completo."
  - d: "Con che frequenza vengono acquisiti i dati?"
    r: "L'acquisizione è periodica, a intervalli regolari definiti in fase di attivazione: è quella regolarità a rendere lo storico confrontabile nel tempo, invece di una serie di letture isolate prese su richiesta."
  - d: "Che cosa succede se un contatore smette di rispondere?"
    r: "La validazione dei dati intercetta l'anomalia, una lettura mancante o un valore incoerente, e la segnala, così l'intervento arriva prima che il vuoto di dati diventi un problema in un confronto o in una verifica con il distributore."
  - d: "I dati sono consultabili anche dal distributore?"
    r: "Dove previsto dal punto di connessione, sì: il dato di misura reso disponibile risponde proprio alla necessità del distributore di gestire la rete con informazioni aggiornate su ogni impianto connesso."
  - d: "Questo servizio si integra con RCS?"
    r: "Sì, quando l'impianto è già supervisionato dal nostro sistema RCS i dati di produzione e scambio entrano nello stesso quadro di controllo della cabina, senza un portale separato da consultare a parte."

correlati:
  - "rcs-monitoraggio-cabina-mt"
  - "cci-controllore-centrale-impianto"
  - "teledistacco-a72"
---
