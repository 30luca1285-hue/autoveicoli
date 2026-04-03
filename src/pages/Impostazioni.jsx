import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { APPS_SCRIPT_URL } from '../config'
import { saveTelegramConfig, testTelegram } from '../services/api'
import { Save, CheckCircle, Send } from 'lucide-react'

export default function Impostazioni() {
  const { configured, setConfigured } = useApp()
  const [url, setUrl] = useState(
    localStorage.getItem('appsScriptUrl') || (APPS_SCRIPT_URL !== 'INSERISCI_QUI_URL_APPS_SCRIPT' ? APPS_SCRIPT_URL : '')
  )
  const [saved, setSaved] = useState(false)

  const [tgToken, setTgToken] = useState(localStorage.getItem('tgBotToken') || '')
  const [tgChatId, setTgChatId] = useState(localStorage.getItem('tgChatId') || '')
  const [tgSaved, setTgSaved] = useState(false)
  const [tgTesting, setTgTesting] = useState(false)
  const [tgTestResult, setTgTestResult] = useState(null) // null | 'ok' | 'error'

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

  async function handleTgSave() {
    if (!tgToken || !tgChatId) return
    try {
      const res = await saveTelegramConfig({ botToken: tgToken, chatId: tgChatId })
      if (res.error) throw new Error(res.error)
      localStorage.setItem('tgBotToken', tgToken)
      localStorage.setItem('tgChatId', tgChatId)
      setTgSaved(true)
      setTimeout(() => setTgSaved(false), 2000)
    } catch (e) {
      setTgTestResult('error')
      console.error('Telegram save error:', e)
    }
  }

  async function handleTgTest() {
    setTgTesting(true)
    setTgTestResult(null)
    try {
      const res = await testTelegram()
      if (res.error) throw new Error(res.error)
      setTgTestResult('ok')
    } catch (e) {
      setTgTestResult('error')
      console.error('Telegram test error:', e)
    } finally {
      setTgTesting(false)
    }
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

      {/* Telegram */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
        <p className="font-semibold">Notifiche Telegram</p>
        <p className="text-sm text-slate-400">
          Ricevi un messaggio Telegram il 1° di ogni mese con le scadenze imminenti.
          Crea un bot con <span className="text-slate-300">@BotFather</span>, poi ottieni il tuo Chat ID con <span className="text-slate-300">@userinfobot</span>.
        </p>

        <input
          type="text"
          placeholder="Bot Token (es. 123456:ABC-DEF...)"
          value={tgToken}
          onChange={e => setTgToken(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
        />
        <input
          type="text"
          placeholder="Chat ID (es. 123456789)"
          value={tgChatId}
          onChange={e => setTgChatId(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
        />

        <div className="flex gap-2">
          <button
            onClick={handleTgSave}
            disabled={!tgToken || !tgChatId || tgSaved}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {tgSaved ? <CheckCircle size={18} /> : <Save size={18} />}
            {tgSaved ? 'Salvato!' : 'Salva'}
          </button>
          <button
            onClick={handleTgTest}
            disabled={!tgToken || !tgChatId || tgTesting}
            className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {tgTesting ? 'Invio...' : 'Test'}
          </button>
        </div>

        {tgTestResult === 'ok' && (
          <p className="text-xs text-green-400 text-center">✓ Messaggio di test inviato!</p>
        )}
        {tgTestResult === 'error' && (
          <p className="text-xs text-red-400 text-center">✗ Errore — controlla token e chat ID</p>
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
        <p className="text-sm text-slate-400">Autoveicoli v0.6.0</p>
        <p className="text-sm text-slate-400">Gestione costi e manutenzione veicoli</p>
      </div>
    </div>
  )
}
