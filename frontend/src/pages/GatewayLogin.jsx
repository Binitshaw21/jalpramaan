import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import CyberCheckOverlay from '../components/shared/CyberCheckOverlay'

export default function GatewayLogin() {
  const [portal, setPortal] = useState('citizen') // 'citizen' | 'admin'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCyber, setShowCyber] = useState(false)
  const navigate = useNavigate()

  const handleSendOTP = (e) => {
    e.preventDefault()
    if (!phone) { toast.error('Enter a valid mobile number'); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); setOtpSent(true); toast.success('OTP sent! Use 123456') }, 1500)
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    if (otp === '123456') {
      toast.success('Welcome, Citizen!')
      navigate('/citizen')
    } else {
      toast.error('Invalid OTP — hint: 123456')
    }
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    if (!adminEmail || !adminPass) { toast.error('Fill in all fields'); return }
    setShowCyber(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative">

      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-aqua-100 rounded-full blur-[100px] opacity-50 animate-blob" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-mist-100 rounded-full blur-[100px] opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] bg-sage-100 rounded-full blur-[100px] opacity-40 animate-blob animation-delay-4000" />
      </div>

      <div className="relative min-h-screen flex lg:flex-row flex-col">

        {/* ── LEFT HERO PANEL ── */}
        <div className="lg:w-1/2 flex flex-col justify-between p-10 lg:p-16 fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-clay clay-btn">
              <span className="material-symbols-outlined text-white text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>water_drop</span>
            </div>
            <span className="font-space font-bold text-xl text-on-surface tracking-tight">JalPramaan</span>
          </div>

          {/* Hero Text */}
          <div className="my-auto py-16 max-w-lg">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4 fade-in-up delay-100">Municipal Intelligence Platform</p>
            <h1 className="font-hero text-on-surface leading-none mb-6 fade-in-up delay-200">
              Water.<br/>
              <span className="text-primary">Verified.</span><br/>
              Instantly.
            </h1>
            <p className="text-on-surface-variant text-lg font-medium leading-relaxed max-w-sm fade-in-up delay-300">
              AI-powered forensic water analysis with real-time civic dispatch, for a safer India.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10 fade-in-up delay-400">
              {[['24K+','Citizens Protected'],['148','Active Departments'],['99.9%','AI Accuracy']].map(([num, label]) => (
                <div key={label}>
                  <p className="font-space font-bold text-2xl text-on-surface">{num}</p>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-on-surface-variant/60 fade-in-up delay-500">
            © 2025 JalPramaan • Ministry of Jal Shakti initiative
          </p>
        </div>

        {/* ── RIGHT LOGIN PANEL ── */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 fade-in-up delay-200">
          <div className="glass-card shine-sweep w-full max-w-[440px] p-8 shadow-glass">

            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="font-space font-bold text-2xl text-on-surface mb-1">Secure Gateway</h2>
              <p className="text-on-surface-variant text-sm">Choose your access portal</p>
            </div>

            {/* Toggle */}
            <div className="relative flex bg-surface-container-high rounded-xl p-1 mb-8">
              {['citizen','admin'].map(p => (
                <button
                  key={p}
                  onClick={() => { setPortal(p); setOtpSent(false) }}
                  className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-300 capitalize ${portal === p ? 'text-on-surface' : 'text-on-surface-variant'}`}
                >
                  {p === 'citizen' ? '🏘️ Citizen' : '🏛️ Department'}
                </button>
              ))}
              <div
                className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-white rounded-lg shadow-md transition-transform duration-300 ease-out"
                style={{ transform: portal === 'admin' ? 'translateX(100%)' : 'translateX(0)' }}
              />
            </div>

            {/* ── Citizen Form ── */}
            <div className={`transition-all duration-300 ${portal === 'citizen' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute'}`}>
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline">phone_iphone</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="neo-input w-full pl-11 pr-4 py-3 rounded-xl text-on-surface text-sm font-medium"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="clay-btn w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm rounded-2xl mt-2 flex items-center justify-center gap-2 disabled:opacity-60">
                    {loading ? <span className="spin-ring w-4 h-4" /> : <span className="material-symbols-outlined text-[18px]">sms</span>}
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Enter OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      className="neo-input w-full px-4 py-3 rounded-xl text-on-surface text-center text-2xl font-bold tracking-[0.5em]"
                    />
                    <p className="text-xs text-on-surface-variant/60 mt-1.5 ml-1">Demo OTP: <strong>123456</strong></p>
                  </div>
                  <button type="submit" className="clay-btn w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Verify & Enter Portal
                  </button>
                  <button type="button" onClick={() => setOtpSent(false)} className="w-full text-on-surface-variant text-sm hover:text-on-surface transition-colors py-1">
                    ← Change number
                  </button>
                </form>
              )}
            </div>

            {/* ── Admin Form ── */}
            <div className={`transition-all duration-300 ${portal === 'admin' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none absolute'}`}>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Official Email</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline">mail</span>
                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                      placeholder="officer@jalpramaan.gov.in"
                      className="neo-input w-full pl-11 pr-4 py-3 rounded-xl text-on-surface text-sm font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-2 ml-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-outline">lock</span>
                    <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
                      placeholder="••••••••"
                      className="neo-input w-full pl-11 pr-4 py-3 rounded-xl text-on-surface text-sm font-medium" />
                  </div>
                </div>
                <div className="pt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5" style={{fontVariationSettings:"'FILL' 1"}}>shield</span>
                  Biometric & AI threat scan required before access is granted.
                </div>
                <button type="submit" className="clay-btn w-full py-3.5 bg-gradient-to-r from-on-surface to-inverse-surface text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  Initiate SecureAI Scan
                </button>
              </form>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-on-surface-variant/50 mt-8">
              Need help?{' '}
              <button onClick={() => toast.success('Support ticket created.')} className="text-primary font-semibold hover:underline">
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Cyber Check Overlay */}
      {showCyber && <CyberCheckOverlay onComplete={() => navigate('/admin')} />}
    </div>
  )
}
