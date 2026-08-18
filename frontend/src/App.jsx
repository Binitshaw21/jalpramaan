import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import GatewayLogin from './pages/GatewayLogin'
import CitizenDashboard from './pages/CitizenDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/Dashboard' // legacy, preserved

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#131b2e',
            border: '1.5px solid rgba(0,104,95,0.15)',
            borderRadius: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00685f', secondary: '#f4fffc' } },
          error:   { iconTheme: { primary: '#ba1a1a', secondary: '#ffdad6' } },
        }}
      />
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<GatewayLogin />} />
        <Route path="/citizen"  element={<CitizenDashboard />} />
        <Route path="/admin"    element={<AdminDashboard />} />
        {/* Legacy dashboard preserved */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
