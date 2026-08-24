import { Routes, Route } from 'react-router-dom'
import { AppProvider, useApp } from './lib/store.jsx'
import Masthead from './components/Masthead.jsx'
import ToastHost from './components/ToastHost.jsx'
import SkyBackground from './components/SkyBackground.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import Cases from './pages/Cases.jsx'
import CaseView from './pages/CaseView.jsx'
import MapPage from './pages/MapPage.jsx'
import LEADashboard from './pages/LEADashboard.jsx'
import ModelConfig from './pages/ModelConfig.jsx'
import Evidence from './pages/Evidence.jsx'
import Alerts from './pages/Alerts.jsx'

function Footer() {
  return (
    <footer className="foot">
      <div className="container">
        <small>
          <b style={{ color: 'var(--ink)', fontFamily: 'var(--serif)' }}>Praharī</b> · Predictive Cybercrime Withdrawal Intelligence · SIH 2026 · PS 26184
        </small>
        <small>Ministry of Home Affairs · Indian Cybercrime Coordination Centre (I4C) · CIS Division · Prototype · synthetic data only</small>
      </div>
    </footer>
  )
}

function Shell() {
  const { role } = useApp()
  if (!role) return <Login />
  return (
    <>
      <div className="app">
        <Masthead />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/cases/:id" element={<CaseView />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/lea" element={<LEADashboard />} />
            <Route path="/engine" element={<ModelConfig />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <ToastHost />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <SkyBackground />
      <Shell />
    </AppProvider>
  )
}
