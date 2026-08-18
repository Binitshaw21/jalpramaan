import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import BentoCard from '../components/bento/BentoCard'
import GlobeComponent from '../components/globe/GlobeComponent'
import RouteLayer from '../components/map/RouteLayer'
import { toast } from 'react-hot-toast'

function KPICard({ icon, label, value, suffix = '', delta, color = 'primary' }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value)
    if (isNaN(target)) { setDisplayed(value); return }
    let start = 0
    const step = Math.max(1, Math.ceil(target / 40))
    const timer = setInterval(() => {
      start = Math.min(start + step, target)
      setDisplayed(start)
      if (start >= target) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [value])

  const colorMap = { primary: 'text-primary bg-primary/10', secondary: 'text-secondary bg-secondary/10', tertiary: 'text-tertiary bg-tertiary/10', error: 'text-error bg-error/10' }

  return (
    <BentoCard className="fade-in-up">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <span className="material-symbols-outlined text-[22px]" style={{fontVariationSettings:"'FILL' 1"}}>{icon}</span>
        </div>
        {delta && (
          <span className="text-xs font-bold text-tertiary bg-tertiary/10 px-2 py-1 rounded-lg flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>{delta}
          </span>
        )}
      </div>
      <p className="text-xs text-on-surface-variant font-semibold mb-1 uppercase tracking-wide">{label}</p>
      <p className="font-space font-black text-[28px] text-on-surface leading-none">
        {typeof displayed === 'number' ? displayed.toLocaleString() : displayed}{suffix}
      </p>
    </BentoCard>
  )
}

function HistoricalMap({ incidents, selectedCoords }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [mapLoaded, setMapLoaded] = useState(false)

  // 1. Initialize Map exactly ONCE
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    let initInterval

    const initMap = () => {
      if (!window.maplibregl) return false

      const map = new window.maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [77.2090, 28.6139],
        zoom: 10,
        pitch: 30,
        antialias: true
      })
      
      mapRef.current = map

      map.on('load', () => {
        setTimeout(() => map.resize(), 250)
        setMapLoaded(true)
      })
      return true
    }

    if (!initMap()) {
      initInterval = setInterval(() => { if (initMap()) clearInterval(initInterval) }, 100)
    }

    return () => {
      if (initInterval) clearInterval(initInterval)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Empty dependency array -> never destroys map on re-render!

  // 2. Reactively update markers when incidents change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    // Clear old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    incidents.forEach((inc) => {
      const isContaminated = inc.ai_report?.is_contaminated
      const color = isContaminated ? '#ba1a1a' : '#34a853'
      const marker = new window.maplibregl.Marker({ color, scale: 0.7 })
        .setLngLat([inc.lng, inc.lat])
        .setPopup(new window.maplibregl.Popup({ offset: 25 }).setHTML(`<b>${inc.status}</b><br/>${inc.ward_name || 'Unassigned'}`))
        .addTo(mapRef.current)
      
      markersRef.current.push(marker)
    })
  }, [incidents, mapLoaded])

  // 3. Reactively fly to selected coords
  useEffect(() => {
    if (mapRef.current && selectedCoords) {
      mapRef.current.flyTo({
        center: selectedCoords,
        zoom: 16,
        pitch: 60,
        bearing: -15,
        duration: 3500,
        easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
      })
    }
  }, [selectedCoords])

  return <div ref={containerRef} className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner z-0" />
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  
  const [activeView, setActiveView] = useState('active')
  const [incidents, setIncidents] = useState([])
  const [isFetching, setIsFetching] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [selectedMapCoords, setSelectedMapCoords] = useState(null)
  const [patchingId, setPatchingId] = useState(null)

  const [notesModal, setNotesModal] = useState({ isOpen: false, incident: null, newStatus: '', notes: '' })

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIncidents(data)
    } catch (err) {
      toast.error('Failed to load records')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [])

  const executePatch = async (incident, newStatus, notes = null) => {
    setPatchingId(incident.id)
    try {
      const body = { status: newStatus }
      if (notes) body.admin_notes = notes

      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error("Failed to update status")
      
      const updated = await res.json()
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i))
      toast.success(`Updated to ${newStatus}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPatchingId(null)
      setNotesModal({ isOpen: false, incident: null, newStatus: '', notes: '' })
    }
  }

  const handleUpdateStatusInline = (incident, newStatus) => {
    if (newStatus === 'Dispatch' || newStatus === 'Reject') {
      setNotesModal({ isOpen: true, incident, newStatus, notes: '' })
    } else {
      executePatch(incident, newStatus)
    }
  }

  const filteredIncidents = incidents.filter(i => {
    const matchSearch = i.id.includes(searchTerm) || (i.ward_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'All' || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeDispatch = incidents.find(i => i.status === 'Dispatch')
  const dispatchCoords = activeDispatch ? [activeDispatch.lng, activeDispatch.lat] : [77.2090, 28.6139]

  return (
    <div className="min-h-screen bg-slate-50 relative">

      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-outline-variant/20 px-6 py-3.5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-on-surface to-inverse-surface flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>water_drop</span>
            </div>
            <span className="font-space font-bold text-lg text-on-surface">JalPramaan</span>
            <span className="text-xs px-2 py-0.5 bg-on-surface/5 text-on-surface border border-on-surface/10 rounded-full font-semibold">Command Center</span>
          </div>
          
          <div className="hidden md:flex bg-surface-container-lowest p-1 rounded-full border border-outline-variant/30 shadow-inner">
            <button
              onClick={() => setActiveView('active')}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeView === 'active' ? 'bg-primary text-white shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              🚀 Active Dispatches
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors ${activeView === 'history' ? 'bg-slate-800 text-white shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              📜 Historical Records
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="clay-btn px-4 py-2 text-xs font-bold text-on-surface-variant border border-outline-variant/40 bg-white rounded-xl hover:text-on-surface">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto p-5 md:p-7 space-y-5">
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon="qr_code_scanner" label="Total Reports"   value={incidents.length} color="primary" />
          <KPICard icon="local_shipping"  label="Active Dispatch" value={incidents.filter(i=>i.status==='Dispatch').length} color="secondary" />
          <KPICard icon="check_circle"    label="Resolved"        value={incidents.filter(i=>i.status==='Complete').length} color="tertiary" />
          <KPICard icon="warning"         label="Critical Risk"   value={incidents.filter(i=>i.ai_report?.dispatch_priority === 'CRITICAL').length} color="error" />
        </div>

        {activeView === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-in-up">
            <BentoCard style={{ minHeight: 460 }}>
              <div className="mb-3">
                <h3 className="font-space font-bold text-base text-on-surface">Live Network</h3>
                <p className="text-xs text-on-surface-variant">Global intelligence overview</p>
              </div>
              <GlobeComponent extraPins={[]} />
            </BentoCard>

            <BentoCard className="!p-4 overflow-hidden" style={{ minHeight: 460 }}>
              <h3 className="font-space font-bold text-base text-on-surface mb-1 px-1">Live Zomato-Style Tracking</h3>
              <p className="text-xs text-on-surface-variant mb-3 px-1">Using requestAnimationFrame for 60fps tracking</p>
              <RouteLayer incidentCoords={dispatchCoords} theme="light" />
            </BentoCard>
          </div>
        )}

        {activeView === 'history' && (
          <div className="fade-in-up space-y-5">
            <BentoCard className="bg-slate-900 border-slate-700 text-white">
              <div className="mb-4">
                <h3 className="font-space font-bold text-lg">Geospatial Heat Map</h3>
                <p className="text-xs text-slate-400">Select a row below to fly to location</p>
              </div>
              <HistoricalMap incidents={incidents} selectedCoords={selectedMapCoords} />
            </BentoCard>

            <BentoCard>
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-space font-bold text-xl text-on-surface">Complaints Pipeline</h3>
                  <p className="text-sm text-on-surface-variant">Update statuses inline to trigger workflows</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                    <input 
                      type="text"
                      placeholder="Search ID or Ward..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary w-64"
                    />
                  </div>
                  <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary font-semibold text-on-surface"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Report Submitted">Report Submitted</option>
                    <option value="Verify">Verify</option>
                    <option value="Under Processing">Under Processing</option>
                    <option value="Dispatch">Dispatch</option>
                    <option value="Complete">Complete</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              </div>

              {isFetching ? (
                <div className="py-12 text-center text-primary font-bold"><span className="spin-ring w-6 h-6 mx-auto mb-2" /> Loading Database...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-container-low text-on-surface font-bold text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">ID</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Ward Location</th>
                        <th className="px-5 py-4">Risk</th>
                        <th className="px-5 py-4 text-right">Take Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10 bg-white">
                      {filteredIncidents.map(inc => {
                        const date = new Date(inc.created_at).toLocaleDateString()
                        const risk = inc.ai_report?.dispatch_priority || 'LOW'
                        const riskColor = risk === 'CRITICAL' ? 'text-error bg-error/10' : risk === 'HIGH' ? 'text-amber-600 bg-amber-50' : 'text-sage-600 bg-sage-50'
                        const isUpdating = patchingId === inc.id
                        
                        return (
                          <tr 
                            key={inc.id} 
                            onClick={() => setSelectedMapCoords([inc.lng, inc.lat])}
                            className="hover:bg-primary/5 transition-colors group cursor-pointer"
                          >
                            <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">
                              {inc.id.slice(0, 8)}
                              {inc.admin_notes && (
                                <div className="mt-1 text-[10px] text-primary truncate max-w-[120px]" title={inc.admin_notes}>📝 {inc.admin_notes}</div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-on-surface-variant font-medium">{date}</td>
                            <td className="px-5 py-4 font-bold text-on-surface group-hover:text-primary transition-colors">{inc.ward_name || 'Unassigned'}</td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${riskColor}`}>{risk}</span>
                            </td>
                            <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                              {isUpdating ? (
                                <span className="spin-ring w-4 h-4 text-primary inline-block mr-4" />
                              ) : (
                                <select
                                  value={inc.status}
                                  onChange={(e) => handleUpdateStatusInline(inc, e.target.value)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-outline-variant/40 bg-white text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
                                >
                                  <option value="Report Submitted">Approve Report</option>
                                  <option value="Verify">Verify</option>
                                  <option value="Under Processing">Mark Under Processing</option>
                                  <option value="Dispatch">Dispatch Unit</option>
                                  <option value="Complete">Mark Completed</option>
                                  <option value="Reject">Reject Report</option>
                                </select>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {filteredIncidents.length === 0 && (
                        <tr><td colSpan="5" className="py-8 text-center text-on-surface-variant">No records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </BentoCard>
          </div>
        )}
      </main>

      {/* ── NOTES MODAL ── */}
      {notesModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-outline-variant/20">
            <div className="p-5 border-b border-outline-variant/10 bg-surface-container-lowest">
              <h2 className="font-space font-black text-lg text-on-surface">
                {notesModal.newStatus === 'Dispatch' ? 'Dispatch Unit' : 'Reject Report'}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">Please provide Department Notes</p>
            </div>
            
            <div className="p-5">
              <label className="block text-xs font-bold text-on-surface-variant mb-2">
                {notesModal.newStatus === 'Dispatch' ? 'Assigned Vehicle Number / Dispatch Notes' : 'Rejection Reason'}
              </label>
              <textarea
                autoFocus
                value={notesModal.notes}
                onChange={e => setNotesModal({ ...notesModal, notes: e.target.value })}
                placeholder={notesModal.newStatus === 'Dispatch' ? 'e.g. Truck KL-07-2938' : 'e.g. Duplicate report...'}
                className="w-full p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
              />
              
              <div className="mt-5 flex gap-3">
                <button 
                  onClick={() => setNotesModal({ isOpen: false, incident: null, newStatus: '', notes: '' })}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executePatch(notesModal.incident, notesModal.newStatus, notesModal.notes)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold text-white transition-transform hover:scale-[1.02] shadow-sm ${notesModal.newStatus === 'Reject' ? 'bg-error' : 'bg-primary'}`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
