import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../services/api'
import { APPS_SCRIPT_URL } from '../config'

const AppContext = createContext(null)

function fromCache(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function toCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

export function AppProvider({ children }) {
  const [veicoli, setVeicoli] = useState(() => fromCache('cache_veicoli'))
  const [costi, setCosti] = useState(() => fromCache('cache_costi'))
  const [tagliandi, setTagliandi] = useState(() => fromCache('cache_tagliandi'))
  // Mostra spinner solo se non c'è nulla in cache
  const [loading, setLoading] = useState(!localStorage.getItem('cache_veicoli'))
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(
    APPS_SCRIPT_URL !== 'INSERISCI_QUI_URL_APPS_SCRIPT' || !!localStorage.getItem('appsScriptUrl')
  )

  const loadVeicoli = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getVeicoli()
      setVeicoli(data)
      toCache('cache_veicoli', data)
    } catch (e) {
      setError('Errore caricamento veicoli')
    }
  }, [configured])

  const loadCosti = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getCosti()
      setCosti(data)
      toCache('cache_costi', data)
    } catch (e) {
      setError('Errore caricamento costi')
    }
  }, [configured])

  const loadTagliandi = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getTagliandi()
      setTagliandi(data)
      toCache('cache_tagliandi', data)
    } catch (e) {
      setError('Errore caricamento tagliandi')
    }
  }, [configured])

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

  return (
    <AppContext.Provider value={{
      veicoli, setVeicoli,
      costi, setCosti,
      tagliandi, setTagliandi,
      loading, error,
      configured, setConfigured,
      refresh: loadAll,
      refreshCosti: loadCosti,
      refreshTagliandi: loadTagliandi,
      refreshVeicoli: loadVeicoli,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
