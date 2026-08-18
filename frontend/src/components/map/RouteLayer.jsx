import { useEffect, useRef, useState, useCallback } from 'react'

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const DARK_STYLE  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

// Depot is mock fixed point
const DEPOT = [77.1890, 28.6220]

function buildOSRMUrl(from, to) {
  return `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`
}

function interpolateRoute(coords, progress) {
  if (!coords || coords.length < 2) return coords?.[0] ?? DEPOT
  if (progress <= 0) return coords[0]
  if (progress >= 1) return coords[coords.length - 1]

  let totalLen = 0
  const segments = []
  for (let i = 0; i < coords.length - 1; i++) {
    const dx = coords[i + 1][0] - coords[i][0]
    const dy = coords[i + 1][1] - coords[i][1]
    const len = Math.sqrt(dx * dx + dy * dy)
    segments.push(len)
    totalLen += len
  }

  const target = progress * totalLen
  let accumulated = 0
  for (let i = 0; i < segments.length; i++) {
    if (accumulated + segments[i] >= target) {
      const t = (target - accumulated) / segments[i]
      return [
        coords[i][0] + t * (coords[i + 1][0] - coords[i][0]),
        coords[i][1] + t * (coords[i + 1][1] - coords[i][1]),
      ]
    }
    accumulated += segments[i]
  }
  return coords[coords.length - 1]
}

export default function RouteLayer({ incidentCoords = [77.2090, 28.6139], theme = 'light' }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const markerRef    = useRef(null)
  const routeCoords  = useRef(null)
  const animationRef = useRef(null)

  const [progress,    setProgress]    = useState(0)
  const [etaSeconds,  setEtaSeconds]  = useState(null)
  const [distanceM,   setDistanceM]   = useState(null)
  const [routeLoaded, setRouteLoaded] = useState(false)

  const remainingEta = etaSeconds != null ? Math.max(0, Math.round((etaSeconds * (1 - progress)) / 60)) : null
  const remainingKm  = distanceM != null ? ((distanceM / 1000) * (1 - progress)).toFixed(2) : null

  const fetchRoute = useCallback(async (map) => {
    try {
      const res  = await fetch(buildOSRMUrl(DEPOT, incidentCoords))
      const json = await res.json()

      if (json.code !== 'Ok' || !json.routes?.[0]) throw new Error('OSRM returned no route')

      const route  = json.routes[0]
      const coords = route.geometry.coordinates
      routeCoords.current = coords
      setEtaSeconds(route.duration)
      setDistanceM(route.distance)
      setRouteLoaded(true)

      // Draw route
      if (map.getSource('route')) {
        map.getSource('route').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
        })
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
        })

        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#6bd8cb', 'line-width': 8, 'line-opacity': 0.3 },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#00685f', 'line-width': 4 },
        })
      }

      // Incident Marker
      new window.maplibregl.Marker({ color: '#ba1a1a' })
        .setLngLat(incidentCoords)
        .setPopup(new window.maplibregl.Popup({ offset: 25 }).setHTML('<b>⚠️ Incident Site</b>'))
        .addTo(map)

      // Animated Truck Marker
      const el = document.createElement('div')
      el.innerHTML = '<span class="material-symbols-outlined" style="font-size: 28px; color: #fff;">local_shipping</span>'
      el.style.cssText = `
        width: 44px; height: 44px; border-radius: 50%;
        background: #006398;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      `

      markerRef.current = new window.maplibregl.Marker({ element: el })
        .setLngLat(coords[0])
        .addTo(map)

      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 80, duration: 2000, pitch: 50, bearing: 10, maxZoom: 16 }
      )

    } catch (err) {
      console.warn('OSRM fetch failed:', err)
      routeCoords.current = [DEPOT, incidentCoords]
      setEtaSeconds(360)
      setDistanceM(1400)
      setRouteLoaded(true)
    }
  }, [incidentCoords])

  // Init Map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    let initInterval

    const initMap = () => {
      if (!window.maplibregl) return false
      
      const ml = window.maplibregl

      const map = new ml.Map({
        container: containerRef.current,
        style: theme === 'dark' ? DARK_STYLE : LIGHT_STYLE,
        center: DEPOT,
        zoom: 12,
        pitch: 45,
        antialias: true,
      })
      
      mapRef.current = map
      map.on('load', () => {
        setTimeout(() => map.resize(), 250)
        fetchRoute(map)
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
  }, []) // Empty dependency array prevents map destruction loops!

  // Reactively fetch new route if incidentCoords changes after mount
  useEffect(() => {
    if (mapRef.current && routeLoaded) {
      fetchRoute(mapRef.current)
    }
  }, [incidentCoords, fetchRoute, routeLoaded])

  // requestAnimationFrame loop for ultra-smooth movement
  useEffect(() => {
    if (!routeLoaded) return

    const DURATION_MS = 20000 // 20 seconds to complete route (mock simulation)
    let startTime = null

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const nextProgress = Math.min(elapsed / DURATION_MS, 1)
      
      setProgress(nextProgress)
      
      if (routeCoords.current && markerRef.current) {
        markerRef.current.setLngLat(interpolateRoute(routeCoords.current, nextProgress))
        
        // Optionally pan camera slightly to follow
        if (mapRef.current && nextProgress > 0 && nextProgress < 1) {
          // mapRef.current.panTo(interpolateRoute(routeCoords.current, nextProgress), { duration: 0 })
        }
      }

      if (nextProgress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [routeLoaded])

  const arrived = progress >= 1

  return (
    <div className="relative w-full h-[600px] rounded-bento overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* ETA Overlay */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className={`glass-card !rounded-2xl p-4 w-56 pointer-events-auto ${theme === 'dark' ? 'bg-slate-900/80 text-white' : 'bg-white/90 text-slate-900'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">local_shipping</span>
            </div>
            <div>
              <p className="text-xs font-bold">Municipal Unit #7</p>
              <p className="text-[10px] opacity-70">En Route</p>
            </div>
          </div>

          {!routeLoaded ? (
            <div className="flex items-center gap-2 text-xs py-2">
              <span className="spin-ring w-4 h-4 text-primary" />
              Calculating route…
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs opacity-70">ETA</span>
                <span className={`text-base font-black ${arrived ? 'text-sage-500' : 'text-primary'}`}>
                  {arrived ? 'Arrived!' : remainingEta != null ? `~${remainingEta} min` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs opacity-70">Remaining</span>
                <span className="text-sm font-bold">{remainingKm ?? '—'} km</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{ width: `${progress * 100}%`, background: '#00685f' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
