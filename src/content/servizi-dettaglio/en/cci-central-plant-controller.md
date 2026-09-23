---
titolo: "CCI: Central Plant Controller"
lead: "Installation, configuration and management of the Central Plant Controller in partnership with Teamware: the observability and controllability functions required by the distributor, compliant with CEI 0-16 V5."

# Pexels photo, Neville Hawkins (https://www.pexels.com/photo/37061434/).
copertina: "../../../assets/img/tech/cover/cci-controllore-centrale-impianto.jpg"
copertinaAlt: "Solar farm with rows of panels and a technical cabin under a cloudy sky"
seoTitle: "CCI Central Plant Controller: PF1, PF2, CEI 0-16"
seoDescription: "Installation and management of the Central Plant Controller (CCI) in partnership with Teamware: PF1 observability and PF2 controllability functions compliant with CEI 0-16 V5 and ARERA Resolution 564/2025/R/eel."
ordine: 7
area: "controllo"
diagramma: "osservabilita-controllabilita"

problema:
  - "A distributor accepting a generation plant onto the network needs two things a passive plant doesn't require: to know at all times how it's performing, and to be able to limit the power it injects when the network requires it. Without a dedicated device, neither is possible from outside the plant."
  - "The Central Plant Controller is that device. It reads the plant's operating parameters and makes them available to the distributor (the function CEI 0-16 V5 calls PF1, observability) and receives the distributor's command to limit the active power injected, down to zero if necessary: this is the PF2 function, controllability."
  - "We install, configure and manage the CCI in partnership with Teamware: from choosing the configuration best suited to the plant through to day-to-day operation, so that PF1 and PF2 stay operational without the client having to worry about it."

parametri:
  - titolo: "PF1 · Observability"
    testo: "The CCI reads the plant's operating parameters in real time and makes them available to the distributor: this is the condition for the network to know how every connected plant is performing."
    icona: "fa6-solid:eye"
  - titolo: "PF2 · Controllability"
    testo: "On the distributor's command, the CCI limits the active power the plant injects into the network, down to zero if network safety requires it."
    icona: "fa6-solid:sliders"
  - titolo: "Compliant with CEI 0-16 V5"
    testo: "The PF1 and PF2 functions are those defined by version 5 of the technical rule for connecting to HV and MV networks, the reference the distributor applies to every active plant."
    icona: "fa6-solid:clipboard-check"
  - titolo: "ARERA Resolution 564/2025/R/eel"
    testo: "The resolution sets out the timing and procedures for bringing plants already connected up to the observability and controllability functions, with the incentives provided for those who meet the deadlines."
    icona: "fa6-solid:gauge-high"
  - titolo: "In partnership with Teamware"
    testo: "Installation, configuration and management of the CCI are carried out in partnership with Teamware: the technological expertise on the device is shared, the direct relationship with the plant stays ours."
    icona: "fa6-solid:handshake"
  - titolo: "Integration with RCS"
    testo: "Where the plant is already supervised by our RCS system, CCI data enters the same control picture, with no separate platform to consult."
    icona: "fa6-solid:network-wired"

fasi:
  - titolo: "Plant analysis and configuration choice"
    testo: "Checking the installed power, the connection point and the applicable requirements, to define which CCI configuration that specific plant needs."
  - titolo: "Installation and configuration, with Teamware"
    testo: "Installing the device, configuring the PF1 and PF2 functions and the communication parameters with the distributor, in partnership with Teamware."
  - titolo: "Commissioning of the PF1 and PF2 functions"
    testo: "Verifying that observability returns data consistent with the plant's actual status, and that the active-power limitation command, sent as a test, is executed correctly."
  - titolo: "Operation and ongoing management"
    testo: "Bringing the CCI into service with management handed over to our team: monitoring correct operation and intervening in the event of an anomaly on the observability or controllability functions."

strumentazione:
  - modello: "Central Plant Controller (CCI)"
    nota: "Managed device"

norma:
  codice: "CEI 0-16 V5"
  titolo: "Technical rule for connection to HV and MV networks: observability and controllability functions"
  note: "Version 5 of CEI 0-16 introduces the PF1 function (observability: the CCI reads and makes the plant's status available to the distributor) and PF2 (controllability: the distributor can limit the active power injected, down to zero). ARERA Resolution 564/2025/R/eel sets out the timing and incentives for bringing plants already connected up to these functions."

faq:
  - d: "What exactly does the Central Plant Controller do?"
    r: "It makes the plant observable and controllable by the distributor: it reads the operating parameters and transmits them (PF1 function), and receives the command to limit the active power injected into the network when the distributor requires it (PF2 function)."
  - d: "What's the difference between PF1 and PF2?"
    r: "PF1 is observability: the CCI makes the plant's status readable to the distributor. PF2 is controllability: based on an external command from the distributor, the CCI limits the active power injected, down to zero if necessary. The first is reading, the second is command."
  - d: "Who is Teamware and what's their role?"
    r: "Teamware is the technology partner we install, configure and manage the CCI with. Expertise on the device and on integrating the functions the distributor requires is shared with them; the relationship with the plant and its day-to-day management stay ours."
  - d: "What is ARERA Resolution 564/2025/R/eel?"
    r: "It's the resolution setting out the timing and procedures by which plants already connected to the network must be brought up to the observability and controllability functions, with the incentives provided for those who meet the stated deadlines."
  - d: "Does the CCI also apply to plants already in operation?"
    r: "Yes. Plants connected before these requirements were introduced can be brought up to date by installing a CCI: it's the most common case among the requests we handle together with Teamware, not just new connections."

correlati:
  - "rcs-mv-substation-monitoring"
  - "a72-remote-tripping"
  - "hv-mv-protection-testing"
---
