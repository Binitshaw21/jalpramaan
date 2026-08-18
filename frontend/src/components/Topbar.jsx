import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Topbar({ toggleSidebar }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-md hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search citizens, depts..." 
            className="w-64 pl-10 pr-4 py-2 bg-surface-container border-none rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 font-body-sm text-on-surface placeholder:text-on-surface-variant transition-all focus:w-80" 
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            className="relative p-2 text-on-surface-variant hover:text-on-surface rounded-full hover:bg-surface-container transition-colors focus:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest"></span>
          </button>
          
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-surface-container-lowest border border-outline-variant/20 shadow-lg rounded-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
                <span className="font-label-md font-semibold text-on-surface">Notifications</span>
                <span className="text-xs font-semibold bg-primary text-on-primary px-2 py-0.5 rounded-full">3 New</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="block px-4 py-3 hover:bg-surface transition-colors border-b border-outline-variant/10 cursor-pointer">
                  <p className="text-sm font-medium text-on-surface mb-1">New Department Registered</p>
                  <p className="text-xs text-on-surface-variant">Rural Water Supply has been successfully registered.</p>
                  <p className="text-[10px] text-outline mt-1 font-semibold">2 MINS AGO</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-outline-variant/40"></div>
        
        {/* Profile */}
        <div className="relative">
          <div 
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
            className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low p-1.5 rounded-lg transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="font-label-md text-on-surface font-semibold">Admin User</div>
              <div className="text-xs text-on-surface-variant font-medium">Dept of Water Res.</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant hidden sm:block">expand_more</span>
          </div>
          
          {profileOpen && (
            <div className="absolute right-0 top-14 w-56 bg-surface-container-lowest border border-outline-variant/20 shadow-lg rounded-2xl overflow-hidden z-50 py-2">
              <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface transition-colors font-medium cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">account_circle</span> My Profile
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface transition-colors font-medium cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">settings</span> Settings
              </div>
              <div className="h-px bg-outline-variant/20 my-1"></div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error-container/20 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
