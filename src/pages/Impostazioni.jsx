import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { Save, ExternalLink, CheckCircle } from 'lucide-react'

export default function Impostazioni() {
  const { configured, setConfigured, refresh } = useApp()
  const [url, setUrl] = useState(
    localStorage.getItem('appsScriptUrl') || (APPS_SCRIPT_URL !== 'INSERISCI_QUI_URL_APPS_SCRIPT' ? APPS_SCRIPT_URL : '')
  )
  const [saved, setSaved] = useState(false)

  // Nota: per cambiare l'URL a runtime lo salviamo in localStorage
  // e aggiorniamo il modulo api.js ricaricando la pagina
  function handleSave() {
    if (!url) return
    localStorage.setItem('appsScriptUrl', url)
    setSaved(true)
    setConfigured(true)
    setTimeout(() => {
      setSaved(false)
      window.location.reload()
    }, 1200)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold pt-2">Impostazioni</h1>

      {/* URL Apps Script */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <p className="font-semibold">Backend Google Apps Script</p>
        <p className="text-sm text-slate-400">
          Incolla qui l'URL del Web App dopo aver deployato lo script su Google Apps Script.
        </p>

        <input
          type="url"
          placeholder="https://script.google.com/macros/s/.../exec"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
        />

        <button
          onClick={handleSave}
          disabled={!url || saved}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saved ? 'Salvato! Ricarico...' : 'Salva URL'}
        </button>

        {configured && (
          <p className="text-xs text-green-400 text-center">✓ Backend configurato</p>
        )}
      </div>

      {/* Guida setup */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <p className="font-semibold">Come configurare il backend</p>
        <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
          <li>Crea un nuovo Google Sheet</li>
          <li>Dal menu → <strong className="text-slate-300">Estensioni → Apps Script</strong></li>
          <li>Incolla il codice del file <code className="bg-slate-700 px-1 rounded">backend/Code.gs</code></li>
          <li>Salva e clicca <strong className="text-slate-300">Deploy → Nuovo deployment</strong></li>
          <li>Tipo: <strong className="text-slate-300">App Web</strong>, accesso: <strong className="text-slate-300">Chiunque</strong></li>
          <li>Copia l'URL e incollalo qui sopra</li>
        </ol>
      </div>

      {/* Info app */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-1">
        <p className="font-semibold">Informazioni</p>
        <p className="text-sm text-slate-400">Autoveicoli v0.5.6</p>
        <p className="text-sm text-slate-400">Gestione costi e manutenzione veicoli</p>
      </div>
    </div>
  )
}
