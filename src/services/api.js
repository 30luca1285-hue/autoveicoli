import { APPS_SCRIPT_URL as CONFIG_URL } from '../config'

function getUrl() {
  return localStorage.getItem('appsScriptUrl') || CONFIG_URL
}

/**
 * ⚠️ 22/09/2026 — PERCHÉ QUESTO FILE NON È PIÙ UNA `fetch` NUDA.
 * Luca: «ho provato a scrivere una spesa sul Discovery, è rimasta su salvataggio per tre minuti;
 * ho chiuso e riaperto ma non c'è». La spesa **c'era** (586 €, motorino avviamento, scritta alle
 * 06:50): a fare i capricci era Apps Script, che quella mattina rispondeva la pagina Drive
 * «Impossibile aprire il file in questo momento» **una volta su due**, impiegandoci oltre 20
 * secondi. Senza timeout l'app restava appesa; e siccome la risposta del POST si perdeva, una
 * scrittura riuscita sembrava fallita.
 *
 * Tre regole, in ordine di importanza:
 *  1. **Timeout**: nessuna chiamata resta appesa. Meglio un errore in 15 secondi che una rotella.
 *  2. **Le letture si ritentano**: il guasto è intermittente, due tentativi in più lo coprono.
 *  3. **Le scritture NON si ritentano — si RILEGGONO.** Ritentare un POST andato a buon fine crea
 *     il doppione: è così che il 26/08 sono nate due schede veicolo identiche. Se la risposta si
 *     perde si rilegge la collezione e si cerca la riga: se c'è, la scrittura è riuscita.
 */
const TIMEOUT = 15000
const TENTATIVI_LETTURA = 3

// Apps Script, quando non ce la fa, risponde 200 con una pagina HTML: `res.json()` muore con un
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

async function call(params, tentativi = TENTATIVI_LETTURA) {
  const url = new URL(getUrl())
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  let ultimo
  for (let i = 0; i < tentativi; i++) {
    try {
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await leggiJson(res)
    } catch (e) {
      ultimo = e
    }
  }
  throw ultimo
}

// come riconoscere, rileggendo, una riga appena scritta: per ogni scrittura i campi che la
// identificano senza ambiguità (l'id lo assegna il backend, quindi non possiamo usarlo)
const CONFERMA = {
  addCosto: {
    leggi: () => call({ action: 'getCosti' }),
    uguale: (r, b) => r.veicoloId === b.veicoloId && r.data === b.data
      && r.categoria === b.categoria && String(r.importo) === String(b.importo),
  },
  addTagliando: {
    leggi: () => call({ action: 'getTagliandi' }),
    uguale: (r, b) => r.veicoloId === b.veicoloId && r.tipo === b.tipo
      && r.dataProssima === b.dataProssima,
  },
  addVeicolo: {
    leggi: () => call({ action: 'getVeicoli' }),
    uguale: (r, b) => r.targa === b.targa && r.nome === b.nome,
  },
}

async function post(body) {
  try {
    const res = await fetch(getUrl(), {
      method: 'POST',
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await leggiJson(res)
  } catch (errore) {
    const conferma = CONFERMA[body.action]
    if (!conferma) throw errore
    // ⛔ non si ritenta: si guarda se la riga c'è già
    const righe = await conferma.leggi().catch(() => null)
    if (Array.isArray(righe) && righe.some(r => conferma.uguale(r, body))) {
      return { ok: true, salvataGiaPrima: true }
    }
    throw errore
  }
}

// VEICOLI
export async function getVeicoli() {
  return call({ action: 'getVeicoli' })
}
export async function addVeicolo(data) {
  return post({ action: 'addVeicolo', ...data })
}
export async function updateVeicolo(data) {
  return post({ action: 'updateVeicolo', ...data })
}
export async function deleteVeicolo(id) {
  return post({ action: 'deleteVeicolo', id })
}

// COSTI
export async function getCosti() {
  return call({ action: 'getCosti' })
}
export async function addCosto(data) {
  return post({ action: 'addCosto', ...data })
}
export async function updateCosto(data) {
  return post({ action: 'updateCosto', ...data })
}
export async function deleteCosto(id) {
  return post({ action: 'deleteCosto', id })
}

// TAGLIANDI
export async function getTagliandi() {
  return call({ action: 'getTagliandi' })
}
export async function addTagliando(data) {
  return post({ action: 'addTagliando', ...data })
}
export async function updateTagliando(data) {
  return post({ action: 'updateTagliando', ...data })
}
export async function deleteTagliando(id) {
  return post({ action: 'deleteTagliando', id })
}

// TELEGRAM
export async function saveTelegramConfig({ botToken, chatId }) {
  return post({ action: 'saveTelegramConfig', botToken, chatId })
}
export async function testTelegram() {
  return call({ action: 'testTelegram' })
}
