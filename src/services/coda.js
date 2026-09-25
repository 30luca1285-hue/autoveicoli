/**
 * Coda di invio — 25/09/2026, v0.8.0.
 *
 * Luca: «il salvataggio continua ad essere lunghissimo». Misurato quel giorno: col motore su Google le
 * scritture impiegavano da 1,5 a 35 s, e salvare una spesa col promemoria voleva dire quattro chiamate in
 * fila. Il motore ora è sul Mac (server/motore.py, pochi millisecondi), ma il telefono può non vederlo:
 * niente rete, Tailscale spento, Mac che si riavvia. Quindi l'app non aspetta più nessuno:
 *  · la modifica entra in questa coda, salvata sul telefono (sopravvive alla chiusura dell'app);
 *  · le pagine la vedono SUBITO: AppContext sovrappone la coda ai dati scaricati (`sovrapponi`);
 *  · parte in sottofondo, una alla volta e nell'ordine in cui è stata fatta, e si rimanda finché il
 *    motore non risponde ok: al rientro nell'app, al ritorno della rete, o dopo una pausa crescente;
 *  · rimandare è sicuro: l'id di una riga nuova lo sceglie l'app e il motore non scrive due volte lo
 *    stesso id; modifiche e cancellazioni danno lo stesso risultato anche rifatte.
 * Una modifica già arrivata resta sovrapposta ai dati finché una lettura partita DOPO non la contiene:
 * altrimenti sparirebbe per un attimo dalla schermata (le «confermate»).
 */
import { invia } from './api'

const CHIAVE = 'codaInvio'
const PAUSE = [5, 15, 30, 60, 120]      // secondi fra un tentativo fallito e il successivo
const UN_GIORNO = 24 * 3600 * 1000

// quali elenchi tocca ogni scrittura (eliminare un veicolo elimina anche le sue spese e i promemoria)
export const ELENCHI = {
  addVeicolo: ['veicoli'], updateVeicolo: ['veicoli'], deleteVeicolo: ['veicoli', 'costi', 'tagliandi'],
  addCosto: ['costi'], updateCosto: ['costi'], deleteCosto: ['costi'],
  addTagliando: ['tagliandi'], updateTagliando: ['tagliandi'], deleteTagliando: ['tagliandi'],
}

function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE))
    return { inAttesa: s?.inAttesa || [], confermate: s?.confermate || [] }
  } catch {
    return { inAttesa: [], confermate: [] }
  }
}

let stato = carica()
let inCorso = false
let timer = null
const ascoltatori = new Set()

function cambia(nuovo) {
  stato = nuovo
  try { localStorage.setItem(CHIAVE, JSON.stringify(stato)) } catch { /* spazio pieno: resta in memoria */ }
  ascoltatori.forEach(f => f(stato))
}

export const leggi = () => stato

export function iscriviti(f) {
  ascoltatori.add(f)
  return () => ascoltatori.delete(f)
}

export function accoda(action, body) {
  const op = { action, body, creata: Date.now(), tentativi: 0, errore: null }
  cambia({ ...stato, inAttesa: [...stato.inAttesa, op] })
  svuota()
}

export async function svuota() {
  if (inCorso || !stato.inAttesa.length) return
  inCorso = true
  clearTimeout(timer)
  timer = null
  try {
    while (stato.inAttesa.length) {
      const op = stato.inAttesa[0]
      let esito
      try {
        esito = await invia(op.action, op.body)
      } catch (e) {
        esito = { error: e.message }
      }
      // «not found» su modifica o cancellazione: la riga non c'è (più), non resta niente da fare
      const fatto = esito?.ok === true || esito?.error === 'not found'
      // riletto DOPO l'attesa: nel frattempo in coda se ne possono essere aggiunte altre
      const resto = stato.inAttesa.slice(1)
      if (!fatto) {
        const tentativi = op.tentativi + 1
        cambia({ ...stato, inAttesa: [{ ...op, tentativi, errore: esito?.error || 'risposta vuota' }, ...resto] })
        timer = setTimeout(svuota, PAUSE[Math.min(tentativi, PAUSE.length) - 1] * 1000)
        return
      }
      cambia({
        inAttesa: resto,
        confermate: [...stato.confermate, { ...op, fattaIl: Date.now(), daRileggere: ELENCHI[op.action] || [] }],
      })
    }
  } finally {
    inCorso = false
  }
}

// Una lettura partita a `dal` contiene tutte le scritture arrivate al motore prima di quell'istante:
// per quell'elenco non serve più sovrapporle.
export function riletto(elenco, dal) {
  const confermate = stato.confermate
    .map(op => (op.fattaIl < dal ? { ...op, daRileggere: op.daRileggere.filter(e => e !== elenco) } : op))
    .filter(op => op.daRileggere.length && Date.now() - op.fattaIl < UN_GIORNO)
  if (JSON.stringify(confermate) !== JSON.stringify(stato.confermate)) cambia({ ...stato, confermate })
}

// ── la coda sopra i dati scaricati ──────────────────────────────────────────────────────────────
// Le stesse conversioni del motore (server/motore.py), così una riga appena accodata ha già l'aspetto
// che avrà quando tornerà dal Mac.
const oggi = () => new Date().toISOString().slice(0, 10)
const testo = v => (v === undefined || v === null || v === false || v === '' || v === 0 ? '' : String(v))
const numero = v => { const n = parseFloat(v); return n ? String(n) : '' }      // parseFloat(x) || ''
const NUMERICI = { costi: ['importo', 'km'], tagliandi: ['km', 'kmProssimi', 'importo'], veicoli: [] }

function rigaNuova({ action, body: b, creata }) {
  const createdAt = new Date(creata).toISOString()
  if (action === 'addVeicolo') return {
    id: b.id, nome: testo(b.nome), targa: testo(b.targa), tipo: testo(b.tipo) || 'auto', anno: testo(b.anno),
    nota: testo(b.nota), dataImmatricolazione: testo(b.dataImmatricolazione), carburante: testo(b.carburante),
    intervaloRevisione: testo(b.intervaloRevisione), kmAttuali: testo(b.kmAttuali), createdAt,
  }
  if (action === 'addCosto') return {
    id: b.id, veicoloId: testo(b.veicoloId), data: testo(b.data) || oggi(), categoria: testo(b.categoria),
    importo: String(parseFloat(b.importo) || 0), nota: testo(b.nota), litri: numero(b.litri), km: numero(b.km),
    createdAt,
  }
  return {   // addTagliando
    id: b.id, veicoloId: testo(b.veicoloId), tipo: testo(b.tipo), data: testo(b.data) || oggi(), km: numero(b.km),
    dataProssima: testo(b.dataProssima), kmProssimi: numero(b.kmProssimi), importo: numero(b.importo),
    nota: testo(b.nota), createdAt,
  }
}

function campiModificati(elenco, body) {
  const campi = {}
  for (const [k, v] of Object.entries(body)) {
    if (k === 'id' || v === undefined || v === null) continue
    campi[k] = NUMERICI[elenco].includes(k) ? numero(v) : String(v)
  }
  return campi
}

export function sovrapponi(elenco, righe, operazioni) {
  let out = Array.isArray(righe) ? righe : []
  for (const op of operazioni) {
    if (!(ELENCHI[op.action] || []).includes(elenco)) continue
    const id = String(op.body.id)
    if (op.action.startsWith('add')) {
      if (!out.some(r => String(r.id) === id)) out = [...out, rigaNuova(op)]
    } else if (op.action.startsWith('update')) {
      out = out.map(r => (String(r.id) === id ? { ...r, ...campiModificati(elenco, op.body) } : r))
    } else if (op.action === 'deleteVeicolo' && elenco !== 'veicoli') {
      out = out.filter(r => String(r.veicoloId) !== id)
    } else {
      out = out.filter(r => String(r.id) !== id)
    }
  }
  return out
}

// quello rimasto in coda dall'ultima volta riparte all'apertura; poi al rientro e al ritorno della rete
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => svuota())
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') svuota() })
  setTimeout(svuota, 0)
}
