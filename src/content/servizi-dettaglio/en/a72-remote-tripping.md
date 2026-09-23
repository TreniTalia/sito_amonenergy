---
titolo: "Remote tripping under Allegato A.72"
lead: "Testing and diagnostics of RIGEDI devices and A72 modems, commissioning support, performance analysis and SCADA integration: the channel through which the distributor commands the plant's disconnection when the network requires it."
seoTitle: "A72 remote tripping: RIGEDI and modem testing"
seoDescription: "Testing and diagnostics of RIGEDI devices and A72 modems, commissioning support, performance analysis and SCADA integration for remote tripping of generation plants under Allegato A.72."
ordine: 8
area: "controllo"
diagramma: "catena-a72"

problema:
  - "A generation plant connected to the MV network doesn't decide on its own when to stay in service: under certain network risk conditions, the distributor must be able to command a remote disconnection. This is the function described by Allegato A.72 to the Codice di Rete, applied through the procedure everyone in the field calls RIGEDI, and implemented on the plant with a dedicated device and a modem that receives the command."
  - "The device alone isn't enough: it has to be tested, kept in working order and integrated with the rest of the plant so that the disconnection command — and, just as important, the reconnection one — actually arrives and is executed within the required time. A modem that doesn't respond, or a badly configured interface protection, turns a network safety requirement into a blind spot."
  - "We test and diagnose RIGEDI devices and the A72 modem, support commissioning, analyse the connection's performance and the system's compliance, support communication with the distributor during activation, and integrate everything with the plant's SCADA, so remote tripping is a verified channel, not just an installed one."

parametri:
  - titolo: "RIGEDI device testing"
    testo: "Functional check of the interface protection that receives and executes the disconnection command, as required by Allegato A.72."
    icona: "fa6-solid:shield-halved"
  - titolo: "A72 modem diagnostics"
    testo: "Checking the channel that receives the command from the distributor: the modem is the point where a remote trip that never arrived stays invisible until someone looks for it."
    icona: "fa6-solid:tower-broadcast"
  - titolo: "Assisted commissioning"
    testo: "Technical support during activation, from device configuration through to the first command test with the distributor."
    icona: "fa6-solid:clipboard-check"
  - titolo: "Performance analysis"
    testo: "Checking the system's response times and the compliance of the device's behaviour against what's required for remote tripping and reconnection."
    icona: "fa6-solid:magnifying-glass-chart"
  - titolo: "Support in communication with the distributor"
    testo: "Assistance in technical exchanges with the distributor for activations, periodic checks and handling anomalies on the remote-tripping channel."
    icona: "fa6-solid:people-arrows"
  - titolo: "SCADA integration"
    testo: "The remote-tripping device's status enters the plant's supervision system, visible alongside the other operating parameters instead of on a separate channel."
    icona: "fa6-solid:network-wired"

fasi:
  - titolo: "Site survey and check of the existing device"
    testo: "Checking the status of the RIGEDI device and A72 modem already installed, or assessing the configuration needed for a newly connecting plant."
  - titolo: "Commissioning and first test with the distributor"
    testo: "Configuring the device, activating the communication channel and running a command-reception test agreed with the distributor, to verify the system responds correctly."
  - titolo: "Performance analysis and compliance check"
    testo: "Measuring the system's response times to the disconnection and reconnection commands, and comparing them against Allegato A.72's requirements."
  - titolo: "SCADA integration and operation"
    testo: "Connecting the device's status to the plant's supervision system and moving into service, with ongoing support on communication with the distributor."

strumentazione:
  - modello: "RIGEDI device"
    nota: "Tested and diagnosed"
  - modello: "A72 modem"
    nota: "Tested and diagnosed"

norma:
  codice: "Allegato A.72 to the Codice di Rete"
  titolo: "Allegato A.72 to Terna's Codice di Rete — governs remote tripping of generation plants"
  note: "Allegato A.72 is an attachment to Terna's Codice di Rete, not part of CEI 0-16: it defines remote tripping, i.e. the distributor's ability to remotely command the disconnection of a generation plant when network safety requires it, and its subsequent reconnection. In the field the procedure is known as RIGEDI. The MV network connection framework remains CEI 0-16, the general technical rule for connecting to HV and MV networks."

faq:
  - d: "What is remote tripping under Allegato A.72?"
    r: "It's the function that lets the distributor remotely command the disconnection of a generation plant connected at MV, when network risk conditions require it, and its subsequent reconnection. It's implemented with a dedicated device and a modem that receives the command."
  - d: "What are RIGEDI and the A72 modem?"
    r: "RIGEDI is the name used in the field for the disconnection procedure applied under Allegato A.72; the A72 modem is the device that receives the disconnection or reconnection command from the distributor and transmits it to the plant's interface protection."
  - d: "Why is periodic device testing needed?"
    r: "Because a modem that doesn't respond, or a badly configured protection, gives no obvious signs until a real command arrives: testing and diagnostics are there to catch the problem before the distributor discovers it through a remote trip that failed to execute."
  - d: "Does the service also include commissioning?"
    r: "Yes, we provide technical support for the device's commissioning and the first command test agreed with the distributor, alongside testing and diagnostics on already-installed systems."
  - d: "Does remote tripping integrate with the plant's SCADA?"
    r: "Yes, we integrate the remote-tripping device's status into the plant's supervision system, so the information is visible alongside the other operating parameters instead of on a separate channel."

correlati:
  - "cci-central-plant-controller"
  - "hv-mv-protection-testing"
  - "meter-reading"
---
