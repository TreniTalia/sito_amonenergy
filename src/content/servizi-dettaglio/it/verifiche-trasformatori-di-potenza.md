---
titolo: "Verifiche sui trasformatori di potenza"
lead: "Rapporto di trasformazione, resistenza degli avvolgimenti, tan delta: le prove che dicono se un trasformatore è ancora quello che è stato costruito per essere."

# Foto Pexels, Pixabay (https://www.pexels.com/photo/236089/).
copertina: "../../../assets/img/tech/cover/verifiche-trasformatori-di-potenza.jpg"
copertinaAlt: "Boccole e isolatori di un trasformatore di potenza contro un cielo azzurro"
seoTitle: "Verifiche trasformatori di potenza: prove diagnostiche"
seoDescription: "Verifiche su trasformatori di potenza: rapporto di trasformazione, resistenza degli avvolgimenti, tan delta e capacità con ISA T2000 e ISA STS5000 + TD500."
ordine: 4
area: "diagnostica"
diagramma: "punti-misura-trasformatore"

problema:
  - "Un trasformatore di potenza è la macchina più costosa e più critica di una sottostazione, e anche la più difficile da sostituire in emergenza: un cedimento non programmato può fermare un impianto per settimane. Le prove periodiche esistono per intercettare il degrado prima che diventi un guasto, mentre la macchina è ancora in condizione di essere riparata o programmata per la sostituzione."
  - "Ogni punto della macchina racconta una storia diversa. Il rapporto di trasformazione e la resistenza degli avvolgimenti dicono se le spire sono integre e i contatti del commutatore fanno buon contatto. La tan delta e la capacità dell'isolamento dicono se la carta e l'olio stanno invecchiando o hanno preso umidità. La corrente di eccitazione dice se il nucleo lavora come dovrebbe. Nessuna di queste prove, da sola, vede tutto: è l'insieme che compone la diagnosi."
  - "Sono misure non distruttive, eseguite a macchina fuori servizio con la stessa strumentazione ogni volta: solo così il valore di oggi è confrontabile con quello della campagna precedente, ed è lo scostamento nel tempo, non il singolo numero, a dire se la macchina sta invecchiando normalmente o ha un problema in corso."

parametri:
  - titolo: "Rapporto di trasformazione"
    testo: "Confronto fra tensione primaria e secondaria su ogni presa del commutatore: uno scostamento indica spire in cortocircuito o un problema di contatto sul commutatore stesso."
    icona: "fa6-solid:ruler"
  - titolo: "Resistenza degli avvolgimenti"
    testo: "Misura in corrente continua su ogni fase e ogni presa: individua giunzioni allentate, saldature deteriorate o spire danneggiate, e verifica il contatto del commutatore sotto carico."
    icona: "fa6-solid:gauge-high"
  - titolo: "Tan delta e capacità dell'isolamento"
    testo: "L'angolo di perdita dell'isolamento cresce con l'invecchiamento della carta e dell'olio, o con l'ingresso di umidità. La capacità misurata si confronta con il dato di targa e con le misure precedenti."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Corrente di eccitazione"
    testo: "Misura della corrente a vuoto sul circuito magnetico: uno scostamento fra fasi segnala un problema al nucleo o a un avvolgimento in cortocircuito."
    icona: "fa6-solid:bolt"
  - titolo: "Commutatore sotto carico"
    testo: "Verifica della resistenza di contatto su ogni posizione del commutatore: è il punto meccanico più sollecitato della macchina, e il primo a deteriorarsi con le manovre ripetute."
    icona: "fa6-solid:shield-halved"
  - titolo: "Referto per punto di misura"
    testo: "Ogni grandezza misurata su ogni punto della macchina, confrontata con il dato di targa e, dove disponibile, con la campagna precedente, con l'indicazione se la macchina può restare in servizio."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Sopralluogo e messa in sicurezza"
    testo: "Sezionamento e messa a terra del trasformatore, apertura dei collegamenti di linea, rilievo della configurazione reale della macchina e delle prese del commutatore da verificare."
  - titolo: "Rapporto, resistenze ed eccitazione con l'ISA T2000"
    testo: "Misura del rapporto di trasformazione su ogni presa, della resistenza degli avvolgimenti su ogni fase e della corrente di eccitazione, ripetute nella configurazione prevista dalla campagna."
  - titolo: "Tan delta e capacità con l'ISA STS5000 + TD500"
    testo: "Misura dell'angolo di perdita e della capacità dell'isolamento fra avvolgimenti e verso massa, confrontata con il dato di targa e con le misure precedenti dove disponibili."
  - titolo: "Referto e confronto storico"
    testo: "Relazione con i valori misurati per ogni punto, il confronto con la targa e con la campagna precedente, e l'indicazione se la macchina può rientrare in servizio o richiede approfondimento."

strumentazione:
  - modello: "ISA T2000"
    nota: "Rapporto e resistenze"
  - modello: "ISA STS5000 + TD500"
    nota: "Tan delta e capacità"

assettoMisura:
  - etichetta: "Punti di misura"
    valore: "AT, BT, neutro, OLTC"
  - etichetta: "Stato della macchina"
    valore: "Fuori servizio, a terra"
  - etichetta: "Ripetizione"
    valore: "Ogni fase, ogni presa"
  - etichetta: "Confronto"
    valore: "Con targa e storico"

norma:
  codice: "IEC 60076-1"
  titolo: "Power transformers – Part 1: General"
  note: "Fissa le prescrizioni generali dei trasformatori di potenza (potenza nominale, tensione, gruppo di collegamento, dati di targa) e la classificazione delle prove in prove di routine, di tipo e speciali, rimandando alle parti successive della stessa famiglia per le prove specifiche: la risposta in frequenza, ad esempio, è normata a parte dalla IEC 60076-18. È la base su cui si innestano le verifiche di routine che eseguiamo su ogni macchina."

faq:
  - d: "Che differenza c'è fra queste verifiche e la prova SFRA?"
    r: "Queste verifiche misurano grandezze elettriche puntuali (rapporto, resistenze, tan delta, eccitazione) su punti specifici della macchina. La SFRA misura la risposta in frequenza dell'intero avvolgimento e vede la geometria interna, comprese le deformazioni meccaniche che le misure puntuali non intercettano. Spesso si eseguono nella stessa campagna, perché si completano a vicenda."
  - d: "Il trasformatore deve essere fuori servizio?"
    r: "Sì, tutte le misure di questa pagina si eseguono a macchina sezionata, messa a terra e con i collegamenti di linea aperti: sono misure elettriche a bassa energia, non compatibili con la tensione di esercizio."
  - d: "Che cosa dice la tan delta che le altre misure non dicono?"
    r: "La tan delta è sensibile all'invecchiamento dell'isolamento (carta e olio) e all'ingresso di umidità: due fenomeni che il rapporto di trasformazione o la resistenza degli avvolgimenti non vedono, perché riguardano l'isolamento e non il conduttore."
  - d: "Quando conviene eseguire questa campagna di verifiche?"
    r: "Come manutenzione predittiva periodica, dopo un intervento di riparazione o revamping, prima della messa in servizio di una macchina nuova o usata, e ogni volta che un'altra prova (termografia, analisi dell'olio) segnala un'anomalia da approfondire."

correlati:
  - "sfra"
  - "verifica-protezioni-at-mt"
  - "rcs-monitoraggio-cabina-mt"
---
