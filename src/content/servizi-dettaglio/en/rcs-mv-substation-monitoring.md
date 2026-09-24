---
titolo: "RCS remote monitoring and control of MV substations"
lead: "Our proprietary remote supervision system: real-time fault analysis, automatic reclosing and data logging, with a Control Room active 24 hours a day, 365 days a year."

# Pexels photo, panumas nikhomkhai (https://www.pexels.com/photo/17489156/).
copertina: "../../../assets/img/tech/cover/rcs-monitoraggio-cabina-mt.jpg"
copertinaAlt: "Close-up of a server rack with blue indicator lights in a control room"
seoTitle: "RCS: remote MV substation monitoring"
seoDescription: "RCS, our proprietary MV substation monitoring system: real-time fault analysis, automatic reclosing, SCADA integration and a 24/7/365 Control Room."
ordine: 6
area: "controllo"
diagramma: "catena-rcs"

problema:
  - "An MV substation with no remote supervision is only visible once someone physically reaches it. A transient fault that clears itself, a switching operation that needs doing outside working hours, a parameter drifting out of range: without a system reading the plant's status in real time, the first news often comes from the client reporting a plant stoppage, not from the substation itself."
  - "RCS is the supervision and control system we developed to close that gap. It analyses the type of fault detected by the breaker, distinguishes a transient event from a persistent one, and when the fault is found to have cleared, recloses automatically without waiting for manual intervention: that is the difference between a plant down for minutes and one down for hours."
  - "Everything runs through our Control Room: a cloud web app accessible from PC, tablet and smartphone, an event history for every substation, remote protection resets and manual switching operations when an operator's action is needed. Multiple managed sites are visible from a single screen, with the same immediacy as reading a single panel."

parametri:
  - titolo: "Automatic reclosing"
    testo: "The RCS algorithm recognises the type of fault and, when it's transient and cleared, recloses the breaker without waiting for the operator: plant downtime is measured in minutes, not hours."
    icona: "fa6-solid:arrows-rotate"
  - titolo: "Cloud web app"
    testo: "A single platform accessible from PC, tablet and smartphone shows the status of every managed substation, with the ability to carry out manual switching operations remotely when human intervention is needed."
    icona: "fa6-solid:cloud"
  - titolo: "Data logging"
    testo: "Every event (fault, switching operation, reclosing, alarm) stays archived with date, time and recorded parameters: a searchable history, not just an alarm that blinks and disappears."
    icona: "fa6-solid:database"
  - titolo: "Remote protection reset"
    testo: "When an intervention doesn't require someone on site, the protection reset is carried out from the Control Room: fewer site visits, less time between the fault and restoration."
    icona: "fa6-solid:power-off"
  - titolo: "SCADA integration"
    testo: "RCS talks to the client's or distributor's SCADA systems, so substation data enters the plant's broader supervision picture without a separate platform to consult."
    icona: "fa6-solid:network-wired"
  - titolo: "Control Room 24/7/365"
    testo: "Supervision doesn't stop in the evening or on holidays: a fault at night is analysed the moment it happens, not at the first opportunity the following day."
    icona: "fa6-solid:satellite-dish"

fasi:
  - titolo: "Installing and configuring the RCS unit"
    testo: "Installing the unit in the substation, connecting it to the existing switching devices and protections, configuring the threshold parameters and automatic reclosing rules for that specific substation."
  - titolo: "Connecting to the Control Room"
    testo: "Activating the communication channel with the cloud platform, testing data transmission, and verifying the plant's status is readable in real time from the web app."
  - titolo: "Calibration and functional commissioning"
    testo: "Simulating fault events to verify the algorithm correctly distinguishes a transient from a persistent fault, and that automatic reclosing acts within the expected times and conditions."
  - titolo: "Operation and continuous supervision"
    testo: "Moving into service with the Control Room active: continuous monitoring, remote switching operations when needed, event logging, and on-call cover for field intervention when remote reclosing isn't enough."

strumentazione:
  - modello: "Remote Control System (RCS)"
    nota: "Proprietary system"
  - modello: "Cloud web app"
    nota: "Supervision and switching"

norma:
  codice: "CEI EN 50110-1"
  titolo: "Operation of electrical installations"
  note: "A remote switching operation, such as an automatic reclosing or a protection reset commanded from the Control Room, remains an act of operating the electrical installation, with the same safety criteria as an operation carried out on site. RCS doesn't replace this framework: it automates what can be automated safely and leaves the rest to a qualified operator where an on-site decision is needed."

faq:
  - d: "What is the RCS system?"
    r: "It's Amon Energy's proprietary supervision and control system for MV substations: it analyses the plant's status in real time, recognises transient faults, and automatically recloses the breaker once the fault has cleared, all overseen by our Control Room, active 24 hours a day."
  - d: "How does automatic reclosing work?"
    r: "The RCS algorithm distinguishes a transient fault, which clears on its own, from a persistent one. In the first case it recloses the breaker without waiting for manual intervention; in the second it keeps it open and flags the event to the Control Room for an operator's assessment."
  - d: "What data is logged?"
    r: "Every relevant event (faults, switching operations, reclosing, alarms and protection resets) is recorded with date, time and parameters, so the substation's history is always available to consult, not just the latest real-time status."
  - d: "Can RCS talk to the client's SCADA?"
    r: "Yes, SCADA integration brings substation data inside the client's or distributor's wider supervision system, avoiding a separate platform to consult in parallel."
  - d: "What happens outside office hours?"
    r: "Nothing changes: the Control Room is active 24 hours a day, 365 days a year, and a fault at night or on a holiday is analysed the moment it occurs."

correlati:
  - "cci-central-plant-controller"
  - "power-transformer-testing"
  - "insulation-testing"
  - "meter-reading"
---
