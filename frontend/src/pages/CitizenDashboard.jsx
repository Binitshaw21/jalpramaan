import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BentoCard from '../components/bento/BentoCard'
import TrackingTimeline from '../components/shared/TrackingTimeline'
import MapboxMap from '../components/map/MapboxMap'
import RouteLayer from '../components/map/RouteLayer'
import FieldReportForm from '../components/FieldReportForm'
import { toast } from 'react-hot-toast'

const advisories = [
  'Boil water before consumption in Dwarka Sector 7.',
  'No advisories for Connaught Place area.',
  'Avoid tap water in Noida Sector 18 until further notice.',
]

export default function CitizenDashboard() {
  const navigate = useNavigate()
  
  // ── Tabs: "live" | "reports" ──
  const [activeTab, setActiveTab] = useState('live')

  // ── Global State ──
  const [coords, setCoords] = useState([20.0, 0.0])
  
  // ── "Live Area" State ──
  const [trackStep, setTrackStep] = useState(0)
  const [safetyScore, setSafetyScore] = useState(72)
  const [currentReport, setCurrentReport] = useState(null)
  const [viewingReport, setViewingReport] = useState(null)
  
  // ── "My Reports" State ──
  const [myReports, setMyReports] = useState([])
  const [isFetchingReports, setIsFetchingReports] = useState(false)

  // MapboxMap now handles the GPS lock on mount and calls setCoords

  // 2. FETCH MY REPORTS FROM BACKEND
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchMyReports()
    }
  }, [activeTab])

  const fetchMyReports = async () => {
    setIsFetchingReports(true)
    try {
      const savedIds = JSON.parse(localStorage.getItem('jalpramaan_reports') || '[]')
      if (savedIds.length === 0) {
        setMyReports([])
        setIsFetchingReports(false)
        return
      }

      const res = await fetch('/api/my-complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: savedIds })
      })
      if (!res.ok) throw new Error('Failed to fetch reports')
      const data = await res.json()
      setMyReports(data)
    } catch (err) {
      console.error(err)
      toast.error('Could not load past reports.')
    } finally {
      setIsFetchingReports(false)
    }
  }

  // 3. SUBMIT NEW REPORT
  const handleReport = (data) => {
    const reportObj = data.report || data.ai_report
    const isContaminated = reportObj.is_contaminated
    
    // Save generated UUID to localStorage
    if (data.id) {
      const savedIds = JSON.parse(localStorage.getItem('jalpramaan_reports') || '[]')
      // Prepend the new ID
      if (!savedIds.includes(data.id)) {
        localStorage.setItem('jalpramaan_reports', JSON.stringify([data.id, ...savedIds]))
      }
    }

    setCurrentReport(reportObj)
    setSafetyScore(isContaminated ? Math.max(10, safetyScore - 15) : Math.min(99, safetyScore + 5))
    setTrackStep(0)
    setViewingReport(data)
    toast.success('Report submitted! Tracking activated.')
    
    // Optionally switch to the 'reports' tab to show their history
    // setActiveTab('reports')
  }

  const scoreColor = safetyScore >= 70 ? '#34a853' : safetyScore >= 40 ? '#ffc107' : '#ba1a1a'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>water_drop</span>
            </div>
            <span className="font-space font-bold text-lg text-on-surface">JalPramaan</span>
            <span className="text-xs px-2 py-0.5 bg-aqua-50 text-primary border border-primary/20 rounded-full font-semibold">Citizen Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-red-400">my_location</span>
              Live GPS Sync
            </div>
            <button
              onClick={() => navigate('/login')}
              className="clay-btn px-4 py-2 text-sm font-semibold text-on-surface-variant border border-outline-variant/40 bg-white rounded-xl hover:text-on-surface transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-5 md:p-7">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 fade-in-up">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</p>
            <h1 className="font-space font-bold text-3xl text-on-surface">Citizen Dashboard</h1>
          </div>
          
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
            <button 
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'live' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Live Area
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'reports' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              My Reports
            </button>
          </div>
        </div>

        {/* ── VIEW 1: LIVE AREA ── */}
        {activeTab === 'live' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-auto fade-in-up">
            
            {/* Hero: Map (spans 2 cols, 2 rows) */}
            <div className="col-span-1 md:col-span-2 row-span-2 glass-card shine-sweep overflow-hidden">
              <div className="p-5 pb-3">
                <h3 className="font-space font-bold text-base text-on-surface mb-0.5">Live Area Map</h3>
                <p className="text-xs text-on-surface-variant">Hardware GPS mapping with automated ward routing</p>
              </div>
              {viewingReport?.status?.toLowerCase().includes("dispatch") ? (
                <RouteLayer incidentCoords={coords} theme="light" />
              ) : (
                <MapboxMap center={coords} onLocationChange={setCoords} />
              )}
            </div>

            {/* Safety Score */}
            <BentoCard>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Area Safety Score</p>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f2f3ff" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={scoreColor}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(safetyScore / 100) * 201} 201`}
                      style={{ transition: 'stroke-dasharray 0.8s ease' }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-space font-black text-xl" style={{ color: scoreColor }}>{safetyScore}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg text-on-surface" style={{ color: scoreColor }}>
                    {safetyScore >= 70 ? 'Safe' : safetyScore >= 40 ? 'Moderate Risk' : 'High Risk'}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Based on recent reports</p>
                </div>
              </div>
            </BentoCard>

            {/* Advisory */}
            <BentoCard className="bg-gradient-to-br from-aqua-50 to-white">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[20px]" style={{fontVariationSettings:"'FILL' 1"}}>campaign</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Latest Advisory</p>
                  <p className="text-sm font-medium text-on-surface leading-relaxed">
                    {currentReport?.immediate_citizen_advisory || advisories[0]}
                  </p>
                </div>
              </div>
            </BentoCard>

            {/* Report Form */}
            <div className="col-span-1 md:col-span-2 glass-card shine-sweep p-5">
              <FieldReportForm onReportGenerated={handleReport} coords={coords} />
            </div>

            {/* Tracking Timeline */}
            <div className="col-span-1 md:col-span-2 glass-card shine-sweep p-5">
              <TrackingTimeline activeStep={trackStep} onAdvance={() => setTrackStep(s => Math.min(s + 1, 3))} />
            </div>
          </div>
        )}

        {/* ── VIEW 2: MY REPORTS ── */}
        {activeTab === 'reports' && (
          <div className="fade-in-up">
            {isFetchingReports ? (
              <div className="flex items-center justify-center p-12 text-primary font-semibold text-sm">
                <span className="spin-ring w-5 h-5 mr-3"></span> Loading your history...
              </div>
            ) : myReports.length === 0 ? (
              <BentoCard className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">folder_open</span>
                <h3 className="font-space font-bold text-lg text-on-surface">No Reports Found</h3>
                <p className="text-sm text-on-surface-variant max-w-sm mt-1">You have not submitted any water quality reports yet. When you do, you can track their live resolution status here.</p>
                <button onClick={() => setActiveTab('live')} className="mt-5 clay-btn px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm">
                  File a Report
                </button>
              </BentoCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myReports.map((report) => {
                  const date = new Date(report.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                  const ai = report.ai_report || {}
                  const isContaminated = ai.is_contaminated
                  
                  // Color code badges based on status string
                  let statusColor = "bg-surface-container-high text-on-surface-variant border-outline-variant/30"
                  if (report.status.toLowerCase().includes("dispatch")) statusColor = "bg-amber-50 text-amber-600 border-amber-200"
                  if (report.status.toLowerCase().includes("resolv")) statusColor = "bg-sage-50 text-sage-600 border-sage-200"
                  if (report.status.toLowerCase().includes("submit")) statusColor = "bg-blue-50 text-blue-600 border-blue-200"

                  return (
                    <BentoCard key={report.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isContaminated ? 'bg-error/10 text-error' : 'bg-sage-50 text-sage-500'}`}>
                            <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>
                              {isContaminated ? 'science' : 'water_drop'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusColor}`}>
                            {report.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-xs text-on-surface-variant font-medium mb-1">{date}</p>
                        <h4 className="font-space font-bold text-lg text-on-surface mb-2">
                          {report.ward_name || 'Unassigned Region'}
                        </h4>
                        
                        {/* Extracted Symptoms */}
                        <div className="space-y-1.5 mt-3">
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Reported Symptoms</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ai.extracted_audio_symptoms?.map((sym, i) => (
                              <span key={i} className="px-2 py-1 bg-surface-container-low border border-outline-variant/20 rounded-md text-[11px] text-on-surface">
                                {sym}
                              </span>
                            )) || <span className="text-xs text-on-surface-variant italic">None</span>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-3 border-t border-outline-variant/10 flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant font-mono">ID: {report.id.slice(0,8)}...</span>
                        <button 
                          onClick={() => {
                            setCoords([report.lng, report.lat])
                            setCurrentReport(ai)
                            setViewingReport(report)
                            setActiveTab('live')
                          }}
                          className="font-semibold text-primary hover:underline"
                        >
                          View Tracking
                        </button>
                      </div>
                    </BentoCard>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
