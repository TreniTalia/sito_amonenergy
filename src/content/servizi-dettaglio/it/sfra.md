---
titolo: "Prova SFRA sui trasformatori di potenza"
lead: "Analisi della risposta in frequenza secondo IEC 60076-18: una misura non distruttiva che rivela lo stato meccanico di nucleo e avvolgimenti senza aprire la macchina."

# Foto Pexels, Andy Coffie (https://www.pexels.com/photo/30762645/).
copertina: "../../../assets/img/tech/cover/sfra.jpg"
copertinaAlt: "Sottostazione elettrica con tralicci e trasformatori sotto un cielo grigio e velato"
seoTitle: "Prova SFRA trasformatore: risposta in frequenza"
seoDescription: "Prova SFRA su trasformatori di potenza secondo IEC 60076-18: misura da 20 Hz a 2 MHz, confronto con l'impronta di riferimento, referto sui difetti meccanici."
ordine: 1
area: "diagnostica"
diagramma: "risposta-frequenza"

problema:
  - "Un trasformatore di potenza può essere elettricamente sano e meccanicamente compromesso. Un cortocircuito passante, un trasporto su strada, una scossa sismica o semplicemente vent'anni di sollecitazioni elettrodinamiche spostano gli avvolgimenti dalla posizione in cui sono stati costruiti. Rapporto di trasformazione, resistenza degli avvolgimenti e resistenza di isolamento possono restare tutti nei limiti mentre la geometria interna è già cambiata."
  - "La risposta in frequenza è sensibile proprio a quella geometria. Induttanze e capacità distribuite dentro la macchina dipendono dalla posizione reciproca di spire, colonne e strutture di serraggio: se qualcosa si muove, le risonanze della funzione di trasferimento si spostano in frequenza e cambiano ampiezza. È per questo che la SFRA vede difetti che nessun'altra prova elettrica di routine intercetta."
  - "Il confronto fra l'impronta registrata e quella misurata oggi mette in evidenza movimento del nucleo, deformazione e spostamento degli avvolgimenti, collasso parziale di un avvolgimento, cedimento o allentamento delle strutture di serraggio, spire in cortocircuito e avvolgimenti aperti. Il risultato non è un verde o un rosso: è una diagnosi con una localizzazione, perché regioni di frequenza diverse raccontano parti diverse della macchina."

parametri:
  - titolo: "Banda di misura 20 Hz – 2 MHz"
    testo: "L'intervallo prescritto dalla IEC 60076-18. Sotto il kilohertz risponde il circuito magnetico, nella zona intermedia le interazioni fra avvolgimenti, sopra i 100 kHz la geometria del singolo avvolgimento e il cablaggio di prova."
    icona: "fa6-solid:wave-square"
  - titolo: "Tensione di prova sotto 10 V RMS"
    testo: "La norma tiene il segnale iniettato al di sotto dei 10 V efficaci proprio per non alterare lo stato magnetico della macchina: la prova è ripetibile e non lascia traccia sul nucleo."
    icona: "fa6-solid:bolt"
  - titolo: "Prova non distruttiva, a macchina ferma"
    testo: "Si esegue fuori servizio, con trasformatore sezionato e messo a terra. Nessuna sollecitazione in alta tensione, nessun rischio per l'isolamento: la SFRA può precedere e seguire qualunque altra prova senza modificarne l'esito."
    icona: "fa6-solid:shield-halved"
  - titolo: "Tre confronti, non uno"
    testo: "La traccia si legge contro l'impronta storica della stessa macchina, contro le altre due fasi dello stesso trasformatore e contro un'unità gemella di pari costruzione. Dove manca lo storico, gli altri due confronti restano disponibili."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Cablaggio prescritto dalla norma"
    testo: "Cavi coassiali a doppia schermatura e trecce di massa piatte e larghe. Sopra i 100 kHz il cablaggio entra nella misura: un collegamento improvvisato produce uno scostamento che sembra un difetto e non lo è."
    icona: "fa6-solid:ruler"
  - titolo: "Referto con tracciati e diagnosi"
    testo: "Consegniamo i tracciati per ogni avvolgimento in formato aperto, il confronto con i riferimenti disponibili, l'interpretazione per regione di frequenza e l'indicazione se la macchina può rientrare in servizio."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Sopralluogo e messa in sicurezza"
    testo: "Sezionamento, messa a terra e scarica del trasformatore, apertura dei collegamenti di linea e di neutro, verifica dell'assenza di tensione. Si rileva la configurazione reale della macchina: è quella che va riprodotta identica alla prossima campagna."
  - titolo: "Misura della risposta in frequenza"
    testo: "Iniezione di un segnale sinusoidale a bassa tensione e rilievo della risposta su tutto lo spettro, con cavi coassiali a doppia schermatura e trecce di massa piatte come prescrive la IEC 60076-18. Si ripete su ogni avvolgimento e in ogni configurazione prevista."
  - titolo: "Confronto con l'impronta di riferimento"
    testo: "Sovrapposizione con la traccia storica della macchina, con le altre fasi e con un'unità gemella. Gli scostamenti si leggono per regione di frequenza, perché è la regione a dire se il sospetto è sul nucleo, sull'avvolgimento o sul serraggio."
  - titolo: "Referto e impronta archiviata"
    testo: "Relazione con tracciati, confronti e diagnosi, più l'archiviazione dell'impronta e delle condizioni di prova: senza quelle, la campagna successiva non è confrontabile con questa."

# Gli strumenti: `modello` è il nome dell'apparecchio — lo stesso formato con
# cui compaiono in pagine/azienda.yaml — e `nota` il ruolo che ha nella prova.
# Il giorno in cui il cliente conferma il modello dell'analizzatore, cambia una
# stringa sola e il ruolo resta dov'è. La nota va tenuta corta: nel pannello sta
# nella colonna dei valori, che a 390px non si restringe.
strumentazione:
  - modello: "Analizzatore di risposta in frequenza"
    nota: "Misura"
  - modello: "Cavi coassiali a doppia schermatura"
    nota: "Segnale"
  - modello: "Trecce di massa piatte e larghe"
    nota: "Messa a terra"

# Come si misura, non con che cosa.
assettoMisura:
  - etichetta: "Intervallo di misura"
    valore: "20 Hz – 2 MHz"
  - etichetta: "Segnale iniettato"
    valore: "Sinusoidale, < 10 V RMS"
  - etichetta: "Stato della macchina"
    valore: "Fuori servizio, a terra"
  - etichetta: "Ripetizione"
    valore: "Ogni avvolgimento, ogni fase"
  - etichetta: "Tracciati"
    valore: "Formato aperto, archiviati"

norma:
  codice: "IEC 60076-18"
  titolo: "Power transformers – Part 18: Measurement of frequency response"
  note: "Introdotta nel 2012, definisce come si misura e si documenta la risposta in frequenza di un trasformatore. Fissa l'intervallo di misura da 20 Hz a 2 MHz, tiene la tensione di prova sotto i 10 V RMS per non alterare lo stato magnetico della macchina, e prescrive cavi coassiali a doppia schermatura messi a terra con trecce piatte e larghe. La ripetibilità è il punto: la norma chiede di registrare le condizioni di prova perché la misura di oggi sia confrontabile con quella di fra cinque anni."

caso:
  progetto: "banzi-montemilone"
  testo: "Sul trasformatore della stazione 150/20 kV di Banzi–Montemilone (PZ) abbiamo eseguito l'analisi della risposta in frequenza confrontando i tracciati rilevati con i valori di riferimento della macchina. Il confronto non ha evidenziato scostamenti significativi: integrità meccanica confermata e trasformatore idoneo al servizio."

faq:
  - d: "Che cosa misura esattamente la prova SFRA?"
    r: "Misura la funzione di trasferimento di un avvolgimento: si inietta un segnale sinusoidale a bassa tensione e si rileva la risposta al variare della frequenza, da 20 Hz a 2 MHz. La curva che ne esce dipende dalle induttanze e dalle capacità distribuite dentro la macchina, cioè dalla sua geometria interna."
  - d: "Serve un'impronta di riferimento precedente?"
    r: "È la condizione migliore, ma non l'unica. In assenza di uno storico si confrontano le tre fasi dello stesso trasformatore fra loro e la macchina con un'unità gemella di pari costruzione. La prima campagna, comunque, vale anche come impronta di partenza per tutte le successive."
  - d: "Il trasformatore deve essere fuori servizio?"
    r: "Sì. La prova si esegue a macchina sezionata, messa a terra e con i collegamenti di linea aperti. Non è però una prova distruttiva né una sollecitazione: la tensione iniettata resta sotto i 10 V RMS e non lascia alcun effetto sulla macchina."
  - d: "Quali difetti riesce a individuare?"
    r: "Movimento del nucleo, deformazione e spostamento degli avvolgimenti, collasso parziale di un avvolgimento, cedimento o allentamento delle strutture di serraggio, spire in cortocircuito e avvolgimenti aperti. Sono difetti meccanici che le prove elettriche di routine possono non vedere affatto."
  - d: "Quando conviene eseguirla?"
    r: "Dopo un cortocircuito passante o un intervento delle protezioni, dopo un trasporto o un sollevamento, dopo un evento sismico, prima e dopo una riparazione in officina, e come misura di riferimento alla messa in servizio di una macchina nuova."
  - d: "Perché il cablaggio di prova conta tanto?"
    r: "Perché sopra i 100 kHz i cavi e i collegamenti di massa entrano nella misura. La IEC 60076-18 prescrive cavi coassiali a doppia schermatura e trecce di massa piatte e larghe, e chiede di ripetere la prova con lo stesso cablaggio: altrimenti si confrontano due misure che differiscono per il modo in cui sono state prese, non per lo stato della macchina."

correlati:
  - "verifiche-trasformatori-di-potenza"
  - "misure-scariche-parziali"
  - "rcs-monitoraggio-cabina-mt"
---
