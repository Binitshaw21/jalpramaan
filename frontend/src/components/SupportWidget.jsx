import { useState, useRef, useEffect } from 'react'

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { role: 'agent', text: 'Hello! How can I help you today?' }
  ])
  const endRef = useRef(null)

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat, isOpen])

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const newChat = [...chat, { role: 'user', text: message }]
    setChat(newChat)
    setMessage('')

    // Auto-reply
    setTimeout(() => {
      setChat([...newChat, { role: 'agent', text: 'Thanks for reaching out to JalPramaan Support. An agent will review your ticket shortly.' }])
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-surface-container-lowest border border-outline-variant/30 shadow-2xl rounded-2xl overflow-hidden flex flex-col origin-bottom-right transition-all duration-300 transform scale-100 opacity-100">
          <div className="bg-primary px-4 py-3 text-on-primary flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">support_agent</span>
              <span className="font-label-md font-bold text-sm">JalPramaan Support</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-black/10 p-1 rounded-full transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          
          <div className="flex-1 bg-surface-container h-80 overflow-y-auto p-4 flex flex-col gap-3">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 font-body-sm text-sm ${
                  msg.role === 'user' 
                    ? 'bg-secondary text-on-primary rounded-tr-sm' 
                    : 'bg-surface-container-lowest text-on-surface border border-outline-variant/20 shadow-sm rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSend} className="bg-surface-container-lowest p-3 border-t border-outline-variant/20 flex gap-2">
            <input 
              type="text" 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-surface-container px-3 py-2 rounded-full focus:outline-none focus:ring-1 focus:ring-primary text-sm font-body-sm"
            />
            <button type="submit" className="bg-primary text-on-primary w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-tertiary text-on-primary rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center relative"
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? 'close' : 'chat'}</span>
      </button>

    </div>
  )
}
