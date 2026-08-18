const STATUSES = [
  { key: 'submitted', label: 'Report Submitted',       icon: 'task_alt',          color: 'bg-primary',   desc: 'Your report has been received by the system.' },
  { key: 'viewed',    label: 'Viewed by Department',   icon: 'visibility',        color: 'bg-secondary', desc: 'A municipal officer has reviewed your report.' },
  { key: 'dispatched',label: 'Unit Dispatched',        icon: 'local_shipping',    color: 'bg-tertiary',  desc: 'A field unit is en route to your location.' },
  { key: 'resolved',  label: 'Issue Resolved',         icon: 'verified',          color: 'bg-sage-500',  desc: 'The issue has been successfully remediated.' },
]

export default function TrackingTimeline({ activeStep = 0, onAdvance }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-space font-bold text-lg text-on-surface">Live Status Tracker</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">Report #JP-{String(Date.now()).slice(-6)}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold border border-primary/20">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          Live Tracking
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 relative">
        {STATUSES.map((status, idx) => {
          const isPast   = idx < activeStep
          const isActive = idx === activeStep
          const isFuture = idx > activeStep

          return (
            <div key={status.key} className="flex gap-4 relative">
              {/* Connector line */}
              {idx < STATUSES.length - 1 && (
                <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-16px)]"
                  style={{
                    background: isPast
                      ? 'linear-gradient(to bottom, #00685f, #00685f)'
                      : 'linear-gradient(to bottom, #bcc9c6, #e2e8f0)'
                  }}
                />
              )}

              {/* Circle */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                  ${isPast   ? 'bg-primary shadow-glow-teal' : ''}
                  ${isActive ? 'bg-primary ring-4 ring-primary/20 shadow-glow-teal animate-pulse' : ''}
                  ${isFuture ? 'bg-surface-container-high border-2 border-outline-variant' : ''}
                `}>
                  <span className={`material-symbols-outlined text-[18px] transition-all
                    ${isPast || isActive ? 'text-white' : 'text-outline'}
                  `} style={isPast || isActive ? {fontVariationSettings:"'FILL' 1"} : {}}>
                    {isPast ? 'check' : status.icon}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className={`pb-8 flex-1 transition-all duration-300 ${isFuture ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-bold ${isActive ? 'text-primary' : isPast ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                    {status.label}
                  </p>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                      CURRENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{status.desc}</p>
                {isActive && (
                  <p className="text-[11px] text-primary/70 font-medium mt-1.5 animate-pulse">
                    ⏱ Updated just now
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Advance button for demo/testing */}
      {activeStep < STATUSES.length - 1 && (
        <button
          onClick={onAdvance}
          className="clay-btn mt-2 w-full py-2.5 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:from-primary/20 hover:to-secondary/20 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">skip_next</span>
          Advance Status (Demo)
        </button>
      )}
      {activeStep === STATUSES.length - 1 && (
        <div className="mt-2 w-full py-2.5 bg-sage-100 text-sage-500 border border-sage-200 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>verified</span>
          Issue Fully Resolved!
        </div>
      )}
    </div>
  )
}
