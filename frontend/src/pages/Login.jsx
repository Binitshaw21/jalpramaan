import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

export default function Login() {
  const [tab, setTab] = useState('citizen')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGetOTP = (e) => {
    e.preventDefault()
    if (!phone) {
      toast.error("Please enter a valid mobile number.")
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
      toast.success("OTP sent to your mobile device")
    }, 1500)
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    if (otp === "123456") {
      toast.success("Login successful!")
      navigate('/dashboard')
    } else {
      toast.error("Invalid OTP. Please try 123456.")
    }
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success("Admin login successful!")
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-hidden">
      <div className="relative min-h-screen flex items-center justify-center px-5 md:px-10">
        
        {/* Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute top-[20%] right-[15%] w-80 h-80 bg-secondary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[10%] left-[30%] w-[30rem] h-[30rem] bg-tertiary-fixed-dim rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Card */}
        <div className="relative w-full max-w-[440px] z-10 fade-in-up">
          <div className="bg-white/70 backdrop-blur-[12px] border border-white/40 shadow-[0_20px_40px_-10px_rgba(15,23,42,0.15)] rounded-2xl p-8">
            
            <div className="text-center mb-8 fade-in-up delay-100">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-surface-container shadow-sm mb-4">
                <span className="material-symbols-outlined text-[32px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>water_drop</span>
              </div>
              <h1 className="font-display-sm text-[36px] text-on-surface font-bold">JalPramaan</h1>
              <p className="font-body-sm text-on-surface-variant mt-1">Secure Identity Gateway</p>
            </div>

            <div className="flex p-1 bg-surface-container-high rounded-lg mb-8 fade-in-up delay-200 relative">
              <button 
                className={`relative z-10 flex-1 py-2 px-4 rounded-md font-label-md font-semibold transition-colors duration-300 ${tab === 'citizen' ? 'text-on-surface' : 'text-on-surface-variant'}`}
                onClick={() => setTab('citizen')}
              >
                Citizen
              </button>
              <button 
                className={`relative z-10 flex-1 py-2 px-4 rounded-md font-label-md font-semibold transition-colors duration-300 ${tab === 'admin' ? 'text-on-surface' : 'text-on-surface-variant'}`}
                onClick={() => setTab('admin')}
              >
                Admin
              </button>
              <div 
                className="absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-md shadow-sm transition-transform duration-300 ease-out z-0" 
                style={{ transform: tab === 'admin' ? 'translateX(100%)' : 'translateX(0)' }}
              ></div>
            </div>

            <div className="relative min-h-[220px]">
              
              {/* Citizen Tab */}
              <div className={`absolute inset-0 transition-all duration-300 flex flex-col justify-between fade-in-up delay-300 ${tab === 'citizen' ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none -translate-x-4'}`}>
                {!otpSent ? (
                  <form onSubmit={handleGetOTP} className="flex flex-col justify-between h-full">
                    <div className="space-y-5">
                      <div>
                        <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1 font-semibold">Mobile Number</label>
                        <div className="relative input-halo rounded-lg transition-shadow duration-200">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">phone_iphone</span>
                          <input 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/60 rounded-lg focus:outline-none focus:border-primary font-body-md text-on-surface transition-colors" 
                            placeholder="+91 XXXXX XXXXX" type="tel" 
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-label-md font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100">
                        {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : null}
                        {loading ? 'Sending...' : 'Get OTP'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="flex flex-col justify-between h-full">
                    <div className="space-y-5">
                      <div>
                        <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1 font-semibold">Enter OTP (Hint: 123456)</label>
                        <div className="relative input-halo rounded-lg transition-shadow duration-200">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">password</span>
                          <input 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/60 rounded-lg focus:outline-none focus:border-primary font-body-md text-on-surface transition-colors tracking-[0.2em]" 
                            placeholder="------" type="text" maxLength={6}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-label-md font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        Verify OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Admin Tab */}
              <div className={`absolute inset-0 transition-all duration-300 flex flex-col justify-between ${tab === 'admin' ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none translate-x-4'}`}>
                <form onSubmit={handleAdminLogin} className="flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1 font-semibold">Official Email</label>
                      <div className="relative input-halo rounded-lg transition-shadow duration-200">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">mail</span>
                        <input className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg focus:outline-none focus:border-primary font-body-sm text-on-surface transition-colors" placeholder="officer@jalpramaan.gov.in" type="email"/>
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-md text-on-surface-variant mb-1.5 ml-1 font-semibold">Password</label>
                      <div className="relative input-halo rounded-lg transition-shadow duration-200">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">lock</span>
                        <input className="w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-lg focus:outline-none focus:border-primary font-body-sm text-on-surface transition-colors" placeholder="••••••••" type="password"/>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input className="w-4 h-4 text-primary border-outline-variant/60 rounded focus:ring-primary/20 transition-all" type="checkbox"/>
                        <span className="font-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
                      </label>
                      <button type="button" onClick={() => toast("Password reset link sent")} className="font-body-sm text-primary hover:text-primary-fixed-dim transition-colors">Forgot password?</button>
                    </div>
                    <button disabled={loading} type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-label-md font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100">
                      {loading ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> : <span className="material-symbols-outlined text-[18px]">login</span>}
                      {loading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                  </div>
                </form>
              </div>

            </div>
            
            <div className="mt-8 text-center fade-in-up delay-300">
              <p className="font-body-sm text-on-surface-variant">
                Need help? <button onClick={() => toast.success("Support ticket created.")} className="text-primary font-semibold hover:underline">Contact Support</button>
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}
