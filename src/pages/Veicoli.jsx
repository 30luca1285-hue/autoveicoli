import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TIPI_VEICOLO, CARBURANTI, INTERVALLI_REVISIONE, CATEGORIE, TIPI_INTERVENTO } from '../config'

function fmtDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : s
}

const CATEGORIA_TIPO_MAP = {
  manutenzione: 'Tagliando ordinario',
  assicurazione: 'Assicurazione',
  bollo: 'Bollo',
  revisione: 'Revisione periodica',
  pneumatici: 'Cambio pneumatici',
  altro: 'Altro',
}
import * as api from '../services/api'
import { addDays, parseISO, isBefore, isAfter } from 'date-fns'
import { Plus, Trash2, Loader2, X, ChevronDown, Save, Pencil, Bell, Wrench } from 'lucide-react'

function VeicoloForm({ onSave, onCancel }) {
  const [nome, setNome] = useState('')
  const [targa, setTarga] = useState('')
  const [tipo, setTipo] = useState('auto')
  const [dataImmatricolazione, setDataImmatricolazione] = useState('')
  const [carburante, setCarburante] = useState('')
  const [intervaloRevisione, setIntervaloRevisione] = useState('24')
  const [kmAttuali, setKmAttuali] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const isMotorizzato = TIPI_VEICOLO.find(t => t.id === tipo)?.motorizzato ?? true

  async function handleSubmit() {
    if (!nome) {
      setError('Inserisci il nome del veicolo')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const result = await api.addVeicolo({ nome, targa, tipo, dataImmatricolazione, carburante, intervaloRevisione, kmAttuali, nota })
      if (result.error) throw new Error(result.error)
      onSave({ id: result.id, nome, targa, tipo, dataImmatricolazione, carburante, intervaloRevisione, kmAttuali, nota })
    } catch (err) {
      setError('Errore nel salvataggio: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Nuovo veicolo</p>
        <button type="button" onClick={onCancel} className="text-slate-400"><X size={20} /></button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nome *</label>
        <input type="text" placeholder="es. Fiat Doblo" value={nome} onChange={e => setNome(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Targa</label>
          <input type="text" placeholder="AB123CD" value={targa} onChange={e => setTarga(e.target.value.toUpperCase())}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
        </div>
        <div className="min-w-0">
          <label className="text-xs text-slate-400 mb-1 block">Immatricolazione</label>
          <input type="date" value={dataImmatricolazione} onChange={e => setDataImmatricolazione(e.target.value)}
            className="w-full min-w-0 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
        </div>
        <div className="min-w-0">
          <label className="text-xs text-slate-400 mb-1 block">KM attuali</label>
          <input type="number" placeholder="0" value={kmAttuali} onChange={e => setKmAttuali(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Tipo</label>
        <div className="grid grid-cols-3 gap-2">
          {TIPI_VEICOLO.map(t => (
            <button key={t.id} type="button" onClick={() => { setTipo(t.id); if (!t.motorizzato) setCarburante('') }}
              className={`p-2 rounded-xl border text-center transition-colors ${
                tipo === t.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
              <span className="text-xl block">{t.emoji}</span>
              <span className="text-xs block mt-0.5 leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isMotorizzato && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Carburante</label>
          <div className="grid grid-cols-3 gap-2">
            {CARBURANTI.map(c => (
              <button key={c.id} type="button" onClick={() => setCarburante(c.id)}
                className={`p-2 rounded-xl border text-center transition-colors ${
                  carburante === c.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
                <span className="text-lg block">{c.emoji}</span>
                <span className="text-xs block mt-0.5 leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Revisione ogni</label>
        <div className="grid grid-cols-3 gap-2">
          {INTERVALLI_REVISIONE.map(r => (
            <button key={r.mesi} type="button" onClick={() => setIntervaloRevisione(String(r.mesi))}
              className={`p-2 rounded-xl border text-center transition-colors ${
                intervaloRevisione === String(r.mesi) ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
              <span className="text-base font-bold block">{r.mesi}</span>
              <span className="text-xs block text-slate-400">mesi</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {INTERVALLI_REVISIONE.find(r => String(r.mesi) === intervaloRevisione)?.label}
        </p>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1 block">Note</label>
        <input type="text" placeholder="Info aggiuntive..." value={nota} onChange={e => setNota(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
      </div>

      <button type="button" onClick={handleSubmit} disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        {saving ? 'Salvataggio...' : 'Aggiungi Veicolo'}
      </button>
    </div>
  )
}

function VeicoloEdit({ veicolo, onSave, onCancel }) {
  const [nome, setNome] = useState(veicolo.nome || '')
  const [targa, setTarga] = useState(veicolo.targa || '')
  const [tipo, setTipo] = useState(veicolo.tipo || 'auto')
  const [dataImmatricolazione, setDataImmatricolazione] = useState(veicolo.dataImmatricolazione || '')
  const [carburante, setCarburante] = useState(veicolo.carburante || '')
  const [intervaloRevisione, setIntervaloRevisione] = useState(veicolo.intervaloRevisione || '24')
  const [kmAttuali, setKmAttuali] = useState(veicolo.kmAttuali || '')
  const [nota, setNota] = useState(veicolo.nota || '')
  const [saving, setSaving] = useState(false)

  const isMotorizzato = TIPI_VEICOLO.find(t => t.id === tipo)?.motorizzato ?? true

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateVeicolo({ id: veicolo.id, nome, targa, tipo, dataImmatricolazione, carburante, intervaloRevisione, kmAttuali, nota })
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-700">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Nome</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Targa</label>
          <input type="text" value={targa} onChange={e => setTarga(e.target.value.toUpperCase())}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Immatricolazione</label>
          <input type="date" value={dataImmatricolazione} onChange={e => setDataImmatricolazione(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">KM attuali</label>
          <input type="number" value={kmAttuali} onChange={e => setKmAttuali(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" />
        </div>
      </div>
      {isMotorizzato && (
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Carburante</label>
          <div className="flex gap-1.5 flex-wrap">
            {CARBURANTI.map(c => (
              <button key={c.id} type="button" onClick={() => setCarburante(c.id)}
                className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                  carburante === c.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Revisione ogni</label>
        <div className="flex gap-2">
          {INTERVALLI_REVISIONE.map(r => (
            <button key={r.mesi} type="button" onClick={() => setIntervaloRevisione(String(r.mesi))}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                intervaloRevisione === String(r.mesi) ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-700 text-slate-300'}`}>
              {r.mesi} mesi
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Note</label>
        <input type="text" value={nota} onChange={e => setNota(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm">
          Annulla
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Salvo...' : 'Salva'}
        </button>
      </div>
    </form>
  )
}

function ReminderAddForm({ veicoloId, onSave, onCancel }) {
  const [tipo, setTipo] = useState(TIPI_INTERVENTO[0])
  const [dataProssima, setDataProssima] = useState('')
  const [kmProssimi, setKmProssimi] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!dataProssima) return
    setSaving(true)
    try {
      await api.addTagliando({ veicoloId, tipo, dataProssima, kmProssimi, nota })
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-700 rounded-xl p-3 space-y-2">
      <div>
        <label className="text-xs text-slate-400 mb-0.5 block">Tipo</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs">
          {TIPI_INTERVENTO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Scadenza *</label>
          <input type="date" value={dataProssima} onChange={e => setDataProssima(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">KM scadenza</label>
          <input type="number" placeholder="—" value={kmProssimi} onChange={e => setKmProssimi(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-0.5 block">Nota</label>
        <input type="text" placeholder="..." value={nota} onChange={e => setNota(e.target.value)}
          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-slate-500 text-slate-300 text-xs">
          Annulla
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !dataProssima}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Salvo...' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

function TagliandoEditRow({ t, onSave, onCancel }) {
  const [tipo, setTipo] = useState(t.tipo || '')
  const [data, setData] = useState(t.data || '')
  const [km, setKm] = useState(t.km || '')
  const [dataProssima, setDataProssima] = useState(t.dataProssima || '')
  const [kmProssimi, setKmProssimi] = useState(t.kmProssimi || '')
  const [importo, setImporto] = useState(t.importo || '')
  const [nota, setNota] = useState(t.nota || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateTagliando({ id: t.id, tipo, data, km, dataProssima, kmProssimi, importo, nota })
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-700 rounded-xl p-3 space-y-2">
      <div>
        <label className="text-xs text-slate-400 mb-0.5 block">Tipo</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs">
          {TIPI_INTERVENTO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Data effettuato</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">KM attuali</label>
          <input type="number" placeholder="—" value={km} onChange={e => setKm(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Prossima data</label>
          <input type="date" value={dataProssima} onChange={e => setDataProssima(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">KM prossimi</label>
          <input type="number" placeholder="—" value={kmProssimi} onChange={e => setKmProssimi(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Importo €</label>
          <input type="number" step="0.01" placeholder="0.00" value={importo} onChange={e => setImporto(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Nota</label>
          <input type="text" placeholder="..." value={nota} onChange={e => setNota(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-slate-500 text-slate-300 text-xs">
          Annulla
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Salvo...' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

function CostoEditRow({ c, tagliando, onSave, onCancel }) {
  const [categoria, setCategoria] = useState(c.categoria || '')
  const [data, setData] = useState(c.data || '')
  const [km, setKm] = useState(c.km || '')
  const [importo, setImporto] = useState(c.importo || '')
  const [nota, setNota] = useState(c.nota || '')
  const [dataProssima, setDataProssima] = useState(tagliando?.dataProssima || '')
  const [kmProssimi, setKmProssimi] = useState(tagliando?.kmProssimi || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateCosto({ id: c.id, categoria, data, km, importo, nota })
      if (tagliando) {
        await api.updateTagliando({ id: tagliando.id, dataProssima, kmProssimi })
      } else if (dataProssima || kmProssimi) {
        await api.addTagliando({
          veicoloId: c.veicoloId,
          tipo: CATEGORIA_TIPO_MAP[categoria] || 'Altro',
          data, km, dataProssima, kmProssimi, nota, importo,
        })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-700 rounded-xl p-3 space-y-2">
      <div>
        <label className="text-xs text-slate-400 mb-0.5 block">Categoria</label>
        <div className="grid grid-cols-3 gap-1">
          {CATEGORIE.map(cat => (
            <button key={cat.id} type="button" onClick={() => setCategoria(cat.id)}
              className={`py-1 px-1 rounded-lg border text-xs text-center transition-colors ${
                categoria === cat.id ? 'border-blue-500 bg-blue-900/30 text-white' : 'border-slate-600 bg-slate-600 text-slate-300'
              }`}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">KM</label>
          <input type="number" placeholder="—" value={km} onChange={e => setKm(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Importo €</label>
          <input type="number" step="0.01" placeholder="0.00" value={importo} onChange={e => setImporto(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-0.5 block">Nota</label>
          <input type="text" placeholder="..." value={nota} onChange={e => setNota(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
        </div>
      </div>
      <div className="border-t border-slate-600 pt-2 space-y-2">
        <p className="text-xs text-slate-400 flex items-center gap-1"><Bell size={10} /> Reminder</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-slate-400 mb-0.5 block">Prossima data</label>
            <input type="date" value={dataProssima} onChange={e => setDataProssima(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-0.5 block">KM prossimi</label>
            <input type="number" placeholder="—" value={kmProssimi} onChange={e => setKmProssimi(e.target.value)}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-2 py-1.5 text-white text-xs" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-slate-500 text-slate-300 text-xs">
          Annulla
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Salvo...' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

export default function Veicoli() {
  const { veicoli, setVeicoli, costi, tagliandi, refreshVeicoli, refreshCosti, refreshTagliandi } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [editingTagliandoId, setEditingTagliandoId] = useState(null)
  const [deletingTagliandoId, setDeletingTagliandoId] = useState(null)
  const [editingCostoId, setEditingCostoId] = useState(null)
  const [deletingCostoId, setDeletingCostoId] = useState(null)
  const [expandedInterventi, setExpandedInterventi] = useState({})
  const [expandedReminder, setExpandedReminder] = useState({})
  const [addingReminderId, setAddingReminderId] = useState(null)

  function handleSave(newVeicolo) {
    if (newVeicolo) {
      setVeicoli(prev => [...prev, newVeicolo])
    }
    setShowForm(false)
  }

  async function handleUpdate() {
    await refreshVeicoli()
    setEditingId(null)
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

  async function handleUpdateCosto() {
    await Promise.all([refreshCosti(), refreshTagliandi()])
    setEditingCostoId(null)
  }

  async function handleDeleteCosto(id) {
    if (!confirm('Eliminare questa spesa?')) return
    setDeletingCostoId(id)
    try {
      await api.deleteCosto(id)
      await refreshCosti()
    } finally {
      setDeletingCostoId(null)
    }
  }

  async function handleDeleteTagliando(id) {
    if (!confirm('Eliminare questo reminder/tagliando?')) return
    setDeletingTagliandoId(id)
    try {
      await api.deleteTagliando(id)
      await refreshTagliandi()
    } finally {
      setDeletingTagliandoId(null)
    }
  }

  async function handleUpdateTagliando() {
    await refreshTagliandi()
    setEditingTagliandoId(null)
  }

  async function handleSaveReminder(vId) {
    await refreshTagliandi()
    setAddingReminderId(null)
  }

  function getTagliandoStatus(dataProssima) {
    if (!dataProssima) return null
    const oggi = new Date()
    const d = parseISO(dataProssima)
    if (isBefore(d, oggi)) return 'scaduto'
    if (!isAfter(d, addDays(oggi, 30))) return 'vicino'
    return 'ok'
  }

  function getTotale(vId) {
    return costi.filter(c => String(c.veicoloId) === String(vId)).reduce((s, c) => s + Number(c.importo), 0)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Veicoli</h1>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium">
            <Plus size={16} /> Aggiungi
          </button>
        )}
      </div>

      {showForm && <VeicoloForm onSave={handleSave} onCancel={() => setShowForm(false)} />}

      <div className="space-y-3">
        {veicoli.map(v => {
          const tipoObj = TIPI_VEICOLO.find(t => t.id === v.tipo)
          const carbObj = CARBURANTI.find(c => c.id === v.carburante)
          const totale = getTotale(v.id)
          const isExpanded = expandedId === v.id
          const isEditing = editingId === v.id

          return (
            <div key={v.id} className="bg-slate-800 rounded-2xl overflow-hidden">
              <button className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => { setExpandedId(isExpanded ? null : v.id); setEditingId(null) }}>
                <span className="text-3xl">{tipoObj?.emoji || '🚗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{v.nome}</p>
                  <p className="text-xs text-slate-400">
                    {v.targa}{v.dataImmatricolazione ? ` · ${v.dataImmatricolazione.split('-')[0]}` : v.anno ? ` · ${v.anno}` : ''}{carbObj ? ` · ${carbObj.emoji} ${carbObj.label}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">€ {totale.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">totale</p>
                </div>
                <ChevronDown size={18} className={`text-slate-400 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {!isEditing ? (
                    <>
                      <div className="bg-slate-700 rounded-xl p-2 text-center">
                        <p className="text-lg font-bold">€ {totale.toFixed(0)}</p>
                        <p className="text-xs text-slate-400">Tot. spese</p>
                      </div>

                      <div className="bg-slate-700/50 rounded-xl p-3 space-y-2 text-sm">
                        {v.dataImmatricolazione && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Immatricolazione</span>
                            <span>{fmtDate(v.dataImmatricolazione)}</span>
                          </div>
                        )}
                        {v.kmAttuali && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">KM attuali</span>
                            <span>{Number(v.kmAttuali).toLocaleString('it-IT')} km</span>
                          </div>
                        )}
                        {carbObj && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Carburante</span>
                            <span>{carbObj.emoji} {carbObj.label}</span>
                          </div>
                        )}
                        {v.intervaloRevisione && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Revisione ogni</span>
                            <span>{v.intervaloRevisione} mesi</span>
                          </div>
                        )}
                        {v.nota && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Note</span>
                            <span className="text-right max-w-[60%] text-xs">{v.nota}</span>
                          </div>
                        )}
                      </div>

                      {/* Sezione Interventi (da costi, escluso carburante) */}
                      {(() => {
                        const catIds = new Set(CATEGORIE.map(c => c.id))
                        const vCosti = costi
                          .filter(c => String(c.veicoloId) === String(v.id) && catIds.has(c.categoria))
                          .sort((a, b) => b.data.localeCompare(a.data))
                        if (vCosti.length === 0) return null
                        const LIMIT = 3
                        const isExp = expandedInterventi[v.id]
                        const shown = isExp ? vCosti : vCosti.slice(0, LIMIT)
                        return (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                              <Wrench size={11} /> Interventi ({vCosti.length})
                            </p>
                            {shown.map(c => {
                              if (editingCostoId === c.id) {
                                const matchingTagliando = tagliandi.find(t =>
                                  String(t.veicoloId) === String(c.veicoloId) && t.data === c.data
                                )
                                return (
                                  <CostoEditRow key={c.id} c={c}
                                    tagliando={matchingTagliando}
                                    onSave={handleUpdateCosto}
                                    onCancel={() => setEditingCostoId(null)} />
                                )
                              }
                              const catObj = CATEGORIE.find(cat => cat.id === c.categoria)
                              return (
                                <div key={c.id} className="rounded-xl p-2.5 flex items-start justify-between gap-2 bg-slate-700">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-white">
                                      {catObj?.emoji} {catObj?.label || c.categoria}
                                    </p>
                                    {c.data && <p className="text-xs text-slate-400 mt-0.5">{fmtDate(c.data)}</p>}
                                    {c.km && <p className="text-xs text-slate-500">KM: {Number(c.km).toLocaleString('it-IT')}</p>}
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">€ {c.importo ? Number(c.importo).toFixed(2) : '—'}</p>
                                    {c.nota && <p className="text-xs text-slate-500 italic">{c.nota}</p>}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => setEditingCostoId(c.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600">
                                      <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDeleteCosto(c.id)}
                                      disabled={deletingCostoId === c.id}
                                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 disabled:opacity-50">
                                      {deletingCostoId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            {vCosti.length > LIMIT && (
                              <button onClick={() => setExpandedInterventi(prev => ({ ...prev, [v.id]: !isExp }))}
                                className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 flex items-center justify-center gap-1">
                                <ChevronDown size={13} className={isExp ? 'rotate-180' : ''} />
                                {isExp ? 'Mostra meno' : `Mostra tutti (${vCosti.length})`}
                              </button>
                            )}
                          </div>
                        )
                      })()}

                      {/* Sezione Reminder */}
                      {(() => {
                        const vReminder = tagliandi
                          .filter(t => String(t.veicoloId) === String(v.id) && t.dataProssima)
                          .sort((a, b) => a.dataProssima.localeCompare(b.dataProssima))
                        const LIMIT = 3
                        const isExp = expandedReminder[v.id]
                        const shown = isExp ? vReminder : vReminder.slice(0, LIMIT)
                        const isAddingHere = addingReminderId === v.id
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                <Bell size={11} /> Reminder{vReminder.length > 0 ? ` (${vReminder.length})` : ''}
                              </p>
                              {!isAddingHere && (
                                <button onClick={() => setAddingReminderId(v.id)}
                                  className="flex items-center gap-0.5 text-xs text-blue-400 hover:text-blue-300">
                                  <Plus size={12} /> Aggiungi
                                </button>
                              )}
                            </div>
                            {isAddingHere && (
                              <ReminderAddForm
                                veicoloId={v.id}
                                onSave={() => handleSaveReminder(v.id)}
                                onCancel={() => setAddingReminderId(null)} />
                            )}
                            {shown.map(t => {
                              const isEditingThis = editingTagliandoId === t.id
                              if (isEditingThis) {
                                return (
                                  <TagliandoEditRow key={`r-${t.id}`} t={t}
                                    onSave={handleUpdateTagliando}
                                    onCancel={() => setEditingTagliandoId(null)} />
                                )
                              }
                              const status = getTagliandoStatus(t.dataProssima)
                              return (
                                <div key={`r-${t.id}`}
                                  className={`rounded-xl p-2.5 flex items-start justify-between gap-2 ${
                                    status === 'scaduto' ? 'bg-red-900/30 border border-red-700/50' :
                                    status === 'vicino'  ? 'bg-amber-900/30 border border-amber-700/50' :
                                                          'bg-slate-700/60'
                                  }`}>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-semibold ${
                                      status === 'scaduto' ? 'text-red-300' :
                                      status === 'vicino'  ? 'text-amber-300' : 'text-white'
                                    }`}>
                                      {t.tipo}
                                      {status === 'scaduto' && ' — SCADUTO'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">Scadenza: {fmtDate(t.dataProssima)}</p>
                                    {t.kmProssimi && (
                                      <p className="text-xs text-slate-500">KM: {Number(t.kmProssimi).toLocaleString('it-IT')}</p>
                                    )}
                                    {t.nota && (
                                      <p className="text-xs text-slate-400 mt-0.5 italic">{t.nota}</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button onClick={() => setEditingTagliandoId(t.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50">
                                      <Pencil size={13} />
                                    </button>
                                    <button onClick={() => handleDeleteTagliando(t.id)}
                                      disabled={deletingTagliandoId === t.id}
                                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/30 disabled:opacity-50">
                                      {deletingTagliandoId === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                            {vReminder.length > LIMIT && (
                              <button onClick={() => setExpandedReminder(prev => ({ ...prev, [v.id]: !isExp }))}
                                className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 flex items-center justify-center gap-1">
                                <ChevronDown size={13} className={isExp ? 'rotate-180' : ''} />
                                {isExp ? 'Mostra meno' : `Mostra tutti (${vReminder.length})`}
                              </button>
                            )}
                          </div>
                        )
                      })()}

                      <div className="space-y-2">
                        <button onClick={() => setEditingId(v.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-600 text-slate-300 text-sm hover:text-white">
                          <Pencil size={14} /> Modifica
                        </button>
                        <div className="flex justify-center">
                          <button onClick={() => handleDelete(v.id)} disabled={deleting === v.id}
                            className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 disabled:opacity-50 transition-colors py-1">
                            {deleting === v.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                            Elimina veicolo
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <VeicoloEdit veicolo={v} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                  )}
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
