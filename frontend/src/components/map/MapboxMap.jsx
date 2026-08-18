import { useCallback, useEffect, useRef, useState } from 'react'

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

export default function MapboxMap({ center = [77.2090, 28.6139], onLocationChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [isLocating, setIsLocating] = useState(false)
  const [municipality, setMunicipality] = useState('Detecting...')

  const fetchMunicipality = useCallback(async (lng, lat) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'User-Agent': 'JalPramaan-Civic-App/1.0' }
      })
      if (!res.ok) throw new Error('Geocoding failed')
      const data = await res.json()
      const locationName = data.address?.municipality || data.address?.city || data.address?.suburb || 'Unknown Area'
      setMunicipality(locationName)
    } catch (err) {
      console.warn('Geocoding error:', err)
      setMunicipality('Unknown Area')
    }
  }, [])

  // 1. HARDWARE GPS LOCK (Re-center / Locate Me function)
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return
    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude
        const lat = pos.coords.latitude

        if (mapRef.current && markerRef.current) {
          // Cinematic 3.5-second zoom
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 16,
            pitch: 50,
            bearing: -10,
            duration: 3500,
            easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
          })
          markerRef.current.setLngLat([lng, lat])
          if (window._accuracyMarker) {
            window._accuracyMarker.setLngLat([lng, lat])
          }
        }

        if (onLocationChange) onLocationChange([lng, lat])
        fetchMunicipality(lng, lat)
        setIsLocating(false)
      },
      (err) => {
        console.warn('GPS Failed:', err)
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }, [fetchMunicipality, onLocationChange])

  // Refs for callbacks to prevent stale closures without causing re-renders
  const onLocationChangeRef = useRef(onLocationChange)
  useEffect(() => { onLocationChangeRef.current = onLocationChange }, [onLocationChange])

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    
    let initInterval

    const initMap = () => {
      if (!window.maplibregl) return false
      
      const ml = window.maplibregl

      const map = new ml.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: center,
        zoom: center[0] === 20.0 ? 2 : 12, // Globe zoom if default
        pitch: 45,
        antialias: true,
      })

      mapRef.current = map

      // 2. DRAGGABLE PIN & MANUAL SELECTION
      // Pulse accuracy circle
      const pulseEl = document.createElement('div')
      pulseEl.className = 'w-16 h-16 bg-primary/20 rounded-full animate-ping'
      pulseEl.style.pointerEvents = 'none'
      
      const accuracyMarker = new ml.Marker({ element: pulseEl })
        .setLngLat(center)
        .addTo(map)
      window._accuracyMarker = accuracyMarker // Hacky ref for locateUser

      const el = document.createElement('div')
      el.innerHTML = '<span class="material-symbols-outlined" style="font-size:36px; color:#ba1a1a; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">location_on</span>'
      el.style.cursor = 'grab'
      el.className = 'hover:scale-110 transition-transform'

      const marker = new ml.Marker({ draggable: true, element: el, anchor: 'bottom' })
        .setLngLat(center)
        .addTo(map)
        
      markerRef.current = marker

      // Update state when marker is dragged
      marker.on('dragstart', () => { el.style.cursor = 'grabbing' })
      marker.on('dragend', () => {
        el.style.cursor = 'grab'
        const lngLat = marker.getLngLat()
        accuracyMarker.setLngLat(lngLat)
        if (onLocationChangeRef.current) onLocationChangeRef.current([lngLat.lng, lngLat.lat])
        fetchMunicipality(lngLat.lng, lngLat.lat)
      })

      // Update state when map is clicked
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat)
        accuracyMarker.setLngLat(e.lngLat)
        if (onLocationChangeRef.current) onLocationChangeRef.current([e.lngLat.lng, e.lngLat.lat])
        fetchMunicipality(e.lngLat.lng, e.lngLat.lat)
      })

      map.on('load', () => {
        setTimeout(() => map.resize(), 250)
        
        // 3D building extrusions
        if (map.getSource('openmaptiles') && !map.getLayer('3d-buildings')) {
          map.addLayer({
            id: '3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 13,
            paint: {
              'fill-extrusion-color': '#e8f0fe',
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.7,
            },
          })
        }
        
        // Auto-locate on first load
        locateUser()
      })
      
      return true
    }

    if (!initMap()) {
      initInterval = setInterval(() => {
        if (initMap()) clearInterval(initInterval)
      }, 100)
    }

    return () => {
      if (initInterval) clearInterval(initInterval)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, []) // Empty dependency array prevents map from destroying itself!

  return (
    <div className="relative w-full h-[600px] rounded-bento overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* 3. RE-CENTER / LOCATE ME BUTTON */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={locateUser}
          disabled={isLocating}
          className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-white transition-all disabled:opacity-70 disabled:scale-95 group"
          title="Locate Me (Hardware GPS)"
        >
          <span className={`material-symbols-outlined text-[24px] ${isLocating ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
        </button>
      </div>

      {/* Status badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
        <div className="glass-card !rounded-xl px-3 py-2 text-xs font-semibold text-on-surface flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Draggable Pin Active
        </div>
        <div className="glass-card !rounded-xl px-3 py-2 text-xs font-bold text-primary flex items-center gap-2 shadow-lg bg-white/95">
          <span className="material-symbols-outlined text-[16px]">location_city</span>
          Routing to: {municipality}
        </div>
      </div>

      {/* Powered-by note */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-on-surface-variant font-medium">
          © OpenStreetMap · MapLibre GL
        </div>
      </div>
    </div>
  )
}
