import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { CATEGORIE, TIPI_VEICOLO, TIPI_TAGLIANDO } from '../config'
import { format } from 'date-fns'
import * as api from '../services/api'
import { CheckCircle, Loader2 } from 'lucide-react'

const SEZIONI = [
  { id: 'costo', label: 'Costo', emoji: '💶' },
  { id: 'tagliando', label: 'Tagliando / Reminder', emoji: '🔧' },
]

export default function AddCosto() {
  const { veicoli, refreshCosti, refreshTagliandi } = useApp()
  const [sezione, setSezione] = useState('costo')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Form costo
  const [veicoloId, setVeicoloId] = useState('')
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categoria, setCategoria] = useState('')
  const [importo, setImporto] = useState('')
  const [nota, setNota] = useState('')
  const [litri, setLitri] = useState('')
  const [km, setKm] = useState('')

  // Form tagliando
  const [tVeicoloId, setTVeicoloId] = useState('')
  const [tTipo, setTTipo] = useState('')
  const [tData, setTData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [tKm, setTKm] = useState('')
  const [tDataProssima, setTDataProssima] = useState('')
  const [tKmProssimi, setTKmProssimi] = useState('')
  const [tNota, setTNota] = useState('')
  const [tImporto, setTImporto] = useState('')

  const veicoloSelezionato = veicoli.find(v => v.id === veicoloId)
  const isMotorizzato = TIPI_VEICOLO.find(t => t.id === veicoloSelezionato?.tipo)?.motorizzato ?? true

  const categorieFiltrate = CATEGORIE.filter(c =>
    !c.soloMotorizzati || isMotorizzato
  )

  async function handleSaveCosto(e) {
    e.preventDefault()
    if (!veicoloId || !categoria || !importo) {
      setError('Compila tutti i campi obbligatori')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.addCosto({ veicoloId, data, categoria, importo, nota, litri, km })
      await refreshCosti()
      setSuccess(true)
      setImporto('')
      setNota('')
      setLitri('')
      setKm('')
      setTimeout(() => setSuccess(false), 2000)
    } catch (e) {
      setError('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveTagliando(e) {
    e.preventDefault()
    if (!tVeicoloId || !tTipo) {
      setError('Compila veicolo e tipo')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await api.addTagliando({
        veicoloId: tVeicoloId,
        tipo: tTipo,
        data: tData,
        km: tKm,
        dataProssima: tDataProssima,
        kmProssimi: tKmProssimi,
        nota: tNota,
        importo: tImporto,
      })
      await refreshTagliandi()
      setSuccess(true)
      setTKm('')
      setTDataProssima('')
      setTKmProssimi('')
      setTNota('')
      setTImporto('')
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

      {/* Tab sezione */}
      <div className="flex gap-2 bg-slate-800 p-1 rounded-xl">
        {SEZIONI.map(s => (
          <button
            key={s.id}
            onClick={() => { setSezione(s.id); setError(null); setSuccess(false) }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              sezione === s.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

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

      {sezione === 'costo' ? (
        <form onSubmit={handleSaveCosto} className="space-y-4">
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
                {categorieFiltrate.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoria(c.id)}
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

          {/* Data + Importo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Data *</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
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
          </div>

          {/* Carburante extra */}
          {categoria === 'carburante' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">Litri</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={litri}
                  onChange={e => setLitri(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium mb-1 block">KM percorsi</label>
                <input
                  type="number"
                  placeholder="0"
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
                />
              </div>
            </div>
          )}

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

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? 'Salvataggio...' : 'Salva Costo'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSaveTagliando} className="space-y-4">
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
                    onClick={() => setTVeicoloId(v.id)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      tVeicoloId === v.id
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

          {/* Tipo tagliando */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Tipo intervento *</label>
            <select
              value={tTipo}
              onChange={e => setTTipo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
            >
              <option value="">Seleziona...</option>
              {TIPI_TAGLIANDO.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Data + KM effettuati */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Data effettuato</label>
              <input
                type="date"
                value={tData}
                onChange={e => setTData(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">KM attuali</label>
              <input
                type="number"
                placeholder="0"
                value={tKm}
                onChange={e => setTKm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          {/* Prossimo: data + km */}
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Prossimo intervento (reminder)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Data prossima</label>
              <input
                type="date"
                value={tDataProssima}
                onChange={e => setTDataProssima(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">KM prossimi</label>
              <input
                type="number"
                placeholder="0"
                value={tKmProssimi}
                onChange={e => setTKmProssimi(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          {/* Importo + Nota */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Costo €</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={tImporto}
                onChange={e => setTImporto(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Nota</label>
              <input
                type="text"
                placeholder="..."
                value={tNota}
                onChange={e => setTNota(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? 'Salvataggio...' : 'Salva Tagliando'}
          </button>
        </form>
      )}
    </div>
  )
}
