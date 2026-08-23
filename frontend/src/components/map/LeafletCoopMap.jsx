import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom society marker icon
const societyIcon = new L.DivIcon({
  className: 'custom-society-pin',
  html: `<div style="background-color: #0f2e5a; color: #fbbf24; border: 2px solid white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏛️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

// Custom worker cluster icon (Anonymized zone)
const workerIcon = new L.DivIcon({
  className: 'custom-worker-pin',
  html: `<div style="background-color: #166534; color: white; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">👷</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Customer pin
const customerIcon = new L.DivIcon({
  className: 'custom-customer-pin',
  html: `<div style="background-color: #2563eb; color: white; border: 2px solid white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">📍</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

// Live tracked worker icon (pulsing)
const liveWorkerIcon = new L.DivIcon({
  className: 'custom-live-worker-pin',
  html: `<div style="background-color: #dc2626; color: white; border: 3px solid white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 12px rgba(220,38,38,0.6); animation: pulse 1.5s infinite;">👷</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export function LeafletCoopMap({
  center = [28.6139, 77.2090],
  zoom = 12,
  societies = [],
  workers = [],
  customerLocation = null,
  liveWorkerLocation = null,
  demandClusters = [],
  height = '400px'
}) {
  const defaultSocieties = societies.length > 0 ? societies : [
    {
      id: 'SOC-DEMO-001',
      name: 'Central Metro Labour Cooperative Society',
      lat: 28.6139,
      lng: 77.2090,
      radiusKm: 5,
      activeWorkers: 8,
      district: 'Central Metro'
    },
    {
      id: 'SOC-DEMO-002',
      name: 'Eastern Suburban Labour Cooperative Society',
      lat: 28.6280,
      lng: 77.2950,
      radiusKm: 6,
      activeWorkers: 4,
      district: 'East District'
    }
  ];

  return (
    <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Cooperative Society Centers and Coverage Radii */}
        {defaultSocieties.map((soc) => (
          <React.Fragment key={soc.id}>
            <Marker position={[soc.lat || 28.6139, soc.lng || 77.2090]} icon={societyIcon}>
              <Popup>
                <div className="text-xs space-y-1 p-1">
                  <div className="font-bold text-slate-900">{soc.name}</div>
                  <div className="text-[10px] text-slate-500">ID: {soc.id} • District: {soc.district}</div>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    Registered Workers: {soc.activeWorkers || 8}
                  </div>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[soc.lat || 28.6139, soc.lng || 77.2090]}
              radius={(soc.radiusKm || 4) * 1000}
              pathOptions={{ color: '#0f2e5a', fillColor: '#0f2e5a', fillOpacity: 0.08, weight: 1.5, dashArray: '4, 4' }}
            />
          </React.Fragment>
        ))}

        {/* High Demand Clusters (Heat visualization) */}
        {demandClusters.map((d) => (
          <Circle
            key={d.id}
            center={d.center}
            radius={3000}
            pathOptions={{
              color: d.demandLevel === 'High' ? '#dc2626' : '#2563eb',
              fillColor: d.demandLevel === 'High' ? '#ef4444' : '#3b82f6',
              fillOpacity: 0.18,
              weight: 2
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 p-1">
                <div className="font-bold text-red-700">{d.district} — {d.demandLevel} Demand</div>
                <div className="text-[11px] text-slate-700">Top Service: {d.topService}</div>
                <div className="text-[10px] text-slate-500">
                  Expected: {d.expectedJobs} jobs • Shortage: {d.shortage} workers
                </div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Anonymized Worker Zones */}
        {workers.map((w) => {
          if (!w.location) return null;
          return (
            <Marker key={w.id} position={[w.location.lat, w.location.lng]} icon={workerIcon}>
              <Popup>
                <div className="text-xs space-y-1 p-1">
                  <div className="font-bold text-slate-900">{w.name}</div>
                  <div className="text-[11px] text-slate-600">
                    Trade: {w.primarySkill} • Exp: {w.experienceYears} yrs
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">
                    {w.isOnline ? '● Online & On-Duty' : '○ Offline'}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Customer Location */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
            <Popup>
              <div className="text-xs p-1">
                <div className="font-bold text-blue-900">Your Service Location</div>
                <div className="text-[11px] text-slate-600">{customerLocation.area || 'Connaught Place'}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Worker Location (real-time GPS tracking) */}
        {liveWorkerLocation && (
          <Marker position={[liveWorkerLocation.lat, liveWorkerLocation.lng]} icon={liveWorkerIcon}>
            <Popup>
              <div className="text-xs p-1">
                <div className="font-bold text-red-700">Worker LIVE Location</div>
                <div className="text-[11px] text-slate-600">
                  Lat: {liveWorkerLocation.lat?.toFixed(4)} | Lng: {liveWorkerLocation.lng?.toFixed(4)}
                </div>
                <div className="text-[10px] text-green-700 font-bold">Tracking active</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-200 text-[10px] space-y-1 z-[1000]">
        <div className="font-bold text-slate-700 uppercase tracking-wider">Map Legend</div>
        <div className="flex items-center gap-1.5"><span className="text-sm">🏛️</span> Cooperative Society Center</div>
        <div className="flex items-center gap-1.5"><span className="text-sm">👷</span> Verified Worker Zone</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> High Demand Surge Area</div>
        {liveWorkerLocation && (
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block animate-pulse"></span> Worker Live GPS</div>
        )}
      </div>
      <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(220,38,38,0.5); } 70% { box-shadow: 0 0 0 12px rgba(220,38,38,0); } 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); } }`}</style>
    </div>
  );
}
