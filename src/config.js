// Incolla qui l'URL del tuo Google Apps Script Web App dopo il deploy
export const APPS_SCRIPT_URL = 'INSERISCI_QUI_URL_APPS_SCRIPT'

export const CATEGORIE = [
  { id: 'carburante', label: 'Carburante', emoji: '⛽', soloMotorizzati: true },
  { id: 'manutenzione', label: 'Manutenzione', emoji: '🔧', soloMotorizzati: false },
  { id: 'assicurazione', label: 'Assicurazione', emoji: '📋', soloMotorizzati: false },
  { id: 'bollo', label: 'Bollo', emoji: '📜', soloMotorizzati: false },
  { id: 'revisione', label: 'Revisione', emoji: '✅', soloMotorizzati: false },
  { id: 'pneumatici', label: 'Pneumatici', emoji: '🔄', soloMotorizzati: false },
  { id: 'parcheggio', label: 'Parcheggio/Pedaggi', emoji: '🅿️', soloMotorizzati: false },
  { id: 'lavaggio', label: 'Lavaggio', emoji: '🚿', soloMotorizzati: false },
  { id: 'multa', label: 'Multa', emoji: '🚨', soloMotorizzati: false },
  { id: 'altro', label: 'Altro', emoji: '📦', soloMotorizzati: false },
]

export const TIPI_VEICOLO = [
  { id: 'auto', label: 'Auto', emoji: '🚗', motorizzato: true },
  { id: 'pickup', label: 'Pickup', emoji: '🛻', motorizzato: true },
  { id: 'furgone', label: 'Furgone', emoji: '🚐', motorizzato: true },
  { id: 'moto', label: 'Moto', emoji: '🏍️', motorizzato: true },
  { id: 'carrello', label: 'Carrello/Rimorchio', emoji: '🚛', motorizzato: false },
  { id: 'altro', label: 'Altro', emoji: '🚙', motorizzato: true },
]

export const TIPI_TAGLIANDO = [
  'Tagliando ordinario',
  'Cambio olio',
  'Cambio filtri',
  'Cambio pneumatici',
  'Revisione freni',
  'Distribuzione',
  'Revisione periodica',
  'Altro',
]
