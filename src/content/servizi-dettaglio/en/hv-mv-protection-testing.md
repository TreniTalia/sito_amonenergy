---
titolo: "HV/MV protection testing"
lead: "Controlled injection of trip thresholds to CEI 0-16: the protection actually trips where the setting says it should, and in the time it says it will."
seoTitle: "HV/MV protection testing: I> and I>> thresholds to standard"
seoDescription: "HV/MV protection relay testing to CEI 0-16: controlled injection of the I> and I>> thresholds, trip times measured with DRTS/64 and ISA CBA 1000, threshold-by-threshold report."
ordine: 3
diagramma: "curva-tempo-corrente"

problema:
  - "A protection relay is set once, in the workshop or at commissioning, and from that moment stays silent: it only acts when something goes wrong. But precisely because it almost never acts, a relay that has drifted out of setting can stay invisible for years — the protection appears to be there, but if the fault arrives it doesn't trip where it should, or trips too late, or doesn't trip at all."
  - "There are at least two thresholds that matter: the selective one, set to trip with a delay that gives downstream protections time to act first, and the overcurrent one, set to trip almost instantly on genuinely dangerous faults. If either one drifts — because of an internal relay fault, deteriorated wiring, or a setting never updated after a network change — the plant's selectivity breaks even though everything looks fine on the surface."
  - "Testing them means injecting simulated currents and voltages into the relay's circuit and measuring, with a calibrated instrument, whether the threshold trips at the right value and in the right time. It's the only way to know the protection will do what it was set to do, before a real fault has to tell you."

parametri:
  - titolo: "I> and I>> thresholds tested individually"
    testo: "The selective threshold and the overcurrent one are tested separately, each at its own setting value: a relay can have one threshold correct and the other drifted, and only testing both reveals it."
    icona: "fa6-solid:gauge-high"
  - titolo: "Calibrated secondary injection"
    testo: "Simulated current and voltage are injected into the relay's circuit with a calibrated instrument, reproducing the fault condition without energising the real plant."
    icona: "fa6-solid:bolt"
  - titolo: "Timed trip response"
    testo: "It's not enough for the relay to trip: it has to trip in the time the setting calls for. The measured time is compared against the expected one, threshold by threshold."
    icona: "fa6-solid:stopwatch"
  - titolo: "The whole trip chain, not just the relay"
    testo: "The relay can be set correctly while the breaker opens late. We also check the actual opening time, so the outcome covers the entire protection chain."
    icona: "fa6-solid:shield-halved"
  - titolo: "Compliant with CEI 0-16"
    testo: "The thresholds, times and selectivity criteria tested are those required by the technical rule for connecting to the distributors' HV and MV networks."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Threshold-by-threshold report"
    testo: "Every threshold tested gets its own line in the report: setting value, measured value, trip time, outcome. No aggregated result that could hide a single out-of-tolerance threshold."
    icona: "fa6-solid:list-check"

fasi:
  - titolo: "Site survey and lock-out/tag-out"
    testo: "Opening the relay compartment, verifying the absence of voltage on the secondary circuits, disconnecting the breaker's trip circuits to isolate the test from network operation."
  - titolo: "Injection with the DRTS/64"
    testo: "Injecting simulated currents and voltages into the relay's secondary circuits, reproducing the fault conditions for each threshold — I> and I>> — at the declared setting values."
  - titolo: "Breaker analysis with the ISA CBA 1000"
    testo: "Measuring the actual opening time of the breaker commanded by the relay and its contact resistance: the check doesn't stop at the electronic threshold, it goes all the way to the switching device."
  - titolo: "Compliance report"
    testo: "A report with every threshold tested, the measured trip time and the outcome against the declared setting and CEI 0-16 criteria."

strumentazione:
  - modello: "DRTS/64"
    nota: "Threshold injection"
  - modello: "ISA CBA 1000"
    nota: "Breaker analysis"

assettoMisura:
  - etichetta: "Thresholds tested"
    valore: "I> and I>>"
  - etichetta: "Injection"
    valore: "Secondary, calibrated"
  - etichetta: "Measurement"
    valore: "Trip time"
  - etichetta: "Circuit status"
    valore: "Breaker disconnected"

norma:
  codice: "CEI 0-16"
  titolo: "Reference technical rule for connecting active and passive users to the distributors' HV and MV networks"
  note: "Sets the protection criteria — general and interface — that an active or passive user must meet to stay connected to the distributors' HV and MV networks: trip thresholds, times, selectivity criteria across the different protection levels. Periodic testing of thresholds and trip times is the condition for that protection, set on the bench, to actually work in the field."

faq:
  - d: "What does testing the I> and I>> thresholds mean?"
    r: "It means injecting a simulated current into the relay's circuit at or near each threshold's setting value and verifying that it trips at exactly that value and in the expected time — not earlier, not later, not at a different value."
  - d: "Why are two instruments needed, the DRTS/64 and the ISA CBA 1000?"
    r: "The DRTS/64 tests the relay: it injects the simulated quantities and measures whether the electronic threshold trips correctly. The ISA CBA 1000 tests the breaker: it measures the actual opening time and the contact resistance. A well-set protection with a slow breaker doesn't protect the plant the way it should."
  - d: "Does the test require the line to be out of service?"
    r: "Yes, for the circuits involved in the test: the relay's secondary circuits are disconnected from the breaker's real command for the duration of the injection, so the simulated fault has no effect on the network in service."
  - d: "What does the report contain?"
    r: "One line for every threshold tested, with the declared setting value, the measured value, the timed trip response, and the compliance outcome against CEI 0-16 criteria."

correlati:
  - "partial-discharge-measurement"
  - "power-transformer-testing"
  - "insulation-testing"
  - "a72-remote-tripping"
---
