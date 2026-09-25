// ⭐ Dal 25/09/2026 i dati stanno sul Mac dell'azienda (server/motore.py). Dal telefono ci si arriva solo
// attraverso Tailscale: https con certificato vero sulla porta 8443 (`tailscale serve`), gli altri
// servizi del Mac restano dove sono. Google era lento (scritture fino a 35 s) e ogni tanto rispondeva con
// la pagina d'errore di Drive. Il motore risponde soltanto col PIN, quindi l'indirizzo da solo non apre niente.
export const MOTORE_URL = 'https://mac-mini-di-luca.tailf1ca0e.ts.net:8443/'

// URL del motore Google (deployment @31): ora serve solo per le notifiche Telegram (configurazione, prova e
// promemoria del 1° del mese), che leggono la copia dei dati che il Mac tiene aggiornata sul foglio.
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzH6xpACTJSY2p72HYtVSE-ttd5dcR9J4x-pd8zTxOg66BVjCjKjct-YIfdJnpo92Gy7g/exec'

export const CATEGORIE = [
  { id: 'manutenzione', label: 'Manutenzione', emoji: '🔧', soloMotorizzati: false },
  { id: 'assicurazione', label: 'Assicurazione', emoji: '📋', soloMotorizzati: false },
  { id: 'bollo', label: 'Bollo', emoji: '📜', soloMotorizzati: false },
  { id: 'revisione', label: 'Revisione', emoji: '✅', soloMotorizzati: false },
  { id: 'pneumatici', label: 'Pneumatici', emoji: '🔄', soloMotorizzati: false },
  { id: 'carburante', label: 'Carburante', emoji: '⛽', soloMotorizzati: false },
  { id: 'lavaggio', label: 'Lavaggio', emoji: '🧽', soloMotorizzati: false },
]

export const TIPI_VEICOLO = [
  { id: 'auto', label: 'Auto', emoji: '🚗', motorizzato: true },
  { id: 'pickup', label: 'Pickup', emoji: '🛻', motorizzato: true },
  { id: 'furgone', label: 'Furgone', emoji: '🚐', motorizzato: true },
  { id: 'moto', label: 'Moto', emoji: '🏍️', motorizzato: true },
  { id: 'carrello', label: 'Carrello/Rimorchio', emoji: '🚛', motorizzato: false },
  { id: 'altro', label: 'Altro', emoji: '🚙', motorizzato: true },
]

export const CARBURANTI = [
  { id: 'diesel', label: 'Diesel', emoji: '🛢️' },
  { id: 'benzina', label: 'Benzina', emoji: '⛽' },
  { id: 'metano', label: 'Metano CNG', emoji: '🔵' },
  { id: 'gpl', label: 'GPL', emoji: '🟢' },
  { id: 'elettrico', label: 'Elettrico', emoji: '⚡' },
  { id: 'ibrido', label: 'Ibrido', emoji: '🔋' },
]

export const INTERVALLI_REVISIONE = [
  { mesi: 12, label: 'Ogni anno (commerciali)' },
  { mesi: 24, label: 'Ogni 2 anni (standard)' },
  { mesi: 48, label: 'Ogni 4 anni (veicolo nuovo)' },
]

export const TIPI_INTERVENTO = [
  'Tagliando ordinario',
  'Cambio olio',
  'Cambio filtri',
  'Cambio pneumatici',
  'Revisione freni',
  'Distribuzione',
  'Revisione periodica',
  'Assicurazione',
  'Bollo',
  'Altro',
]
