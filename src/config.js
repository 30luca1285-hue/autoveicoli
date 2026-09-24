// URL del motore Google (deployment @31). Dal 24/09/2026 sta qui e non più solo nelle Impostazioni del
// telefono: il motore risponde soltanto col PIN, quindi l'indirizzo da solo non apre niente, e così una
// reinstallazione dell'app funziona chiedendo solo il PIN. (Le Impostazioni possono ancora sovrascriverlo.)
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
