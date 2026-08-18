import { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'

export default function FieldReportForm({ onReportGenerated, coords }) {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  
  // Toggle state
  const [inputType, setInputType] = useState('voice') // 'voice' | 'written'
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioURL, setAudioURL] = useState(null)
  
  // Written state
  const [writtenReport, setWrittenReport] = useState('')
  const MAX_CHARS = 500
  
  const [loading, setLoading] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
      toast.success("Image selected")
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioURL(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
        toast.success("Audio captured successfully")
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error(error)
      toast.error("Microphone access denied or unavailable")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleRunAnalysis = async () => {
    if (!image && !audioBlob && !writtenReport.trim()) {
      toast.error("Please provide an image, audio report, or written report")
      return
    }
    
    if (inputType === 'voice' && !audioBlob) {
      toast.error("Please record a voice note or switch to written report")
      return
    }
    
    if (inputType === 'written' && !writtenReport.trim()) {
      toast.error("Please enter your written report")
      return
    }

    setLoading(true)
    const formData = new FormData()
    if (image) formData.append('image', image)
    
    if (inputType === 'voice' && audioBlob) {
      formData.append('audio', audioBlob, 'report.webm')
    } else if (inputType === 'written' && writtenReport.trim()) {
      formData.append('written_report', writtenReport.trim())
    }
    
    // Use the dynamic coords passed from the Map (via CitizenDashboard)
    // coords format from MapboxMap is [lng, lat]
    formData.append('lat', coords[1].toString())
    formData.append('lng', coords[0].toString())

    try {
      const res = await fetch('/api/analyze-water', { method: 'POST', body: formData })

      if (!res.ok) throw new Error("Backend threw an error")
      
      const data = await res.json()
      
      toast.success("AI Analysis Complete! Forensic Report generated.")
      
      if (onReportGenerated) {
        onReportGenerated(data)
      }
      
      // Reset form
      setImage(null)
      setImagePreview(null)
      setAudioBlob(null)
      setAudioURL(null)
      setWrittenReport('')
    } catch (error) {
      toast.error("Failed to connect to analysis server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden p-6">
      <h2 className="font-headline-md text-[18px] text-on-surface font-bold mb-4">New Field Report</h2>
      
      <div className="space-y-6">
        
        {/* Coordinates Display */}
        <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="material-symbols-outlined text-primary text-[20px]">my_location</span>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Active Pin Location</p>
            <p className="text-xs font-mono text-on-surface-variant">
              Lat: {coords[1].toFixed(5)} · Lng: {coords[0].toFixed(5)}
            </p>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-label-md text-on-surface-variant font-semibold mb-2">Location Image</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer px-4 py-2 bg-surface-container border border-outline-variant/40 rounded-lg font-label-md text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-outline-variant/40 shadow-sm" />
            )}
          </div>
        </div>

        {/* Input Toggle & Dynamic Area */}
        <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20">
          
          {/* Toggle Switch */}
          <div className="flex bg-surface-container-lowest p-1 rounded-full w-full max-w-sm mb-6 border border-outline-variant/30 relative shadow-inner">
            <button
              onClick={() => setInputType('voice')}
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${inputType === 'voice' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              🎤 Voice Note
            </button>
            <button
              onClick={() => setInputType('written')}
              className={`relative z-10 flex-1 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${inputType === 'written' ? 'text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              ✍️ Written Report
            </button>
            <div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-full shadow-md transition-transform duration-300 ease-out z-0" 
              style={{ transform: inputType === 'written' ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }}
            />
          </div>

          {/* Dynamic Content */}
          <div className="relative overflow-hidden min-h-[140px]">
            {/* Voice UI */}
            <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${inputType === 'voice' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <label className="block font-label-md text-on-surface-variant font-semibold mb-2">Citizen Voice Note (Hold to Record)</label>
              <div className="flex items-center gap-4">
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-md ${isRecording ? 'bg-error text-on-error scale-110 animate-pulse' : 'bg-primary text-on-primary hover:bg-primary/90'}`}
                >
                  <span className="material-symbols-outlined text-[24px]">mic</span>
                  {isRecording && <span className="absolute -top-1 -right-1 w-3 h-3 bg-error border-2 border-white rounded-full animate-ping"></span>}
                </button>
                <div className="text-sm font-medium text-on-surface-variant">
                  {isRecording ? "Recording..." : audioURL ? "Audio captured ready for analysis." : "Press and hold to record report."}
                </div>
              </div>
              {audioURL && !isRecording && (
                <audio src={audioURL} controls className="mt-3 h-10 w-full max-w-sm rounded-md" />
              )}
            </div>

            {/* Written UI */}
            <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${inputType === 'written' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <label className="block font-label-md text-on-surface-variant font-semibold mb-2">Citizen Written Report</label>
              <div className="relative w-full max-w-xl">
                <textarea
                  value={writtenReport}
                  onChange={(e) => setWrittenReport(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Describe the water clarity, smell, taste, or any health symptoms in your neighborhood..."
                  className="w-full h-28 bg-slate-900/50 text-white placeholder:text-slate-400/70 border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner backdrop-blur-sm resize-none"
                ></textarea>
                <div className="absolute bottom-3 right-3 text-[10px] font-semibold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {writtenReport.length} / {MAX_CHARS} max
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-outline-variant/20 w-full my-4"></div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button 
            disabled={loading}
            onClick={handleRunAnalysis}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-tertiary text-on-primary font-label-md font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:transform-none"
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span> : <span className="material-symbols-outlined text-[20px]">psychology</span>}
            {loading ? "Analyzing..." : "Run AI Analysis"}
          </button>
        </div>

      </div>
    </div>
  )
}
