import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { CATEGORIE, TIPI_VEICOLO } from '../config'
import { parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#a78bfa']

function fmtDate(s) {
  if (!s) return '—'
  const parts = s.split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : s
}

const ANNI = (() => {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
})()

const MESI = [
  { v: 0, l: 'Tutti' },
  { v: 1, l: 'Gen' }, { v: 2, l: 'Feb' }, { v: 3, l: 'Mar' },
  { v: 4, l: 'Apr' }, { v: 5, l: 'Mag' }, { v: 6, l: 'Giu' },
  { v: 7, l: 'Lug' }, { v: 8, l: 'Ago' }, { v: 9, l: 'Set' },
  { v: 10, l: 'Ott' }, { v: 11, l: 'Nov' }, { v: 12, l: 'Dic' },
]

export default function Riepilogo() {
  const { veicoli, costi } = useApp()
  const [anno, setAnno] = useState(new Date().getFullYear())
  const [mese, setMese] = useState(0)
  const [veicoloId, setVeicoloId] = useState('tutti')

  const costiFiltrati = useMemo(() => {
    return costi.filter(c => {
      const d = parseISO(c.data)
      const okAnno = d.getFullYear() === anno
      const okMese = mese === 0 || d.getMonth() + 1 === mese
      const okVeicolo = veicoloId === 'tutti' || String(c.veicoloId) === String(veicoloId)
      return okAnno && okMese && okVeicolo
    })
  }, [costi, anno, mese, veicoloId])

  const totale = costiFiltrati.reduce((s, c) => s + Number(c.importo), 0)

  // Per categoria (pie)
  const perCategoria = useMemo(() => {
    const map = {}
    costiFiltrati.forEach(c => {
      map[c.categoria] = (map[c.categoria] || 0) + Number(c.importo)
    })
    return Object.entries(map)
      .map(([cat, val]) => ({
        name: CATEGORIE.find(c => c.id === cat)?.label || cat,
        value: Number(val.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
  }, [costiFiltrati])

  // Per veicolo (bar)
  const perVeicolo = useMemo(() => {
    return veicoli.map(v => ({
      name: v.nome,
      totale: Number(
        costiFiltrati
          .filter(c => String(c.veicoloId) === String(v.id))
          .reduce((s, c) => s + Number(c.importo), 0)
          .toFixed(2)
      )
    })).filter(v => v.totale > 0)
  }, [veicoli, costiFiltrati])

  // Per mese (bar — solo se "tutti i mesi")
  const perMese = useMemo(() => {
    if (mese !== 0) return []
    const map = {}
    for (let m = 1; m <= 12; m++) map[m] = 0
    costiFiltrati.forEach(c => {
      const m = parseISO(c.data).getMonth() + 1
      map[m] += Number(c.importo)
    })
    return Object.entries(map).map(([m, val]) => ({
      name: MESI.find(x => x.v === Number(m))?.l || m,
      totale: Number(val.toFixed(2))
    }))
  }, [costiFiltrati, mese])

  // Lista movimenti
  const movimenti = [...costiFiltrati].sort((a, b) => new Date(b.data) - new Date(a.data))

  function getNomeVeicolo(id) {
    return veicoli.find(v => v.id === id)?.nome || '—'
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold pt-2">Riepilogo</h1>

      {/* Filtri */}
      <div className="bg-slate-800 rounded-2xl p-3 space-y-3">
        {/* Anno */}
        <div className="flex gap-2">
          {ANNI.map(a => (
            <button
              key={a}
              onClick={() => setAnno(a)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                anno === a ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >{a}</button>
          ))}
        </div>

        {/* Mese */}
        <div className="flex gap-1 flex-wrap">
          {MESI.map(m => (
            <button
              key={m.v}
              onClick={() => setMese(m.v)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                mese === m.v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-700'
              }`}
            >{m.l}</button>
          ))}
        </div>

        {/* Veicolo */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setVeicoloId('tutti')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              veicoloId === 'tutti' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-700'
            }`}
          >Tutti</button>
          {veicoli.map(v => (
            <button
              key={v.id}
              onClick={() => setVeicoloId(v.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                veicoloId === v.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white bg-slate-700'
              }`}
            >
              {TIPI_VEICOLO.find(t => t.id === v.tipo)?.emoji} {v.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Totale */}
      <div className="bg-blue-900/40 border border-blue-700/50 rounded-2xl p-4">
        <p className="text-blue-300 text-sm">Totale spese</p>
        <p className="text-3xl font-bold mt-1">€ {totale.toFixed(2)}</p>
        <p className="text-slate-400 text-xs mt-1">{costiFiltrati.length} movimenti</p>
      </div>

      {/* Grafico per mese */}
      {perMese.length > 0 && perMese.some(m => m.totale > 0) && (
        <div className="bg-slate-800 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-300 mb-3">Andamento mensile</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={perMese} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={v => [`€ ${v}`, 'Spesa']}
              />
              <Bar dataKey="totale" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grafico per veicolo */}
      {perVeicolo.length > 1 && (
        <div className="bg-slate-800 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-300 mb-3">Per veicolo</p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={perVeicolo} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={v => [`€ ${v}`, 'Spesa']}
              />
              <Bar dataKey="totale" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grafico per categoria */}
      {perCategoria.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4">
          <p className="text-sm font-semibold text-slate-300 mb-3">Per categoria</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={perCategoria}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {perCategoria.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={v => [`€ ${v}`]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {perCategoria.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-300">{c.name}</span>
                </div>
                <span className="font-medium">€ {c.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista movimenti */}
      {movimenti.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-300">Movimenti</p>
          {movimenti.map(c => {
            const cat = CATEGORIE.find(x => x.id === c.categoria)
            return (
              <div key={c.id} className="flex items-center justify-between border-b border-slate-700 pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat?.emoji || '📦'}</span>
                  <div>
                    <p className="text-sm">{getNomeVeicolo(c.veicoloId)}</p>
                    <p className="text-xs text-slate-400">{c.nota || cat?.label} · {fmtDate(c.data)}</p>
                  </div>
                </div>
                <span className="font-semibold text-sm">€ {Number(c.importo).toFixed(2)}</span>
              </div>
            )
          })}
        </div>
      )}

      {movimenti.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          Nessun movimento nel periodo selezionato
        </div>
      )}
    </div>
  )
}
