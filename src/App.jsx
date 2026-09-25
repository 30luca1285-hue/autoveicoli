import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, PlusCircle, BarChart2, Car, Settings } from 'lucide-react'
import { AppProvider, useApp } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import AddCosto from './pages/AddCosto'
import Riepilogo from './pages/Riepilogo'
import Veicoli from './pages/Veicoli'
import Impostazioni from './pages/Impostazioni'

function NavBar() {
  const tabs = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/aggiungi', icon: PlusCircle, label: 'Aggiungi' },
    { to: '/riepilogo', icon: BarChart2, label: 'Riepilogo' },
    { to: '/veicoli', icon: Car, label: 'Veicoli' },
    { to: '/impostazioni', icon: Settings, label: 'Config' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 safe-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ⚠️ 25/09/2026 (v0.8.0): le modifiche partono per il Mac in sottofondo (services/coda.js). Se il Mac non
// risponde (niente rete, Tailscale spento) lo si dice qui, invece di lasciar credere che sia tutto salvato:
// la modifica è al sicuro sul telefono e parte da sola appena il Mac torna raggiungibile.
function StatoInvio() {
  const { invio, riprovaInvio } = useApp()
  const primo = invio[0]
  if (!primo || primo.tentativi < 1) return null      // tutto partito, o sta partendo adesso
  const n = invio.length
  return (
    <button
      type="button"
      onClick={riprovaInvio}
      style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
      className="fixed left-3 right-3 z-40 rounded-xl bg-amber-900/95 border border-amber-700 px-3 py-2 text-left text-xs text-amber-100 shadow-lg"
    >
      <p className="font-semibold">
        ⏳ {n === 1 ? '1 modifica è salvata sul telefono' : `${n} modifiche sono salvate sul telefono`}, non ancora sul Mac
      </p>
      <p className="text-amber-200/80">
        {primo.errore || 'Il Mac non risponde'} · {n === 1 ? 'la invio' : 'le invio'} da solo appena torna (tocca per riprovare ora)
      </p>
    </button>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-900 pb-20">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/aggiungi" element={<AddCosto />} />
          <Route path="/riepilogo" element={<Riepilogo />} />
          <Route path="/veicoli" element={<Veicoli />} />
          <Route path="/impostazioni" element={<Impostazioni />} />
        </Routes>
        <StatoInvio />
        <NavBar />
      </div>
    </AppProvider>
  )
}
