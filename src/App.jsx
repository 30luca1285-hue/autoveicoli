import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { Home, PlusCircle, BarChart2, Car, Settings } from 'lucide-react'
import { AppProvider } from './context/AppContext'
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
        <NavBar />
      </div>
    </AppProvider>
  )
}
