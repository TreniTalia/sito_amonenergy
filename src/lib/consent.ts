// Stato del consenso cookie — letto/scritto in localStorage, mai in un cookie:
// l'unica preferenza che serve memorizzare è la scelta stessa, e localStorage
// non è soggetto alla normativa cookie. Quando arriverà Google Analytics,
// basterà avvolgere il caricamento di gtag.js in `if (hasAnalyticsConsent())`
// e richiamare `onConsentChange` per avviarlo appena l'utente accetta, senza
// toccare il banner.

const STORAGE_KEY = 'amon-cookie-consent';

export type ConsentChoice = 'accepted' | 'rejected';

interface StoredConsent {
  choice: ConsentChoice;
  at: string;
}

export function getConsent(): StoredConsent | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.choice === 'accepted' || parsed?.choice === 'rejected' ? parsed : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.choice === 'accepted';
}

export function setConsent(choice: ConsentChoice) {
  const value: StoredConsent = { choice, at: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  document.dispatchEvent(new CustomEvent<StoredConsent>('amon-consent-change', { detail: value }));
}

export function clearConsent() {
  localStorage.removeItem(STORAGE_KEY);
}

export function onConsentChange(callback: (choice: ConsentChoice) => void) {
  document.addEventListener('amon-consent-change', (e) => {
    callback((e as CustomEvent<StoredConsent>).detail.choice);
  });
}
