import { useState, useEffect } from 'react'

const STEPS = [
  { id: 1, label: 'Firewall Status',           detail: 'Checking network perimeter...',       icon: 'firewall' },
  { id: 2, label: 'Identity Verification',     detail: 'Cross-referencing officer credentials...', icon: 'fingerprint' },
  { id: 3, label: 'Biometric Match',           detail: 'Facial + behavioral analysis active...', icon: 'face_retouching_natural' },
  { id: 4, label: 'Threat Intelligence Scan',  detail: 'Querying NCIIPC threat database...', icon: 'radar' },
  { id: 5, label: 'Clearance Granted',         detail: 'All checks passed. Establishing secure channel.', icon: 'verified_user' },
]

export default function CyberCheckOverlay({ onComplete }) {
  const [activeStep, setActiveStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (activeStep < STEPS.length) {
      const timer = setTimeout(() => {
        setActiveStep(s => s + 1)
      }, 700)
      return () => clearTimeout(timer)
    } else {
      // All steps passed — brief pause then call onComplete
      const timer = setTimeout(() => {
        setDone(true)
        setTimeout(onComplete, 600)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeStep, onComplete])

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${done ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(10,15,30,0.97)', backdropFilter: 'blur(12px)' }}>

      {/* Animated scan grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div key={i}
            className="absolute left-0 right-0 border-t border-cyber-green/5"
            style={{ top: `${i * 8.33}%` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-green/5 via-transparent to-cyber-green/5 animate-ping-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 border-cyber-green/40 bg-cyber-green/10 mb-4 relative">
            <span className="material-symbols-outlined text-cyber-green text-[32px]" style={{fontVariationSettings:"'FILL' 1"}}>security</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-green rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-green rounded-full" />
          </div>
          <h2 className="font-space font-bold text-2xl text-white mb-1">SecureAI Governance Check</h2>
          <p className="text-cyber-green/70 text-sm cyber-mono">RUNNING CYBERSECURITY PROTOCOL v4.2</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const state = idx < activeStep ? 'done' : idx === activeStep ? 'active' : 'pending'
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500
                  ${state === 'done'    ? 'border-cyber-green/30 bg-cyber-green/5' : ''}
                  ${state === 'active'  ? 'border-cyber-green/60 bg-cyber-green/10' : ''}
                  ${state === 'pending' ? 'border-white/5 bg-white/2 opacity-30' : ''}
                `}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center
                  ${state === 'done'   ? 'bg-cyber-green/20' : ''}
                  ${state === 'active' ? 'bg-cyber-green/15 ring-2 ring-cyber-green/50' : ''}
                  ${state === 'pending'? 'bg-white/5' : ''}
                `}>
                  {state === 'done' ? (
                    <span className="material-symbols-outlined text-cyber-green text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                  ) : state === 'active' ? (
                    <span className="spin-ring w-5 h-5 text-cyber-green" />
                  ) : (
                    <span className="material-symbols-outlined text-white/30 text-[20px]">{step.icon}</span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold cyber-mono ${state !== 'pending' ? 'text-white' : 'text-white/30'}`}>
                    {step.label}
                  </p>
                  {state !== 'pending' && (
                    <p className="text-xs text-cyber-green/60 cyber-mono mt-0.5 truncate">{step.detail}</p>
                  )}
                </div>

                {/* Status badge */}
                {state === 'done' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyber-green/20 text-cyber-green cyber-mono flex-shrink-0">
                    PASS
                  </span>
                )}
                {state === 'active' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-400 cyber-mono flex-shrink-0 animate-pulse">
                    SCAN
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs cyber-mono text-white/40 mb-2">
            <span>CLEARANCE LEVEL: OMEGA-7</span>
            <span>{Math.round((activeStep / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyber-green rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(activeStep / STEPS.length) * 100}%`,
                       boxShadow: '0 0 10px rgba(0,255,136,0.6)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
