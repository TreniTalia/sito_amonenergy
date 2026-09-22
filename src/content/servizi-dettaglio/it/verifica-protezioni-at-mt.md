---
titolo: "Verifica delle protezioni AT/MT"
lead: "Iniezione controllata delle soglie di intervento secondo CEI 0-16: la protezione scatta davvero dove la taratura dice che deve scattare, e in quanto tempo."
seoTitle: "Verifica protezioni AT/MT: soglie I> e I>> a norma"
seoDescription: "Verifica delle protezioni AT/MT secondo CEI 0-16: iniezione controllata delle soglie I> e I>>, tempi di intervento misurati con DRTS/64 e ISA CBA 1000, referto soglia per soglia."
ordine: 3
diagramma: "curva-tempo-corrente"

problema:
  - "Un relè di protezione è tarato una volta, in officina o all'atto della messa in servizio, e da quel momento resta silenzioso: interviene solo quando qualcosa va storto. Ma proprio perché non interviene quasi mai, un relè fuori taratura può restare invisibile per anni — la protezione sembra presente, ma se il guasto arriva non scatta dove deve, o scatta troppo tardi, o non scatta affatto."
  - "Le soglie che contano sono almeno due: quella selettiva, tarata per intervenire con un ritardo che lascia il tempo alle protezioni a valle di agire prima, e quella di massima corrente, tarata per intervenire quasi istantaneamente sui guasti francamente pericolosi. Se una delle due si sposta — per un guasto interno al relè, un cablaggio deteriorato, una taratura mai aggiornata dopo una modifica di rete — la selettività dell'impianto si rompe anche se in apparenza tutto funziona."
  - "Verificarle significa iniettare correnti e tensioni simulate nel circuito del relè e misurare, con uno strumento calibrato, se la soglia scatta al valore giusto e nel tempo giusto. È l'unico modo per sapere che la protezione farà quello per cui è stata tarata, prima che sia un guasto reale a dirlo."

parametri:
  - titolo: "Soglie I> e I>> verificate singolarmente"
    testo: "La soglia selettiva e quella di massima corrente si verificano separatamente, ciascuna al proprio valore di taratura: un relè può avere una soglia corretta e l'altra spostata, e solo la verifica di entrambe lo dice."
    icona: "fa6-solid:gauge-high"
  - titolo: "Iniezione secondaria calibrata"
    testo: "Corrente e tensione simulate vengono iniettate nel circuito del relè con uno strumento calibrato, riproducendo la condizione di guasto senza mettere in tensione l'impianto reale."
    icona: "fa6-solid:bolt"
  - titolo: "Tempi di intervento cronometrati"
    testo: "Non basta che il relè scatti: deve scattare nel tempo previsto dalla taratura. Il tempo misurato si confronta con quello atteso, soglia per soglia."
    icona: "fa6-solid:stopwatch"
  - titolo: "Catena di intervento, non solo il relè"
    testo: "Il relè può essere tarato bene e l'interruttore aprire in ritardo. Verifichiamo anche il tempo di apertura effettivo, così l'esito riguarda l'intera catena di protezione."
    icona: "fa6-solid:shield-halved"
  - titolo: "Conformità a CEI 0-16"
    testo: "Le soglie, i tempi e i criteri di selettività verificati sono quelli richiesti dalla regola tecnica di connessione alle reti AT ed MT dei distributori."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Referto soglia per soglia"
    testo: "Ogni soglia verificata ha una riga propria nel referto: valore di taratura, valore misurato, tempo di intervento, esito. Nessun risultato aggregato che nasconda una singola soglia fuori tolleranza."
    icona: "fa6-solid:list-check"

fasi:
  - titolo: "Sopralluogo e messa in sicurezza"
    testo: "Apertura dello scomparto relè, verifica dell'assenza di tensione sui circuiti secondari, scollegamento dei circuiti di comando dell'interruttore per isolare la prova dall'esercizio della rete."
  - titolo: "Iniezione con il DRTS/64"
    testo: "Iniezione di correnti e tensioni simulate nei circuiti secondari del relè, riproducendo le condizioni di guasto corrispondenti a ciascuna soglia — I> e I>> — con i valori di taratura dichiarati."
  - titolo: "Analisi dell'interruttore con l'ISA CBA 1000"
    testo: "Misura del tempo di apertura effettivo dell'interruttore comandato dal relè e della resistenza di contatto: la verifica non si ferma alla soglia elettronica, arriva fino all'organo di manovra."
  - titolo: "Referto di conformità"
    testo: "Relazione con ogni soglia verificata, il tempo di intervento misurato e l'esito rispetto alla taratura dichiarata e ai criteri di CEI 0-16."

strumentazione:
  - modello: "DRTS/64"
    nota: "Iniezione soglie"
  - modello: "ISA CBA 1000"
    nota: "Analisi interruttore"

assettoMisura:
  - etichetta: "Soglie verificate"
    valore: "I> e I>>"
  - etichetta: "Iniezione"
    valore: "Secondaria, calibrata"
  - etichetta: "Misura"
    valore: "Tempo di intervento"
  - etichetta: "Stato circuito"
    valore: "Interruttore scollegato"

norma:
  codice: "CEI 0-16"
  titolo: "Regola tecnica di riferimento per la connessione di Utenti attivi e passivi alle reti AT ed MT delle imprese distributrici di energia elettrica"
  note: "Fissa i criteri di protezione — generale e di interfaccia — che un utente attivo o passivo deve rispettare per restare connesso alle reti AT ed MT dei distributori: soglie di intervento, tempi, criteri di selettività fra i diversi livelli di protezione. La verifica periodica delle soglie e dei tempi di intervento è la condizione perché quella protezione, tarata a tavolino, funzioni davvero sul campo."

faq:
  - d: "Che cosa vuol dire verificare le soglie I> e I>>?"
    r: "Vuol dire iniettare nel circuito del relè una corrente simulata pari o vicina al valore di taratura di ciascuna soglia e verificare che l'intervento avvenga esattamente a quel valore e nel tempo previsto — non prima, non dopo, non a un valore diverso."
  - d: "Perché servono due strumenti, DRTS/64 e ISA CBA 1000?"
    r: "Il DRTS/64 verifica il relè: inietta le grandezze simulate e misura se la soglia elettronica scatta correttamente. L'ISA CBA 1000 verifica l'interruttore: misura il tempo di apertura effettivo e la resistenza di contatto. Una protezione ben tarata ma con un interruttore lento non protegge l'impianto come dovrebbe."
  - d: "La verifica richiede il fuori servizio della linea?"
    r: "Sì, per i circuiti coinvolti nella prova: i circuiti secondari del relè vengono scollegati dal comando reale dell'interruttore per la durata dell'iniezione, così la simulazione del guasto non ha effetto sulla rete in esercizio."
  - d: "Che cosa restituisce il referto?"
    r: "Una riga per ogni soglia verificata, con il valore di taratura dichiarato, il valore misurato, il tempo di intervento cronometrato e l'esito di conformità rispetto ai criteri della CEI 0-16."

correlati:
  - "misure-scariche-parziali"
  - "verifiche-trasformatori-di-potenza"
  - "prove-isolamento"
  - "teledistacco-a72"
---
