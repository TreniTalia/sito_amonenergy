---
titolo: "Misure di scariche parziali su cavi, quadri e trasformatori"
lead: "Diagnosi delle scariche parziali secondo IEC 60270: la carica apparente in picocoulomb rivela un difetto di isolamento prima che diventi un guasto franco."

# Foto Pexels, Magda Ehlers (https://www.pexels.com/photo/37517742/).
copertina: "../../../assets/img/tech/cover/misure-scariche-parziali.jpg"
copertinaAlt: "Cavo elettrico arrotolato su un palo di legno contro un cielo grigio"
seoTitle: "Misure scariche parziali AT/MT: diagnosi in pC"
seoDescription: "Misure di scariche parziali su cavi, quadri e trasformatori AT/MT secondo IEC 60270: carica apparente in pC, localizzazione con metodi non convenzionali."
ordine: 2
area: "diagnostica"
diagramma: "scariche-parziali"

problema:
  - "Un isolamento non cede tutto in una volta. Prima cede in un punto microscopico (una bolla d'aria in una resina, un difetto di posa in un giunto, un affilamento sul bordo di uno schermo), e in quel punto, ogni volta che il campo elettrico ci passa sopra, scocca una scarica piccolissima. Nessun interruttore la vede, nessuna prova di isolamento a bassa tensione la intercetta: la macchina resta in servizio, apparentemente sana, mentre il difetto lavora."
  - "Le scariche parziali sono proprio questo: scariche localizzate che non attraversano l'intero isolamento fra due conduttori, ma erodono progressivamente il punto in cui si innescano. Con il tempo il canale si allunga, l'energia scaricata cresce, e quello che oggi è un impulso di pochi picocoulomb diventa domani un cedimento completo, spesso senza preavviso, in un momento imprevedibile."
  - "Misurarle in campo, su un impianto in servizio o durante un fuori servizio programmato, significa vedere il difetto mentre è ancora un impulso e non un'interruzione. È la differenza fra una manutenzione programmata su un giunto o una cella e un guasto che ferma la produzione."

parametri:
  - titolo: "Carica apparente in picocoulomb"
    testo: "Il metodo convenzionale della IEC 60270 misura la carica apparente in pC: non l'energia reale della scarica, che resta interna al dielettrico, ma la sua impronta elettrica misurabile ai capi del circuito di prova."
    icona: "fa6-solid:wave-square"
  - titolo: "Circuito di misura schermato"
    testo: "Una buona schermatura del circuito di misura abbassa la soglia di rilevazione: gli impulsi che restano nel rumore di fondo di un circuito meno curato qui si leggono."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Misura in tensione alternata"
    testo: "Il metodo convenzionale della IEC 60270 si applica alle misure di scariche parziali in alta tensione, con prova condotta in tensione alternata."
    icona: "fa6-solid:bolt"
  - titolo: "Localizzazione non convenzionale"
    testo: "Dove la geometria dell'impianto lo richiede, ai metodi convenzionali in pC affianchiamo tecniche UHF e acustiche: non sono calibrabili in carica, ma individuano il punto esatto del difetto."
    icona: "fa6-solid:satellite-dish"
  - titolo: "Soglia di allarme e trend"
    testo: "Un impulso isolato di bassa energia non è la stessa cosa di un livello che cresce misura dopo misura. Il confronto nel tempo, dove la storia della macchina lo consente, dice se il difetto sta progredendo."
    icona: "fa6-solid:triangle-exclamation"
  - titolo: "Referto con spettro e diagnosi"
    testo: "Consegniamo il livello di carica apparente rilevato, la distribuzione nel tempo degli impulsi, la localizzazione quando eseguita, e l'indicazione se il componente può restare in servizio."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Sopralluogo e scelta del punto di misura"
    testo: "Individuazione dei punti di accesso al circuito (terminali di cavo, giunti, celle MT, passanti di trasformatore) e verifica delle condizioni di schermatura necessarie a raggiungere la sensibilità richiesta."
  - titolo: "Messa in sicurezza e collegamento"
    testo: "Dove la misura richiede il fuori servizio, sezionamento e messa a terra del componente. Dove è compatibile con l'esercizio, collegamento del sensore senza interruzione della fornitura."
  - titolo: "Misura con il b2 HVA68TD+PD"
    testo: "Rilievo della carica apparente in picocoulomb secondo il metodo convenzionale IEC 60270, ripetuto su ogni fase e ogni punto di accesso individuato. Dove serve, localizzazione con metodi UHF o acustici."
  - titolo: "Referto e confronto nel tempo"
    testo: "Relazione con i livelli misurati, la diagnosi e l'indicazione operativa. Dove esiste una misura precedente sullo stesso componente, il confronto dice se il difetto è stabile o in progressione."

strumentazione:
  - modello: "b2 HVA68TD+PD"
    nota: "Misura e localizzazione"

assettoMisura:
  - etichetta: "Metodo"
    valore: "Convenzionale, carica pC"
  - etichetta: "Unità di misura"
    valore: "Picocoulomb (pC)"
  - etichetta: "Tensione di prova"
    valore: "Alternata (AC)"

norma:
  codice: "IEC 60270 / CEI EN 60270"
  titolo: "High-voltage test techniques: Partial discharge measurements"
  note: "Si applica alle misure di scariche parziali in alta tensione: il metodo convenzionale misura la carica apparente in picocoulomb (pC). Esistono anche metodi non convenzionali (UHF, acustici) che non sono calibrabili in carica ma sono utili alla localizzazione del punto di innesco."

faq:
  - d: "Che cosa misura esattamente una prova di scariche parziali?"
    r: "Misura la carica apparente degli impulsi di scarica localizzata dentro l'isolamento, espressa in picocoulomb secondo il metodo convenzionale della IEC 60270. Non è l'energia reale della scarica, che resta interna al materiale, ma la sua impronta elettrica misurabile dall'esterno."
  - d: "Il componente deve essere fuori servizio?"
    r: "Dipende dal punto di misura e dall'accessibilità del circuito. Alcune misure si eseguono a impianto in esercizio, altre richiedono il fuori servizio per collegare correttamente il sensore. Lo valutiamo caso per caso durante il sopralluogo."
  - d: "Qual è la differenza fra metodo convenzionale e non convenzionale?"
    r: "Il metodo convenzionale della IEC 60270 restituisce un valore calibrato in picocoulomb, confrontabile nel tempo e con soglie di riferimento. I metodi non convenzionali (UHF, acustici) non sono calibrabili in carica, ma permettono di localizzare fisicamente il punto in cui la scarica si innesca."
  - d: "Un livello di scariche parziali basso significa che va tutto bene?"
    r: "Da solo non basta: conta anche il trend. Un livello stabile nel tempo è un indicatore diverso da uno che cresce misura dopo misura, anche restando sotto una soglia assoluta. Per questo, dove la storia del componente lo consente, confrontiamo sempre la misura di oggi con quelle precedenti."

correlati:
  - "sfra"
  - "verifica-protezioni-at-mt"
  - "verifiche-trasformatori-di-potenza"
---
