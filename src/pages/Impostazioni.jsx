import { useState } from 'react'
import { MOTORE_URL } from '../config'
import { saveTelegramConfig, testTelegram } from '../services/api'
import { Save, CheckCircle, Send } from 'lucide-react'

export default function Impostazioni() {
  const [tgToken, setTgToken] = useState(localStorage.getItem('tgBotToken') || '')
  const [tgChatId, setTgChatId] = useState(localStorage.getItem('tgChatId') || '')
  const [tgSaved, setTgSaved] = useState(false)
  const [tgTesting, setTgTesting] = useState(false)
  const [tgTestResult, setTgTestResult] = useState(null) // null | 'ok' | 'error'

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

      {/* Dove stanno i dati — dal 25/09/2026 sul Mac, non più su Google */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
        <p className="font-semibold">Dove stanno i dati</p>
        <p className="text-sm text-slate-400">
          Sul Mac dell'azienda, raggiungibile dal telefono tramite Tailscale. Se Tailscale è spento, le
          modifiche restano salvate sul telefono e partono da sole appena si riaccende.
        </p>
        <p className="text-xs text-slate-500 break-all">{MOTORE_URL}</p>
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

      {/* Info app */}
      <div className="bg-slate-800 rounded-2xl p-4 space-y-1">
        <p className="font-semibold">Informazioni</p>
        <p className="text-sm text-slate-400">Autoveicoli v0.8.0</p>
        <p className="text-sm text-slate-400">Gestione costi e manutenzione veicoli</p>
      </div>
    </div>
  )
}
