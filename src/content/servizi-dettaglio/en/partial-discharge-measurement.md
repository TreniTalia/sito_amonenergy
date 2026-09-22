---
titolo: "Partial discharge measurement on cables, switchgear and transformers"
lead: "Partial discharge diagnostics to IEC 60270: apparent charge in picocoulombs reveals an insulation defect before it becomes a full breakdown."
seoTitle: "Partial discharge testing HV/MV: pC diagnostics"
seoDescription: "Partial discharge measurement on HV/MV cables, switchgear and transformers to IEC 60270: apparent charge in pC, location with non-conventional methods."
ordine: 2
diagramma: "scariche-parziali"

problema:
  - "Insulation doesn't fail all at once. It first fails at a microscopic point — an air bubble in a resin, a defect in a joint's assembly, a sharp edge on a screen — and at that point, every time the electric field passes over it, a tiny discharge fires. No circuit breaker sees it, no low-voltage insulation test picks it up: the machine stays in service, apparently healthy, while the defect keeps working."
  - "That is exactly what partial discharges are: localised discharges that don't bridge the full insulation between two conductors, but progressively erode the point where they ignite. Over time the channel lengthens, the discharged energy grows, and what is today a pulse of a few picocoulombs becomes tomorrow a complete breakdown — often without warning, at an unpredictable moment."
  - "Measuring them in the field, on a plant in service or during a scheduled outage, means seeing the defect while it is still a pulse and not yet an outage. That's the difference between scheduled maintenance on a joint or a cell and a fault that stops production."

parametri:
  - titolo: "Apparent charge in picocoulombs"
    testo: "The conventional method in IEC 60270 measures the apparent charge in pC: not the discharge's real energy, which stays inside the dielectric, but its measurable electrical footprint at the terminals of the test circuit."
    icona: "fa6-solid:wave-square"
  - titolo: "Shielded measurement circuit"
    testo: "Good shielding of the measurement circuit lowers the detection threshold: pulses that would stay in the noise floor of a less carefully shielded circuit are read here."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "AC voltage measurement"
    testo: "The conventional method in IEC 60270 applies to partial discharge measurements in high voltage, with the test run under AC voltage."
    icona: "fa6-solid:bolt"
  - titolo: "Non-conventional location"
    testo: "Where the plant's geometry requires it, we combine conventional pC methods with UHF and acoustic techniques: they can't be calibrated in charge, but they pinpoint the exact location of the defect."
    icona: "fa6-solid:satellite-dish"
  - titolo: "Alarm threshold and trend"
    testo: "An isolated low-energy pulse isn't the same as a level that grows from one measurement to the next. Comparison over time, where the machine's history allows it, shows whether the defect is progressing."
    icona: "fa6-solid:triangle-exclamation"
  - titolo: "Report with spectrum and diagnosis"
    testo: "We deliver the detected apparent charge level, the time distribution of the pulses, the location when carried out, and whether the component can remain in service."
    icona: "fa6-solid:clipboard-check"

fasi:
  - titolo: "Site survey and choice of measurement point"
    testo: "Identifying access points to the circuit — cable terminations, joints, MV cells, transformer bushings — and checking the shielding conditions needed to reach the required sensitivity."
  - titolo: "Lock-out/tag-out and connection"
    testo: "Where the measurement requires an outage, isolating and earthing the component. Where it's compatible with operation, connecting the sensor without interrupting the supply."
  - titolo: "Measurement with the b2 HVA68TD+PD"
    testo: "Recording the apparent charge in picocoulombs by the conventional IEC 60270 method, repeated on every phase and every access point identified. Where needed, location with UHF or acoustic methods."
  - titolo: "Report and comparison over time"
    testo: "A report with the measured levels, the diagnosis and the operational recommendation. Where a previous measurement exists on the same component, the comparison shows whether the defect is stable or progressing."

strumentazione:
  - modello: "b2 HVA68TD+PD"
    nota: "Measurement and location"

assettoMisura:
  - etichetta: "Method"
    valore: "Conventional, pC charge"
  - etichetta: "Unit of measurement"
    valore: "Picocoulomb (pC)"
  - etichetta: "Test voltage"
    valore: "Alternating (AC)"

norma:
  codice: "IEC 60270 / CEI EN 60270"
  titolo: "High-voltage test techniques – Partial discharge measurements"
  note: "Applies to partial discharge measurements in high voltage: the conventional method measures the apparent charge in picocoulombs (pC). Non-conventional methods also exist — UHF, acoustic — which can't be calibrated in charge but are useful for locating the ignition point."

faq:
  - d: "What exactly does a partial discharge test measure?"
    r: "It measures the apparent charge of localised discharge pulses inside the insulation, expressed in picocoulombs under the conventional method of IEC 60270. It is not the discharge's real energy, which stays inside the material, but its electrical footprint measurable from outside."
  - d: "Does the component need to be out of service?"
    r: "It depends on the measurement point and the circuit's accessibility. Some measurements are taken with the plant in operation, others require an outage to connect the sensor correctly. We assess it case by case during the site survey."
  - d: "What's the difference between the conventional and non-conventional method?"
    r: "The conventional IEC 60270 method returns a value calibrated in picocoulombs, comparable over time and against reference thresholds. Non-conventional methods — UHF, acoustic — can't be calibrated in charge, but they let you physically locate the point where the discharge ignites."
  - d: "Does a low partial discharge level mean everything is fine?"
    r: "On its own, no — the trend matters too. A level that's stable over time is a different indicator from one that grows from measurement to measurement, even while staying below an absolute threshold. That's why, where the component's history allows it, we always compare today's measurement against previous ones."

correlati:
  - "sfra"
  - "hv-mv-protection-testing"
  - "power-transformer-testing"
---
