import { useEffect, useMemo, useRef, useState } from 'react'

// Mock time-series data: each entry has a timestamp index and pins
const TIMELINE_DATA = [
  { time: 0, label: 'Day 1', pins: [
    { lat: 28.6139, lng: 77.2090, contaminated: true,  label: 'Dwarka Sector 7' },
    { lat: 28.6354, lng: 77.2273, contaminated: false, label: 'Connaught Place' },
  ]},
  { time: 1, label: 'Day 2', pins: [
    { lat: 28.6139, lng: 77.2090, contaminated: true,  label: 'Dwarka Sector 7' },
    { lat: 28.6354, lng: 77.2273, contaminated: false, label: 'Connaught Place' },
    { lat: 28.5672, lng: 77.3210, contaminated: true,  label: 'Noida Sector 18' },
  ]},
  { time: 2, label: 'Day 3', pins: [
    { lat: 28.6139, lng: 77.2090, contaminated: false, label: 'Dwarka Sector 7 (Resolved)' },
    { lat: 28.6354, lng: 77.2273, contaminated: false, label: 'Connaught Place' },
    { lat: 28.5672, lng: 77.3210, contaminated: true,  label: 'Noida Sector 18' },
    { lat: 28.7041, lng: 77.1025, contaminated: true,  label: 'Rohini West' },
  ]},
  { time: 3, label: 'Day 4', pins: [
    { lat: 28.6354, lng: 77.2273, contaminated: false, label: 'Connaught Place' },
    { lat: 28.5672, lng: 77.3210, contaminated: false, label: 'Noida Sector 18 (Resolved)' },
    { lat: 28.7041, lng: 77.1025, contaminated: true,  label: 'Rohini West' },
    { lat: 28.4595, lng: 77.0266, contaminated: true,  label: 'Gurugram Sector 56' },
  ]},
]

export default function GlobeComponent({ extraPins = [] }) {
  const mountRef = useRef(null)
  const globeRef = useRef(null)
  const [timeIdx, setTimeIdx] = useState(0)

  const currentData = TIMELINE_DATA[timeIdx]
  const allPins = useMemo(() => [...currentData.pins, ...extraPins], [currentData.pins, extraPins])

  useEffect(() => {
    if (!mountRef.current) return

    // Dynamically import react-globe.gl to avoid SSR issues
    import('react-globe.gl').then(({ default: Globe }) => {
      if (globeRef.current || !mountRef.current) return

      const { createRoot } = require('react-dom/client')

      const root = createRoot(mountRef.current)
      globeRef.current = root

      function renderGlobe(pins) {
        const points = pins.map(p => ({
          lat: p.lat,
          lng: p.lng,
          size: 0.5,
          color: p.contaminated ? '#ef4444' : '#3b82f6',
          label: p.label,
        }))

        root.render(
          <Globe
            width={mountRef.current?.offsetWidth || 500}
            height={mountRef.current?.offsetHeight || 400}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            atmosphereColor="rgba(100,180,255,0.3)"
            atmosphereAltitude={0.15}
            pointsData={points}
            pointAltitude={0.08}
            pointRadius="size"
            pointColor="color"
            pointLabel="label"
            pointsMerge={false}
            autoRotate
            autoRotateSpeed={0.4}
          />
        )
      }

      renderGlobe(allPins)
      return () => root.unmount()
    }).catch(() => {
      // react-globe.gl not installed – show placeholder
      if (mountRef.current) {
        mountRef.current.innerHTML = `
          <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:20px;color:white">
            <div style="font-size:64px">🌍</div>
            <p style="font-weight:700;font-size:18px;font-family:Space Grotesk,sans-serif">3D Globe Component</p>
            <p style="font-size:12px;opacity:0.6;text-align:center;max-width:280px">Run: <code style="background:rgba(255,255,255,0.1);padding:2px 8px;border-radius:6px">npm install react-globe.gl three</code><br/>then restart your dev server</p>
          </div>
        `
      }
    })
  }, [allPins])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-space font-bold text-lg text-on-surface">Incident Globe</h3>
          <p className="text-xs text-on-surface-variant">{currentData.label} — {allPins.length} incidents</p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 pin-red inline-block" /> Contaminated
          </span>
          <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 pin-blue inline-block" /> Safe
          </span>
        </div>
      </div>

      {/* Globe canvas */}
      <div ref={mountRef} className="flex-1 rounded-xl overflow-hidden min-h-[280px] bg-gradient-to-br from-slate-900 to-blue-950" />

      {/* 4D Timeline Slider */}
      <div className="glass-card !rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">timeline</span>
            4D Time Visualization
          </span>
          <span className="text-xs font-bold text-primary">{currentData.label}</span>
        </div>
        <input
          type="range"
          min={0}
          max={TIMELINE_DATA.length - 1}
          step={1}
          value={timeIdx}
          onChange={e => setTimeIdx(Number(e.target.value))}
          className="w-full h-2 appearance-none bg-surface-container-high rounded-full cursor-pointer"
          style={{
            accentColor: '#00685f',
          }}
        />
        <div className="flex justify-between mt-1.5">
          {TIMELINE_DATA.map((d, i) => (
            <span key={i} className={`text-[10px] font-medium ${i === timeIdx ? 'text-primary' : 'text-on-surface-variant/50'}`}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
