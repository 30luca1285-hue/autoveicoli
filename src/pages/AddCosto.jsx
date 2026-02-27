import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CATEGORIE, TIPI_VEICOLO, TIPI_INTERVENTO } from '../config'
import { format } from 'date-fns'
import * as api from '../services/api'
import { CheckCircle, Loader2 } from 'lucide-react'

// Tutte le categorie tranne "altro" supportano il reminder
const CATEGORIE_CON_REMINDER = ['manutenzione', 'assicurazione', 'bollo', 'revisione', 'pneumatici']

// Tipo intervento suggerito in base alla categoria
const CATEGORIA_TIPO_MAP = {
  manutenzione: 'Tagliando ordinario',
  assicurazione: 'Altro',
  bollo: 'Altro',
  revisione: 'Revisione periodica',
  pneumatici: 'Cambio pneumatici',
}

export default function AddCosto() {
  const { veicoli, refreshCosti, refreshTagliandi } = useApp()
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [veicoloId, setVeicoloId] = useState('')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoria, setCategoria] = useState('')
  const [importo, setImporto] = useState('')
  const [nota, setNota] = useState('')
  const [km, setKm] = useState('')

  // Reminder
  const [hasReminder, setHasReminder] = useState(false)
  const [tipoIntervento, setTipoIntervento] = useState('')
  const [dataProssima, setDataProssima] = useState('')
  const [kmProssimi, setKmProssimi] = useState('')

  const showReminder = CATEGORIE_CON_REMINDER.includes(categoria)

  function handleSelectCategoria(id) {
    setCategoria(id)
    setHasReminder(false)
    setTipoIntervento(CATEGORIA_TIPO_MAP[id] || '')
    setDataProssima('')
    setKmProssimi('')
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!veicoloId || !categoria || !importo) {
      setError('Compila tutti i campi obbligatori')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.addCosto({ veicoloId, data, categoria, importo, nota, km })
      if (hasReminder && (dataProssima || kmProssimi)) {
        await api.addTagliando({
          veicoloId,
          tipo: tipoIntervento || CATEGORIA_TIPO_MAP[categoria] || 'Altro',
          data,
          km,
          dataProssima,
          kmProssimi,
          nota,
          importo,
        })
        await refreshTagliandi()
      }
      await refreshCosti()
      setSuccess(true)
      setImporto('')
      setNota('')
      setKm('')
      setHasReminder(false)
      setDataProssima('')
      setKmProssimi('')
      setTimeout(() => setSuccess(false), 2000)
    } catch (e) {
      setError('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold pt-2">Inserisci</h1>

      {success && (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-700 rounded-xl p-3 text-green-300">
          <CheckCircle size={18} />
          <span className="text-sm">Salvato!</span>
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Veicolo */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Veicolo *</label>
          <div className="grid grid-cols-2 gap-2">
            {veicoli.map(v => {
              const tipo = TIPI_VEICOLO.find(t => t.id === v.tipo)
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => { setVeicoloId(v.id); setCategoria('') }}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    veicoloId === v.id
                      ? 'border-blue-500 bg-blue-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xl block">{tipo?.emoji || '🚗'}</span>
                  <span className="text-sm font-medium block mt-1 truncate">{v.nome}</span>
                  <span className="text-xs text-slate-400">{v.targa}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Categoria */}
        {veicoloId && (
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Categoria *</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIE.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCategoria(c.id)}
                  className={`p-2 rounded-xl border text-center transition-colors ${
                    categoria === c.id
                      ? 'border-blue-500 bg-blue-900/30 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-lg block">{c.emoji}</span>
                  <span className="text-xs block mt-0.5 leading-tight">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Data effettuato</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>

        {/* KM */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">KM attuali</label>
          <input
            type="number"
            placeholder="0"
            value={km}
            onChange={e => setKm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>

        {/* Importo */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Importo € *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={importo}
            onChange={e => setImporto(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>

        {/* Nota */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Nota (opzionale)</label>
          <input
            type="text"
            placeholder="Descrizione..."
            value={nota}
            onChange={e => setNota(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>

        {/* Reminder (solo per categorie selezionate) */}
        {showReminder && (
          <div className="border border-slate-700 rounded-xl p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={e => setHasReminder(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm text-slate-300 font-medium">Aggiungi reminder prossima scadenza</span>
            </label>

            {hasReminder && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Tipo intervento</label>
                  <select
                    value={tipoIntervento}
                    onChange={e => setTipoIntervento(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                  >
                    <option value="">Seleziona...</option>
                    {TIPI_INTERVENTO.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Data prossima</label>
                  <input
                    type="date"
                    value={dataProssima}
                    onChange={e => setDataProssima(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">KM prossimi</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={kmProssimi}
                    onChange={e => setKmProssimi(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </form>
    </div>
  )
}
