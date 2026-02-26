import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TIPI_VEICOLO } from '../config'
import * as api from '../services/api'
import { Plus, Trash2, Loader2, X, ChevronDown } from 'lucide-react'

function VeicoloForm({ onSave, onCancel }) {
  const [nome, setNome] = useState('')
  const [targa, setTarga] = useState('')
  const [tipo, setTipo] = useState('auto')
  const [anno, setAnno] = useState(new Date().getFullYear().toString())
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nome) return
    setSaving(true)
    try {
      await api.addVeicolo({ nome, targa, tipo, anno, nota })
      onSave()
    } catch {
      // silently fail — parent handles refresh
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">Nuovo veicolo</p>
        <button type="button" onClick={onCancel} className="text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nome *</label>
        <input
          type="text"
          placeholder="es. Pickup Ford"
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Targa</label>
          <input
            type="text"
            placeholder="AB123CD"
            value={targa}
            onChange={e => setTarga(e.target.value.toUpperCase())}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Anno</label>
          <input
            type="number"
            placeholder="2020"
            value={anno}
            onChange={e => setAnno(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
        <div className="grid grid-cols-3 gap-2">
          {TIPI_VEICOLO.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipo(t.id)}
              className={`p-2 rounded-xl border text-center transition-colors ${
                tipo === t.id
                  ? 'border-blue-500 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-700 text-slate-300'
              }`}
            >
              <span className="text-xl block">{t.emoji}</span>
              <span className="text-xs block mt-0.5 leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Note</label>
        <input
          type="text"
          placeholder="Info aggiuntive..."
          value={nota}
          onChange={e => setNota(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !nome}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {saving ? 'Salvataggio...' : 'Aggiungi Veicolo'}
      </button>
    </form>
  )
}

export default function Veicoli() {
  const { veicoli, costi, tagliandi, refreshVeicoli, refreshCosti, refreshTagliandi } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  async function handleSave() {
    await refreshVeicoli()
    setShowForm(false)
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo veicolo? Verranno eliminati anche tutti i costi e tagliandi associati.')) return
    setDeleting(id)
    try {
      await api.deleteVeicolo(id)
      await Promise.all([refreshVeicoli(), refreshCosti(), refreshTagliandi()])
    } finally {
      setDeleting(null)
    }
  }

  function getTotale(vId) {
    return costi.filter(c => c.veicoloId === vId).reduce((s, c) => s + Number(c.importo), 0)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Veicoli</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus size={16} />
          Aggiungi
        </button>
      </div>

      {showForm && (
        <VeicoloForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      <div className="space-y-3">
        {veicoli.map(v => {
          const tipo = TIPI_VEICOLO.find(t => t.id === v.tipo)
          const totale = getTotale(v.id)
          const nTagliandi = tagliandi.filter(t => t.veicoloId === v.id).length
          const isExpanded = expandedId === v.id

          return (
            <div key={v.id} className="bg-slate-800 rounded-2xl overflow-hidden">
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpandedId(isExpanded ? null : v.id)}
              >
                <span className="text-3xl">{tipo?.emoji || '🚗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{v.nome}</p>
                  <p className="text-xs text-slate-400">
                    {v.targa} · {v.anno} · {tipo?.label}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">€ {totale.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">totale</p>
                </div>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-700 rounded-xl p-2">
                      <p className="text-lg font-bold">€ {totale.toFixed(0)}</p>
                      <p className="text-xs text-slate-400">Tot. spese</p>
                    </div>
                    <div className="bg-slate-700 rounded-xl p-2">
                      <p className="text-lg font-bold">{costi.filter(c => c.veicoloId === v.id).length}</p>
                      <p className="text-xs text-slate-400">Movimenti</p>
                    </div>
                    <div className="bg-slate-700 rounded-xl p-2">
                      <p className="text-lg font-bold">{nTagliandi}</p>
                      <p className="text-xs text-slate-400">Tagliandi</p>
                    </div>
                  </div>

                  {v.nota && (
                    <p className="text-sm text-slate-400">{v.nota}</p>
                  )}

                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deleting === v.id}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  >
                    {deleting === v.id
                      ? <Loader2 size={16} className="animate-spin" />
                      : <Trash2 size={16} />
                    }
                    Elimina veicolo
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {veicoli.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <p>Nessun veicolo ancora.</p>
          <p className="text-sm mt-1">Aggiungi il primo con il bottone in alto!</p>
        </div>
      )}
    </div>
  )
}
