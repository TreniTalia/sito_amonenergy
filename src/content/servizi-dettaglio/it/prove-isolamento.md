---
titolo: "Prove di isolamento in alta tensione"
lead: "Rampa di tensione a valori superiori all'esercizio e corrente di fuga sotto controllo: la prova che verifica se l'isolamento tiene prima che sia la rete a scoprirlo."
seoTitle: "Prove di isolamento AT/MT: rigidità dielettrica in sito"
seoDescription: "Prove di isolamento in alta tensione con Megger HV Test 80 kV: rampa di tensione controllata, corrente di fuga monitorata, personale qualificato CEI 11-27 e CEI EN 50110-1."
ordine: 5
diagramma: "rampa-isolamento"

problema:
  - "Un isolamento elettrico funziona finché non viene messo alla prova: a tensione di esercizio può reggere per anni anche con un difetto in corso, semplicemente perché il campo elettrico applicato non basta a farlo emergere. La prova di isolamento esiste per superare quella tensione, in condizioni controllate, e vedere se il materiale regge un margine superiore a quello che vedrà mai in servizio."
  - "Durante la prova non basta guardare se scocca una scarica franca. La corrente di fuga — la piccola corrente che attraversa comunque l'isolamento durante la rampa — è un indicatore più fine: in un isolamento sano resta bassa e quasi piatta all'aumentare della tensione, in un isolamento compromesso si impenna prima ancora di raggiungere il valore di prova. È quel punto di impennata, non solo la tenuta finale, che la misura deve cogliere."
  - "Si esegue su cavi, macchine e apparecchiature AT/MT dopo l'installazione, dopo una riparazione, o come verifica periodica su impianti esistenti: un margine di isolamento che si riduce nel tempo è spesso il primo segnale di un componente da programmare per la sostituzione, prima che lo segnali un'interruzione."

parametri:
  - titolo: "Rampa di tensione controllata"
    testo: "La tensione applicata sale progressivamente fino al valore di prova, restando sotto il controllo dell'operatore per tutta la durata: nessun gradino brusco che possa mascherare un cedimento incipiente."
    icona: "fa6-solid:bolt"
  - titolo: "Corrente di fuga monitorata"
    testo: "La corrente che attraversa l'isolamento durante la rampa si legge in tempo reale: un'impennata prima del valore di prova è il segnale di un isolamento compromesso, anche senza scarica franca."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Fino a 80 kV in sito"
    testo: "Il generatore raggiunge tensioni di prova fino a 80 kV direttamente in campo, senza dover smontare il componente e trasportarlo in un laboratorio esterno."
    icona: "fa6-solid:gauge-high"
  - titolo: "Zona di anomalia identificata"
    testo: "Dove la corrente di fuga si stacca dall'andamento atteso, la prova si interrompe prima del cedimento franco: la zona di impennata viene documentata come anomalia, non solo l'esito finale."
    icona: "fa6-solid:triangle-exclamation"
  - titolo: "Personale qualificato"
    testo: "La prova si esegue con personale qualificato secondo CEI EN 50110-1 e CEI 11-27, con le procedure di messa in sicurezza che una tensione di prova ben oltre l'esercizio richiede."
    icona: "fa6-solid:shield-halved"
  - titolo: "Referto con curva e valore di tenuta"
    testo: "Consegniamo la curva tensione-corrente rilevata durante la prova, il valore di tensione raggiunto e l'esito: tenuta confermata o zona di anomalia da approfondire."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Sopralluogo e messa in sicurezza"
    testo: "Sezionamento del componente da provare, messa a terra, delimitazione della zona di prova e verifica delle condizioni di sicurezza richieste da una tensione ben superiore a quella di esercizio."
  - titolo: "Rampa di tensione con il Megger HV Test 80 kV"
    testo: "Applicazione della tensione con salita controllata fino al valore di prova previsto per il componente, monitorando in continuo la corrente di fuga durante tutta la rampa."
  - titolo: "Lettura della corrente di fuga"
    testo: "Se la corrente resta bassa e stabile fino al valore di prova, l'isolamento tiene. Se si impenna prima, la prova si ferma e la zona di impennata viene documentata come anomalia da approfondire."
  - titolo: "Referto e indicazione operativa"
    testo: "Relazione con la curva tensione-corrente, il valore di tensione raggiunto e l'esito: componente idoneo al servizio, o da riparare, sostituire e riprovare."

strumentazione:
  - modello: "Megger HV Test 80 kV"
    nota: "Rampa e corrente di fuga"

assettoMisura:
  - etichetta: "Tensione di prova"
    valore: "Fino a 80 kV"
  - etichetta: "Modalità"
    valore: "Rampa controllata"
  - etichetta: "Grandezza monitorata"
    valore: "Corrente di fuga"
  - etichetta: "Stato del componente"
    valore: "Sezionato e a terra"

norma:
  codice: "CEI 11-27 / CEI EN 50110-1"
  titolo: "Lavori su impianti elettrici / Esercizio degli impianti elettrici"
  note: "Non esiste una singola norma di prodotto che copra in modo generale le prove di isolamento su tipologie di apparecchiature diverse fra loro come cavi, macchine e quadristica: la tensione, la durata e i criteri di accettazione cambiano da un prodotto all'altro. Quello che resta costante, ed è confermato, è il quadro con cui la prova va eseguita in sicurezza: la CEI EN 50110-1 per l'esercizio degli impianti elettrici e la CEI 11-27 per la qualifica del personale e le procedure di lavoro, entrambe applicate a ogni prova in alta tensione che eseguiamo."

faq:
  - d: "Perché la corrente di fuga conta più della sola tenuta finale?"
    r: "Perché anticipa il cedimento. Un isolamento che regge fino al valore di prova ma con una corrente di fuga già in crescita anomala sta segnalando un problema che oggi non ha ancora causato una scarica, ma probabilmente la causerà in servizio. Fermarsi a quel segnale, prima della scarica franca, permette di intervenire in modo programmato."
  - d: "Fino a che tensione arriva la prova?"
    r: "Il generatore in dotazione raggiunge tensioni di prova fino a 80 kV in sito. Il valore effettivo di prova dipende dal componente e dalla tensione di esercizio dell'impianto, e viene definito prima dell'intervento."
  - d: "Su quali componenti si esegue questa prova?"
    r: "Su cavi, macchine e apparecchiature AT/MT dopo l'installazione o una riparazione, e come verifica periodica su impianti esistenti. L'assetto di misura — tensione, durata, criteri — si adatta al componente specifico."
  - d: "Che cosa succede se la prova rileva un'anomalia?"
    r: "La prova si interrompe prima del cedimento franco, la zona in cui la corrente di fuga si è impennata viene documentata nel referto, e indichiamo se il componente richiede riparazione, sostituzione o un approfondimento diagnostico prima di tornare in servizio."

correlati:
  - "sfra"
  - "verifica-protezioni-at-mt"
  - "misure-scariche-parziali"
---
