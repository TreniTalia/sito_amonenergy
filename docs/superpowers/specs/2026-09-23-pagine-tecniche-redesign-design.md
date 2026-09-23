# Redesign delle pagine tecniche di dettaglio

Data: 2026-09-23. Branch: `feat/migrazione-seo`. Approvato in chat dal cliente,
sezione per sezione.

## 1. Contesto e perimetro

Le nove pagine tecniche (`/servizi/<slug>/`, gemelle in `/en/services/<slug>/`)
condividono un solo template, `src/components/tech/TechDetailPage.astro`. Il
cliente, rivedendo `/servizi/sfra/`, ha chiesto sei cose:

1. una foto di cover a inizio pagina, come nelle pagine classiche;
2. un rapporto equilibrato fra testi e immagini;
3. grafici «veri e fatti bene»;
4. fasce alternate correttamente, senza testi orfani dove il design system
   prevede un'immagine accanto;
5. FAQ armonica con il resto del sito, non una colonna sola a sinistra;
6. lo stesso pre-footer delle pagine classiche, e box uniformi.

**Perimetro deciso:** tutte e nove le pagine, in entrambe le lingue (18 pagine).
Il template è uno solo, e correggerne una sola le separerebbe dalle sorelle.

**Grafici «veri» significa calcolati dalla fisica** (scelta del cliente fra
«calcolati», «dati vostri», «misto»): curve generate da modelli e formule reali,
con assi e unità corretti. Nessun dato di un cliente reale.

### 1.1 Decisione che ribalta la spec precedente

`docs/superpowers/specs/2026-09-22-migrazione-seo-design.md` §3.2 stabiliva
«Elementi grafici, nessuna fotografia» su queste pagine, e
`test/tech-pages.test.mjs` lo verifica. Il cliente ora chiede la foto di cover
e la foto del caso reale. **Quel divieto decade**: il test va riscritto per
verificare il contrario (cover presente), non cancellato.

## 2. Struttura della pagina

| # | Fascia | Fondo | Contenuto |
|---|---|---|---|
| 1 | Cover | foto | `PageHero` con la foto della pagina: stesso filtro, stesso velo e stessa struttura (occhiello, H1, sottotitolo) delle cover di Servizi e Lavori |
| 2 | Che cosa rivela | `paper` | occhiello, **H2 visibile** (oggi `sr-only`) e paragrafi a sinistra (1.05fr); grafico a destra (0.95fr), `sticky` mentre il testo scorre |
| 3 | Parametri di prova | `navy-100` | griglia di box alti uguali riga per riga |
| 4 | Come si svolge | `navy-950` | `ProcessSteps`, invariato nel contenuto |
| 5 | Norma e strumentazione | alternato | testo della norma a sinistra, `SpecPanel` a destra |
| 6 | In campo (solo se c'è `caso`) | alternato | testo e pulsante a sinistra, **foto del progetto collegato** a destra, 4:3 |
| 7 | Domande frequenti | alternato | **due colonne**: a sinistra occhiello, H2, una riga di testo e pulsante «Chiamaci», `sticky`; a destra l'accordion a tutta colonna |
| 8 | Verifiche collegate | alternato | card `ServiceCard` elevate, le stesse della pagina Servizi |
| 9 | Pre-footer | foto | `CtaBand` classica della home, titolo standard |

**Regola di alternanza.** Dalla fascia 5 in poi i fondi si assegnano per
posizione: `paper`, `navy-100`, `paper`, `navy-100`… calcolati sull'elenco
delle fasce effettivamente presenti. Così una pagina senza `caso` non mette mai
due fasce uguali una dopo l'altra. Due fasce navy non sono mai adiacenti: la
sola fascia navy piena è la 4, fra un `navy-100` e un fondo chiaro.

**Uniformità dei box.** Parametri, strumentazione, FAQ e verifiche collegate
usano un'unica famiglia: pannello in vetro navy, `--radius-card`, ombra
`--shadow-md`, bordo chiaro sottile. I box bianchi `.correlato` spariscono. In
ogni griglia i box di una riga sono alti uguali (`h-full` e contenuto di chiusura
spinto sul fondo, come in `ServiceCard`).

**Pre-footer.** `TechCtaBand.astro` viene rimosso; al suo posto `CtaBand`
senza `headline`, come in home, Lavori e Servizi.

**Testi.** I titoli H2 nuovi (Che cosa rivela, Domande frequenti) e la riga di
testo della FAQ sono stringhe del template in IT e EN, senza lineette usate come
pausa.

## 3. Grafici

### 3.1 Principio

I grafici si calcolano **a build** e si emettono come SVG statico: nessun
JavaScript nel browser, nessuna libreria di grafici. Ogni modello è un modulo
TypeScript puro in `src/components/tech/charts/models/`, testabile da solo.
Un generatore pseudocasuale con seme fisso (mulberry32) rende deterministici i
grafici che hanno una componente casuale: la stessa build produce lo stesso SVG.

### 3.2 Telaio comune: `ChartFrame.astro`

Un solo componente disegna assi, griglia, legenda e didascalia per tutti i
grafici a dati. Accetta:

- asse X e asse Y (e un secondo asse Y facoltativo), ciascuno `linear` o `log`,
  con dominio, tacche, formato delle etichette e unità;
- serie di tipo `line` o `scatter`, con colore dal design system;
- bande evidenziate (per esempio la regione di scostamento della SFRA);
- legenda e didascalia, questa sempre con la dicitura «Curva calcolata da
  modello» o «Calcolato da modello» (EN: «Computed from a model»).

Stile: fondo navy del pannello, griglia sottile, tacche da strumento, verde solo
come micro-accento, come i grafici attuali e `CoverageMap`. Leggibile a 390px:
etichette mai sotto 11px effettivi.

### 3.3 I quattro grafici a dati

| Pagina | Grafico | Modello |
|---|---|---|
| SFRA | modulo di risposta in frequenza, dB, 20 Hz – 2 MHz, X logaritmico | rete a scala RLC dell'avvolgimento (induttanza serie con capacità fra spire in parallelo, capacità verso terra, perdite resistive, ramo di magnetizzazione), risolta con matrici ABCD in cascata, sorgente e misura su 50 Ω come prescrive IEC 60076-18. Due serie: impronta di riferimento e misura su avvolgimento deformato (capacità verso terra aumentate su un gruppo di sezioni); le due curve si separano davvero sopra ~100 kHz, e lì cade la banda evidenziata |
| Scariche parziali | diagramma PRPD: carica apparente in pC contro fase 0–360° | impulsi concentrati sui fronti di salita delle due semionde, tipici di una cavità interna, ampiezze log-normali, generati con seme fisso; sinusoide di riferimento su un secondo asse, in kV |
| Protezioni AT/MT | caratteristica tempo–corrente, log-log | I> a tempo inverso IEC 60255-151 «standard inverse», t = TMS · 0,14 / ((I/Is)^0,02 − 1); I>> a tempo definito; punti di iniezione della prova con il tempo misurato |
| Isolamento | rampa di tensione e corrente di fuga su due assi (kV a sinistra, µA a destra) | corrente di carica C·dV/dt più conduzione V/R; isolamento sano (R costante) contro compromesso (R che crolla sopra una soglia di tensione) |

I valori dei parametri (Is, TMS, tensione di prova, durata della rampa…) si
allineano al testo della pagina corrispondente: il grafico non può contraddire
il paragrafo che gli sta accanto.

### 3.4 I cinque schemi

RCS, CCI, A.72 e contatori sono catene di sistema, e i punti di misura del
trasformatore sono una sagoma tecnica: nessuno dei cinque è un grafico a dati. Si
ridisegnano con primitive comuni (`DiagramBox`, freccia, etichetta di flusso) su
una griglia fissa: stessa larghezza dei box, stesso passo, testo che va a capo su
al massimo due righe e non esce mai dal box. Oggi «Protezione di interfaccia»
esce dal suo riquadro nel teledistacco.

## 4. Immagini

- **Cover:** una foto Pexels per pagina, 9 in tutto, stesso soggetto per la
  gemella inglese. Ritagliata a 3:2 e 2400px nel file, come le altre cover. Toni
  freddi, niente volti riconoscibili, niente marchi di terzi, niente foto già
  usate altrove nel sito.
- **In campo:** la foto del progetto collegato (`progetti/<id>.immagine`). Se il
  progetto non ha foto, la fascia resta a una colonna: nessuna foto di
  repertorio spacciata per un nostro cantiere.
- **Schema:** due campi nuovi nella collection `serviziDettaglio`,
  `copertina: image()` e `copertinaAlt: z.string()`. Il pannello CMS li espone
  (widget immagine e testo), con un hint che chiede di usare la stessa foto
  sulla gemella inglese.
- Ogni foto Pexels porta nel Markdown un commento con autore e URL, come le
  altre foto del sito.

## 5. Test

- `test/tech-pages.test.mjs`: il divieto di fotografie diventa «la cover c'è»:
  il primo `<img>` dentro `<main>` sta nella cover e ha un `alt` non vuoto.
- Nuovo test di layout Playwright sulle 18 pagine, a 1024, 1440 e 390px:
  box dei parametri alti uguali per riga; FAQ su due colonne da 1024px; nessuna
  coppia di fasce adiacenti con lo stesso fondo; pre-footer `.cta-band`
  presente e nessuna traccia di `TechCtaBand`.
- Test unitari dei modelli: la SFRA di riferimento e quella deformata
  differiscono meno di 1 dB sotto 10 kHz e più di 3 dB in almeno un punto sopra
  100 kHz; la curva IEC restituisce i tempi della formula per I/Is = 2, 5, 10;
  il PRPD con lo stesso seme è identico fra due chiamate.
- Il test esistente sulle stringhe italiane nei diagrammi inglesi resta.

## 6. Fuori perimetro

- Il testo delle pagine tecniche non cambia, salvo le stringhe nuove del
  template.
- `ProcessSteps` non cambia nel contenuto.
- Nessun dato di misura reale: se il cliente ne fornirà, sostituirà le curve
  calcolate in un lavoro separato.

## 7. Criteri di accettazione

1. Tutte le 18 pagine hanno la cover fotografica, alta come quelle delle pagine
   classiche.
2. Nessuna fascia con testo senza immagine o pannello accanto, dove il layout ne
   prevede uno.
3. Fondi alternati senza ripetizioni adiacenti, su pagine con e senza `caso`.
4. FAQ su due colonne da 1024px.
5. Pre-footer uguale a quello della home.
6. Box della stessa famiglia e alti uguali per riga.
7. I quattro grafici a dati sono calcolati da modello, con assi, unità e
   didascalia corretti; i cinque schemi non hanno testo che esce dai box.
8. `npm run build && npm test` verde.
