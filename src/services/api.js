import { APPS_SCRIPT_URL, MOTORE_URL } from '../config'

// ⭐ 25/09/2026 (v0.8.0) — i dati stanno sul Mac (server/motore.py), non più su Google.
// `motoreUrl` in localStorage serve solo per le prove su un motore di collaudo.
const urlMotore = () => localStorage.getItem('motoreUrl') || MOTORE_URL
// Su Google restano soltanto le notifiche Telegram: configurazione, prova e promemoria del 1° del mese.
const urlGoogle = () => localStorage.getItem('appsScriptUrl') || APPS_SCRIPT_URL

/**
 * ⚠️ 22/09/2026 — PERCHÉ QUESTO FILE NON È PIÙ UNA `fetch` NUDA.
 * Luca: «ho provato a scrivere una spesa sul Discovery, è rimasta su salvataggio per tre minuti;
 * ho chiuso e riaperto ma non c'è». La spesa **c'era**: Apps Script rispondeva la pagina Drive
 * «Impossibile aprire il file in questo momento» una volta su due, dopo oltre 20 secondi.
 * Da allora: **timeout** su ogni chiamata e **letture ritentate** (il guasto era intermittente).
 *
 * ⚠️ 25/09/2026 — le SCRITTURE non passano più da qui in diretta: le manda la coda di invio
 * (`coda.js`), che l'app non aspetta e che le RIMANDA finché il motore non risponde. Rimandare è
 * sicuro perché l'id di una riga nuova lo sceglie l'app (`nuovoId`) e il motore non scrive due volte
 * lo stesso id. La vecchia regola «le scritture non si ritentano, si rileggono» serviva col motore di
 * Google, che assegnava l'id da sé.
 */
const TIMEOUT = 15000
const TIMEOUT_INVIO = 20000
const TENTATIVI_LETTURA = 3
const NON_RISPONDE = 'Il Mac non risponde: controlla che Tailscale sia acceso'

// Stesso formato degli id del motore: istante in base 36 più 4 caratteri a caso.
export function nuovoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6).padEnd(4, '0')
}

// Rete assente, Tailscale spento o motore fermo: fetch fallisce con un messaggio del browser
// («Load failed», «Failed to fetch») o scade. Qui diventa una frase che dice cosa controllare.
function leggibile(e) {
  return e && (e.name === 'TypeError' || e.name === 'TimeoutError' || e.name === 'AbortError')
    ? new Error(NON_RISPONDE) : e
}

// Google, quando non ce la fa, risponde 200 con una pagina HTML: `res.json()` morirebbe con un
// SyntaxError che sembra un bug nostro. Qui diventa un errore leggibile.
async function leggiJson(res) {
  const testo = await res.text()
  try {
    return JSON.parse(testo)
  } catch {
    throw new Error(/Impossibile aprire il file/.test(testo)
      ? 'Google non risponde (riprova fra poco)'
      : 'risposta non valida dal server')
  }
}

/**
 * ⚠️ 24/09/2026 — PIN. L'indirizzo del motore sta nel repo PUBBLICO dell'app: senza un segreto
 * chiunque poteva leggere e modificare veicoli, costi e perfino la configurazione Telegram. Il PIN NON
 * sta nel codice (che è pubblico): lo chiede l'app la prima volta e resta su questo telefono. Il motore
 * sul Mac usa lo stesso PIN, quindi col passaggio non va reinserito.
 * Se il motore risponde { pinRichiesto: true } (PIN assente o sbagliato) lo si richiede e si riprova
 * UNA volta: una richiesta respinta per il PIN non ha scritto niente, quindi riprovarla non crea doppioni.
 *
 * ⚠️ 24/09/2026, correzione v0.7.4: all'avvio partono TRE letture insieme (veicoli, costi, tagliandi).
 * Con un PIN sbagliato in memoria venivano respinte tutte e tre e l'app chiedeva il PIN tre volte; se
 * una finestrella veniva chiusa, l'oggetto d'errore arrivava alla pagina al posto della lista e l'app
 * restava tutta blu (`t.filter is not a function`). Ora:
 *  · si passa il PIN RESPINTO: se nel frattempo qualcuno l'ha già reinserito, si usa quello nuovo
 *    senza chiedere di nuovo → una sola richiesta anche con tre letture;
 *  · se l'utente annulla, non si richiede più fino alla riapertura dell'app;
 *  · un PIN respinto diventa un ERRORE lanciato (con messaggio), mai un oggetto restituito alla pagina.
 */
let pinAnnullato = false

function leggiPin(respinto = null) {
  let pin = localStorage.getItem('appPin') || ''
  if (respinto !== null && pin === respinto) { localStorage.removeItem('appPin'); pin = '' }
  if (!pin && !pinAnnullato) {
    const scritto = window.prompt(respinto !== null ? 'PIN non valido. Inserisci il PIN di Autoveicoli:' : 'Inserisci il PIN di Autoveicoli:')
    pin = (scritto || '').trim()
    if (pin) localStorage.setItem('appPin', pin)
    else pinAnnullato = true
  }
  return pin
}
const pinRifiutato = dati => !!(dati && dati.pinRichiesto)
const ERRORE_PIN = 'PIN non valido: chiudi e riapri l\'app per inserirlo di nuovo'

async function call(params, { base = urlMotore(), tentativi = TENTATIVI_LETTURA, respinto = null } = {}) {
  const pin = leggiPin(respinto)
  const url = new URL(base)
  Object.entries({ ...params, pin }).forEach(([k, v]) => url.searchParams.set(k, v))
  let ultimo, dati, letto = false
  for (let i = 0; i < tentativi && !letto; i++) {
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      dati = await leggiJson(res)
      letto = true
    } catch (e) {
      ultimo = leggibile(e)
    }
  }
  if (!letto) throw ultimo
  if (pinRifiutato(dati)) {
    if (respinto !== null || !pin) throw new Error(ERRORE_PIN)
    return call(params, { base, tentativi, respinto: pin })
  }
  return dati
}

async function post(body, { base = urlMotore(), timeout = TIMEOUT, respinto = null } = {}) {
  const pin = leggiPin(respinto)
  let res
  try {
    res = await fetch(base, {
      method: 'POST',
      body: JSON.stringify({ ...body, pin }),
      signal: AbortSignal.timeout(timeout),
    })
  } catch (e) {
    throw leggibile(e)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const dati = await leggiJson(res)
  if (pinRifiutato(dati)) {
    if (respinto !== null || !pin) throw new Error(ERRORE_PIN)
    return post(body, { base, timeout, respinto: pin })   // respinta per il PIN = niente scritto
  }
  return dati
}

// Una scrittura della coda di invio (coda.js): add/update/delete di veicoli, costi e tagliandi.
export function invia(action, body) {
  return post({ action, ...body }, { timeout: TIMEOUT_INVIO })
}

// LETTURE
export const getVeicoli = () => call({ action: 'getVeicoli' })
export const getCosti = () => call({ action: 'getCosti' })
export const getTagliandi = () => call({ action: 'getTagliandi' })

// TELEGRAM (su Google)
export function saveTelegramConfig({ botToken, chatId }) {
  return post({ action: 'saveTelegramConfig', botToken, chatId }, { base: urlGoogle(), timeout: 30000 })
}
export function testTelegram() {
  return call({ action: 'testTelegram' }, { base: urlGoogle() })
}
