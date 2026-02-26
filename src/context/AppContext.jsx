import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../services/api'
import { APPS_SCRIPT_URL } from '../config'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [veicoli, setVeicoli] = useState([])
  const [costi, setCosti] = useState([])
  const [tagliandi, setTagliandi] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [configured, setConfigured] = useState(APPS_SCRIPT_URL !== 'INSERISCI_QUI_URL_APPS_SCRIPT')

  const loadVeicoli = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getVeicoli()
      setVeicoli(data)
    } catch (e) {
      setError('Errore caricamento veicoli')
    }
  }, [configured])

  const loadCosti = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getCosti()
      setCosti(data)
    } catch (e) {
      setError('Errore caricamento costi')
    }
  }, [configured])

  const loadTagliandi = useCallback(async () => {
    if (!configured) return
    try {
      const data = await api.getTagliandi()
      setTagliandi(data)
    } catch (e) {
      setError('Errore caricamento tagliandi')
    }
  }, [configured])

  const loadAll = useCallback(async () => {
    if (!configured) return
    setLoading(true)
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
