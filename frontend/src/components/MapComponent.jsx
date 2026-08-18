import { useEffect, useRef } from 'react'

export default function MapComponent({ markers }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  
  useEffect(() => {
    if (!window.L) return;
    
    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current).setView([28.6139, 77.2090], 13);
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors © CARTO'
      }).addTo(mapInstanceRef.current);
    }
    
    // Add markers
    if (mapInstanceRef.current && markers.length > 0) {
      const map = mapInstanceRef.current;
      const latest = markers[markers.length - 1];
      
      const markerColor = latest.color === 'red' ? '#ef4444' : '#3b82f6';
      
      // Pulse circle
      window.L.circle([latest.lat, latest.lng], {
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.5,
          radius: 200
      }).addTo(map);
      
      // Center dot
      window.L.circleMarker([latest.lat, latest.lng], {
          color: '#ffffff', fillColor: markerColor, fillOpacity: 1, radius: 8, weight: 2
      }).addTo(map);
      
      // Pan to new marker
      map.setView([latest.lat, latest.lng], 15);
    }
    
    return () => {
        // cleanup if unmounted
    }
  }, [markers]);

  return <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-2xl shadow-xl border border-outline-variant/30 z-0"></div>
}
