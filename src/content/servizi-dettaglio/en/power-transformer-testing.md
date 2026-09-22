---
titolo: "Power transformer testing"
lead: "Turns ratio, winding resistance, tan delta: the tests that say whether a transformer is still what it was built to be."
seoTitle: "Power transformer testing: diagnostic checks"
seoDescription: "Power transformer testing: turns ratio, winding resistance, tan delta and capacitance measurements with ISA T2000 and ISA STS5000 + TD500."
ordine: 4
diagramma: "punti-misura-trasformatore"

problema:
  - "A power transformer is a substation's most expensive and most critical machine, and also the hardest to replace in an emergency: an unplanned failure can stop a plant for weeks. Periodic testing exists to catch degradation before it becomes a fault, while the machine can still be repaired or scheduled for replacement."
  - "Every point on the machine tells a different story. Turns ratio and winding resistance say whether the turns are intact and the tap changer's contacts are making good contact. Tan delta and insulation capacitance say whether the paper and oil are ageing or have taken on moisture. Excitation current says whether the core is working as it should. None of these tests sees everything on its own: it's the combination that builds the diagnosis."
  - "These are non-destructive measurements, taken out of service with the same instrumentation every time: only then is today's value comparable with the previous campaign's, and it's the change over time — not the single number — that says whether the machine is ageing normally or has a problem developing."

parametri:
  - titolo: "Turns ratio"
    testo: "Comparing primary and secondary voltage on every tap position: a deviation indicates shorted turns or a contact problem on the tap changer itself."
    icona: "fa6-solid:ruler"
  - titolo: "Winding resistance"
    testo: "DC measurement on every phase and every tap: identifies loose joints, deteriorated brazing or damaged turns, and checks the tap changer's contact under load."
    icona: "fa6-solid:gauge-high"
  - titolo: "Tan delta and insulation capacitance"
    testo: "The insulation's loss angle grows with the ageing of the paper and oil, or with moisture ingress. The measured capacitance is compared against the nameplate value and against previous measurements."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Excitation current"
    testo: "Measuring the no-load current on the magnetic circuit: a deviation between phases signals a core problem or a shorted winding."
    icona: "fa6-solid:bolt"
  - titolo: "On-load tap changer"
    testo: "Checking contact resistance at every tap position: it's the most mechanically stressed part of the machine, and the first to deteriorate with repeated operations."
    icona: "fa6-solid:shield-halved"
  - titolo: "Report per measurement point"
    testo: "Every quantity measured at every point on the machine, compared against the nameplate data and — where available — against the previous campaign, with a recommendation on whether the machine can stay in service."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Site survey and lock-out/tag-out"
    testo: "Isolating and earthing the transformer, opening the line connections, recording the machine's actual configuration and the tap positions to be tested."
  - titolo: "Ratio, resistance and excitation with the ISA T2000"
    testo: "Measuring the turns ratio at every tap, the winding resistance on every phase, and the excitation current, repeated in the configuration required by the campaign."
  - titolo: "Tan delta and capacitance with the ISA STS5000 + TD500"
    testo: "Measuring the loss angle and the insulation capacitance between windings and to earth, compared against the nameplate data and previous measurements where available."
  - titolo: "Report and historical comparison"
    testo: "A report with the values measured at every point, the comparison against the nameplate and the previous campaign, and a recommendation on whether the machine can return to service or needs further investigation."

strumentazione:
  - modello: "ISA T2000"
    nota: "Ratio and resistance"
  - modello: "ISA STS5000 + TD500"
    nota: "Tan delta and capacitance"

assettoMisura:
  - etichetta: "Measurement points"
    valore: "HV, LV, neutral, OLTC"
  - etichetta: "Machine status"
    valore: "Out of service, earthed"
  - etichetta: "Repetition"
    valore: "Every phase, every tap"
  - etichetta: "Comparison"
    valore: "Against nameplate and history"

norma:
  codice: "IEC 60076-1"
  titolo: "Power transformers – Part 1: General"
  note: "Sets the general requirements for power transformers — rated power, voltage, vector group, nameplate data — and classifies tests into routine, type and special tests, referring to the later parts of the same family for specific tests: frequency response, for example, is standardised separately by IEC 60076-18. It's the base on which the routine checks we carry out on every machine build."

faq:
  - d: "What's the difference between these tests and the SFRA test?"
    r: "These tests measure specific electrical quantities — ratio, resistance, tan delta, excitation — at specific points on the machine. SFRA measures the frequency response of the entire winding and sees the internal geometry, including mechanical deformations that point measurements don't intercept. They're often carried out in the same campaign, because they complement each other."
  - d: "Does the transformer need to be out of service?"
    r: "Yes, all the measurements on this page are taken with the machine isolated, earthed and with the line connections open: they are low-energy electrical measurements, not compatible with operating voltage."
  - d: "What does tan delta tell you that the other measurements don't?"
    r: "Tan delta is sensitive to insulation ageing — paper and oil — and to moisture ingress: two phenomena that turns ratio or winding resistance don't see, because they concern the insulation, not the conductor."
  - d: "When is it worth running this testing campaign?"
    r: "As periodic predictive maintenance, after a repair or revamping, before commissioning a new or used machine, and whenever another test — thermography, oil analysis — flags an anomaly to investigate further."

correlati:
  - "sfra"
  - "hv-mv-protection-testing"
  - "rcs-mv-substation-monitoring"
---
