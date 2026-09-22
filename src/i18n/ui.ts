// Dizionario delle sole stringhe di interfaccia (nav, pulsanti, intestazioni
// del footer, banner cookie): i contenuti delle pagine restano nelle
// collection, che parlano già la propria lingua per riga. Le voci qui dentro
// corrispondono a testo che esiste davvero in Header.astro, Footer.astro e
// CtaBand.astro oggi — non se ne aggiungono per usi futuri non ancora scritti.
import type { Lingua } from './routes.ts';

export const UI = {
  it: {
    nav: {
      home: 'Home',
      azienda: 'Azienda',
      servizi: 'Servizi',
      lavori: 'Lavori',
      contatti: 'Contatti',
    },
    header: {
      chiamaAria: 'Chiama',
      chiamaBreve: 'Chiama',
      apriMenu: 'Apri il menu',
      chiudiMenu: 'Chiudi il menu',
    },
    azioni: {
      chiamaci: 'Chiamaci',
      scriviciEmail: 'Scrivici via email',
    },
    footer: {
      claim: "Professionisti dell'energia.",
      linkedin: 'LinkedIn',
      naviga: 'Naviga',
      contatti: 'Contatti',
      privacyPolicy: 'Privacy Policy',
      preferenzeCookie: 'Preferenze cookie',
    },
    cookie: {
      testo:
        'Nessun cookie di profilazione o marketing. Solo tecnici indispensabili; eventuali cookie statistici partiranno solo con il tuo consenso.',
      rifiuta: 'Rifiuta',
      accettaTutti: 'Accetta tutti',
    },
  },
  en: {
    nav: {
      home: 'Home',
      azienda: 'Company',
      servizi: 'Services',
      lavori: 'Projects',
      contatti: 'Contacts',
    },
    header: {
      chiamaAria: 'Call',
      chiamaBreve: 'Call',
      apriMenu: 'Open menu',
      chiudiMenu: 'Close menu',
    },
    azioni: {
      chiamaci: 'Call us',
      scriviciEmail: 'Email us',
    },
    footer: {
      claim: 'Energy professionals.',
      linkedin: 'LinkedIn',
      naviga: 'Navigate',
      contatti: 'Contact',
      privacyPolicy: 'Privacy Policy',
      preferenzeCookie: 'Cookie preferences',
    },
    cookie: {
      testo:
        'No profiling or marketing cookies. Only essential technical ones; any statistical cookies will only run with your consent.',
      rifiuta: 'Reject',
      accettaTutti: 'Accept all',
    },
  },
} as const;

export const t = (lingua: Lingua) => UI[lingua];
