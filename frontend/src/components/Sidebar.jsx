import { useNavigate } from 'react-router-dom'

export default function Sidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) {
  const navigate = useNavigate()

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', section: 'main' },
    { id: 'citizens', label: 'Citizens', icon: 'group', section: 'main' },
    { id: 'departments', label: 'Departments', icon: 'corporate_fare', section: 'main' },
    { id: 'verifications', label: 'Verifications', icon: 'verified_user', section: 'main' },
    { id: 'reports', label: 'Reports', icon: 'assessment', section: 'system' },
    { id: 'settings', label: 'Settings', icon: 'settings', section: 'system' }
  ]

  const handleTabClick = (id) => {
    setActiveTab(id)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col fixed md:relative h-full transition-transform duration-300 z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex items-center">
            <span className="material-symbols-outlined text-[28px] text-primary mr-2" style={{fontVariationSettings: "'FILL' 1"}}>water_drop</span>
            <span className="font-display-sm text-[20px] font-bold text-on-surface">JalPramaan</span>
          </div>
          <button 
            className="md:hidden text-on-surface-variant hover:bg-surface-container p-1 rounded-md transition-colors" 
            onClick={() => setSidebarOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 bg-surface-container-lowest">
          <div className="px-4 mb-2 text-xs font-label-md text-on-surface-variant uppercase tracking-wider font-semibold">Main</div>
          <nav className="space-y-1">
            {tabs.filter(t => t.section === 'main').map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center px-6 py-3 font-body-sm group ${
                  activeTab === tab.id 
                    ? 'sidebar-item-active font-semibold' 
                    : 'text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 text-[20px] ${activeTab === tab.id ? 'text-primary' : 'text-outline group-hover:text-primary transition-colors'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
          
          <div className="px-4 mt-8 mb-2 text-xs font-label-md text-on-surface-variant uppercase tracking-wider font-semibold">System</div>
          <nav className="space-y-1">
            {tabs.filter(t => t.section === 'system').map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center px-6 py-3 font-body-sm group ${
                  activeTab === tab.id 
                    ? 'sidebar-item-active font-semibold' 
                    : 'text-on-surface-variant font-medium hover:bg-surface-container-low transition-colors'
                }`}
              >
                <span className={`material-symbols-outlined mr-3 text-[20px] ${activeTab === tab.id ? 'text-primary' : 'text-outline group-hover:text-primary transition-colors'}`}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest">
          <button 
            onClick={() => navigate('/login')}
            className="w-full flex items-center px-4 py-2 text-error hover:bg-error-container/50 rounded-lg transition-colors font-body-sm font-semibold"
          >
            <span className="material-symbols-outlined mr-2 text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
