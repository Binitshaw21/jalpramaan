import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import FieldReportForm from '../components/FieldReportForm'
import SupportWidget from '../components/SupportWidget'
import MapComponent from '../components/MapComponent'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // KPI States
  const [totalScans, setTotalScans] = useState(1204)
  const [criticalAlerts, setCriticalAlerts] = useState(23)
  
  // Map and Report States
  const [markers, setMarkers] = useState([])
  const [currentReport, setCurrentReport] = useState(null)

  const handleReportGenerated = (data) => {
    setTotalScans(prev => prev + 1)
    if (data.report.is_contaminated) {
      setCriticalAlerts(prev => prev + 1)
    }
    setCurrentReport(data.report)
    setMarkers(prev => [...prev, { 
      lat: data.lat, 
      lng: data.lng, 
      color: data.report.is_contaminated ? 'red' : 'blue' 
    }])
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Stats Cards */}
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[22px]">group</span>
                  </div>
                  <span className="flex items-center text-tertiary text-xs font-bold bg-tertiary-container/20 px-2 py-1 rounded-md">
                    <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +12.5%
                  </span>
                </div>
                <h3 className="text-on-surface-variant font-body-sm mb-1 font-semibold">Total Citizens</h3>
                <div className="text-[28px] font-display-sm text-on-surface">24,592</div>
              </div>
              
              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-[22px]">corporate_fare</span>
                  </div>
                  <span className="flex items-center text-tertiary text-xs font-bold bg-tertiary-container/20 px-2 py-1 rounded-md">
                    <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> +2
                  </span>
                </div>
                <h3 className="text-on-surface-variant font-body-sm mb-1 font-semibold">Active Departments</h3>
                <div className="text-[28px] font-display-sm text-on-surface">148</div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary text-[22px]">verified</span>
                  </div>
                </div>
                <h3 className="text-on-surface-variant font-body-sm mb-1 font-semibold">Total Scans</h3>
                <div className="text-[28px] font-display-sm text-on-surface">{totalScans.toLocaleString()}</div>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-error-container/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-error text-[22px]">warning</span>
                  </div>
                </div>
                <h3 className="text-on-surface-variant font-body-sm mb-1 font-semibold">Critical Alerts</h3>
                <div className="text-[28px] font-display-sm text-on-surface">{criticalAlerts}</div>
              </div>
            </div>
            
            {/* Split layout: Form on left, Map on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <FieldReportForm onReportGenerated={handleReportGenerated} />
              </div>
              
              {/* Map Widget */}
              <div className="lg:col-span-2 relative">
                
                {currentReport && (
                  <div className="absolute top-4 right-4 z-[400] w-72 bg-surface-container-lowest/95 border border-outline-variant/50 backdrop-blur-md p-5 rounded-xl shadow-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-on-surface text-sm">AI Forensic Report</h3>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${currentReport.is_contaminated ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}>
                          {currentReport.dispatch_priority}
                        </span>
                    </div>
                    <div className="space-y-3 text-sm text-on-surface-variant">
                        <p className="flex justify-between"><span>pH Estimate:</span> <span className="font-mono text-tertiary font-bold">{currentReport.estimated_ph}</span></p>
                        <p className="flex justify-between"><span>Turbidity (1-5):</span> <span className="font-mono text-secondary font-bold">{currentReport.turbidity_visual_score}</span></p>
                        <div className="pt-3 border-t border-outline-variant/30">
                            <p className="text-xs text-on-surface uppercase mb-1 font-semibold">Extracted Symptoms</p>
                            <p className="text-on-surface-variant italic text-xs leading-relaxed">
                              {currentReport.extracted_audio_symptoms?.join(', ') || "None"}
                            </p>
                        </div>
                        <div className="pt-3 border-t border-outline-variant/30">
                            <p className="text-xs text-on-surface uppercase mb-1 font-semibold">Citizen Advisory</p>
                            <p className="text-primary text-xs leading-relaxed font-medium">
                              {currentReport.immediate_citizen_advisory}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setCurrentReport(null)} className="mt-4 w-full bg-surface-container-high hover:bg-surface-dim text-on-surface font-semibold text-xs py-2 rounded transition-colors">
                      Dismiss
                    </button>
                  </div>
                )}
                
                <MapComponent markers={markers} />
              </div>
            </div>
          </>
        )
      default:
        return (
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-outline-variant/40 rounded-xl">
            <p className="text-on-surface-variant font-medium">Viewing section: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
          </div>
        )
    }
  }

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex h-screen overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline-lg text-[28px] text-on-surface font-bold capitalize">{activeTab}</h1>
                <p className="font-body-sm text-on-surface-variant mt-1">Manage and monitor JalPramaan operations.</p>
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </main>

      <SupportWidget />
    </div>
  )
}
