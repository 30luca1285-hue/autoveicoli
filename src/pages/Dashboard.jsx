import { useApp } from '../context/AppContext'
import { CATEGORIE, TIPI_VEICOLO } from '../config'
import { format, isAfter, isBefore, addDays, parseISO, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { AlertTriangle, Car, RefreshCw, CalendarClock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function meseCorrente() {
  const now = new Date()
  return { mese: now.getMonth() + 1, anno: now.getFullYear() }
}

export default function Dashboard() {
  const { veicoli, costi, tagliandi, loading, error, configured, refresh } = useApp()
  const navigate = useNavigate()
  const { mese, anno } = meseCorrente()

  if (!configured) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center">
        <Car size={48} className="text-blue-400" />
        <h1 className="text-2xl font-bold">Autoveicoli</h1>
        <p className="text-slate-400 max-w-xs">
          Per iniziare devi configurare l'URL del backend Google Apps Script.
        </p>
        <button
          onClick={() => navigate('/impostazioni')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Vai alle Impostazioni
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <RefreshCw className="animate-spin text-blue-400" size={32} />
      </div>
    )
  }

  // Costi del mese corrente
  const costiMese = costi.filter(c => {
    const d = parseISO(c.data)
    return d.getMonth() + 1 === mese && d.getFullYear() === anno
  })
  const totaleMese = costiMese.reduce((s, c) => s + Number(c.importo), 0)

  // Scadenze prossime (30 giorni)
  const oggi = new Date()
  const fra30 = addDays(oggi, 30)
  const scadenzeVicine = tagliandi.filter(t => {
    if (!t.dataProssima) return false
    const d = parseISO(t.dataProssima)
    return !isBefore(d, oggi) && !isAfter(d, fra30)
  })
  const scadenzeScadute = tagliandi.filter(t => {
    if (!t.dataProssima) return false
    return isBefore(parseISO(t.dataProssima), oggi)
  })

  // Totale per veicolo (mese corrente)
  const perVeicolo = veicoli.map(v => ({
    ...v,
    totale: costiMese.filter(c => c.veicoloId === v.id).reduce((s, c) => s + Number(c.importo), 0)
  }))

  // Ultimo costo inserito
  const ultimiCosti = [...costi]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 5)

  function getTipoEmoji(tipo) {
    return TIPI_VEICOLO.find(t => t.id === tipo)?.emoji || '🚗'
  }

  function getCatEmoji(cat) {
    return CATEGORIE.find(c => c.id === cat)?.emoji || '📦'
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Autoveicoli</h1>
          <p className="text-slate-400 text-sm">{format(new Date(), 'MMMM yyyy', { locale: it })}</p>
        </div>
        <button onClick={refresh} className="p-2 text-slate-400 hover:text-white">
          <RefreshCw size={20} />
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-xl p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Totale mese */}
      <div className="bg-blue-900/40 border border-blue-700/50 rounded-2xl p-4">
        <p className="text-blue-300 text-sm font-medium">Spesa totale mese</p>
        <p className="text-3xl font-bold mt-1">€ {totaleMese.toFixed(2)}</p>
        <p className="text-slate-400 text-xs mt-1">{costiMese.length} movimenti</p>
      </div>

      {/* Alert scadenze */}
      {(scadenzeScadute.length > 0 || scadenzeVicine.length > 0) && (
        <div className="space-y-2">
          {scadenzeScadute.map(t => {
            const v = veicoli.find(v => v.id === t.veicoloId)
            return (
              <div key={t.id} className="bg-red-900/40 border border-red-700/60 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-300">{t.tipo} — SCADUTO</p>
                  <p className="text-xs text-slate-400">{v?.nome} · {t.dataProssima}</p>
                </div>
              </div>
            )
          })}
          {scadenzeVicine.map(t => {
            const v = veicoli.find(v => v.id === t.veicoloId)
            return (
              <div key={t.id} className="bg-amber-900/40 border border-amber-700/60 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">{t.tipo}</p>
                  <p className="text-xs text-slate-400">{v?.nome} · {t.dataProssima}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Prossimi appuntamenti per veicolo */}
      {(() => {
        const futuri = tagliandi
          .filter(t => t.dataProssima && !isBefore(parseISO(t.dataProssima), oggi))
          .sort((a, b) => parseISO(a.dataProssima) - parseISO(b.dataProssima))

        const veicoliConApp = veicoli
          .map(v => ({ ...v, app: futuri.filter(t => t.veicoloId === v.id) }))
          .filter(v => v.app.length > 0)

        if (veicoliConApp.length === 0) return null

        return (
          <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-slate-400" />
              <p className="text-sm font-semibold text-slate-300">Prossimi appuntamenti</p>
            </div>
            {veicoliConApp.map(v => (
              <div key={v.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTipoEmoji(v.tipo)}</span>
                  <span className="text-sm font-semibold">{v.nome}</span>
                </div>
                {v.app.map(t => {
                  const d = parseISO(t.dataProssima)
                  const giorni = differenceInDays(d, oggi)
                  const questoMese = d.getMonth() === oggi.getMonth() && d.getFullYear() === oggi.getFullYear()
                  const prossimoMese = d.getMonth() === (oggi.getMonth() + 1) % 12
                  return (
                    <div key={t.id} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                      questoMese
                        ? 'bg-amber-900/30 border border-amber-700/40'
                        : prossimoMese
                          ? 'bg-slate-700/80 border border-slate-600/50'
                          : 'bg-slate-700/50'
                    }`}>
                      <p className={`text-sm font-medium ${questoMese ? 'text-amber-200' : 'text-white'}`}>
                        {t.tipo}
                      </p>
                      <div className="text-right">
                        <p className="text-xs text-slate-300">{t.dataProssima}</p>
                        <p className={`text-xs font-medium ${questoMese ? 'text-amber-400' : 'text-slate-400'}`}>
                          {giorni === 0 ? 'oggi' : giorni === 1 ? 'domani' : `tra ${giorni}gg`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      })()}

      {/* Spesa per veicolo */}
      {perVeicolo.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-300">Spesa per veicolo (mese)</p>
          {perVeicolo.map(v => (
            <div key={v.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getTipoEmoji(v.tipo)}</span>
                <span className="text-sm">{v.nome}</span>
              </div>
              <span className={`font-semibold ${v.totale > 0 ? 'text-white' : 'text-slate-500'}`}>
                € {v.totale.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ultimi movimenti */}
      {ultimiCosti.length > 0 && (
        <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-300">Ultimi movimenti</p>
          {ultimiCosti.map(c => {
            const v = veicoli.find(v => v.id === c.veicoloId)
            return (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCatEmoji(c.categoria)}</span>
                  <div>
                    <p className="text-sm leading-tight">{v?.nome || '—'}</p>
                    <p className="text-xs text-slate-400">{c.nota || CATEGORIE.find(cat => cat.id === c.categoria)?.label}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">€ {Number(c.importo).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{c.data}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
