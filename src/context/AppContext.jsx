import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import * as api from '../services/api'
import * as coda from '../services/coda'
import { APPS_SCRIPT_URL } from '../config'

const AppContext = createContext(null)

function fromCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function toCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function AppProvider({ children }) {
  // I dati come li ha dati il motore l'ultima volta (e in cache sul telefono)…
  const [veicoliScaricati, setVeicoli] = useState(() => fromCache('cache_veicoli'))
  const [costiScaricati, setCosti] = useState(() => fromCache('cache_costi'))
  const [tagliandiScaricati, setTagliandi] = useState(() => fromCache('cache_tagliandi'))
  // …e le modifiche fatte sul telefono che il motore non ha ancora (o non abbiamo ancora riletto).
  // Dal 25/09/2026 (v0.8.0) le pagine non aspettano il salvataggio: vedi services/coda.js.
  const [invio, setInvio] = useState(coda.leggi)
  useEffect(() => coda.iscriviti(setInvio), [])

  // Mostra spinner solo se non c'è nulla in cache
  const [loading, setLoading] = useState(!localStorage.getItem('cache_veicoli'))
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(
    APPS_SCRIPT_URL !== 'INSERISCI_QUI_URL_APPS_SCRIPT' || !!localStorage.getItem('appsScriptUrl')
  )

  // Una lettura riuscita dice alla coda da che momento i dati scaricati contengono le sue scritture.
  const carica = useCallback(async (elenco, leggi, imposta, chiave, cosa) => {
    if (!configured) return
    const dal = Date.now()
    try {
      const data = await leggi()
      imposta(data)
      toCache(chiave, data)
      coda.riletto(elenco, dal)
    } catch (e) {
      setError(`Errore caricamento ${cosa}: ${e.message}`)
    }
  }, [configured])

  const loadVeicoli = useCallback(
    () => carica('veicoli', api.getVeicoli, setVeicoli, 'cache_veicoli', 'veicoli'), [carica])
  const loadCosti = useCallback(
    () => carica('costi', api.getCosti, setCosti, 'cache_costi', 'costi'), [carica])
  const loadTagliandi = useCallback(
    () => carica('tagliandi', api.getTagliandi, setTagliandi, 'cache_tagliandi', 'tagliandi'), [carica])

  const loadAll = useCallback(async () => {
    if (!configured) return
    const hasCache = !!localStorage.getItem('cache_veicoli')
    if (!hasCache) setLoading(true)
    setError(null)
    await Promise.all([loadVeicoli(), loadCosti(), loadTagliandi()])
    setLoading(false)
  }, [configured, loadVeicoli, loadCosti, loadTagliandi])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Quando la coda si svuota si rilegge tutto in sottofondo: i dati tornano quelli del motore.
  const inAttesaPrima = useRef(invio.inAttesa.length)
  useEffect(() => {
    if (inAttesaPrima.current > 0 && invio.inAttesa.length === 0) loadAll()
    inAttesaPrima.current = invio.inAttesa.length
  }, [invio.inAttesa.length, loadAll])

  // Scrive una modifica: si vede subito, parte per il motore in sottofondo. Restituisce l'id della riga
  // (quello di una riga nuova lo sceglie l'app: così un invio ripetuto non crea doppioni).
  const scrivi = useCallback((action, body) => {
    const dati = action.startsWith('add') ? { ...body, id: api.nuovoId() } : body
    coda.accoda(action, dati)
    return dati.id
  }, [])

  const operazioni = useMemo(() => [...invio.confermate, ...invio.inAttesa], [invio])
  const veicoli = useMemo(() => coda.sovrapponi('veicoli', veicoliScaricati, operazioni), [veicoliScaricati, operazioni])
  const costi = useMemo(() => coda.sovrapponi('costi', costiScaricati, operazioni), [costiScaricati, operazioni])
  const tagliandi = useMemo(() => coda.sovrapponi('tagliandi', tagliandiScaricati, operazioni), [tagliandiScaricati, operazioni])

  return (
    <AppContext.Provider value={{
      veicoli, costi, tagliandi,
      loading, error,
      configured, setConfigured,
      refresh: loadAll,
      refreshCosti: loadCosti,
      refreshTagliandi: loadTagliandi,
      refreshVeicoli: loadVeicoli,
      scrivi,
      invio: invio.inAttesa,
      riprovaInvio: coda.svuota,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
