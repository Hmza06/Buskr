import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { API } from '../config';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'), iconUrl: require('leaflet/dist/images/marker-icon.png'), shadowUrl: require('leaflet/dist/images/marker-shadow.png') });

export default function MapPage() {
  const [sessions, setSessions] = useState([]);
  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => { setCenter([pos.coords.latitude, pos.coords.longitude]); setLoading(false); },
      () => { setCenter([45.5017, -73.5673]); setLoading(false); }
    );
    axios.get(`${API}/sessions/active`).then(r => setSessions(r.data));
    const interval = setInterval(() => axios.get(`${API}/sessions/active`).then(r => setSessions(r.data)), 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: '3px solid #222', borderTop: '3px solid #f9a825', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#555', fontSize: '14px' }}>Finding performers near you...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      <div style={{ padding: '16px 20px', background: '#0a0a0a', borderBottom: '1px solid #141414', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate('/')} style={{ background: '#141414', border: '1px solid #222', color: '#888', fontSize: '14px', padding: '8px 14px', borderRadius: '8px' }}>← Back</button>
        <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Live Performers</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', background: '#141414', padding: '6px 12px', borderRadius: '99px', border: '1px solid #222' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sessions.length > 0 ? '#4caf50' : '#555', boxShadow: sessions.length > 0 ? '0 0 6px #4caf50' : 'none' }} />
          <span style={{ fontSize: '12px', color: '#888' }}>{sessions.length} live</span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        {center && (
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            {sessions.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]}>
                <Popup>
                  <div style={{ minWidth: '160px', fontFamily: 'sans-serif' }}>
                    <strong>{s.name}</strong>
                    <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{s.genre}</p>
                    {s.song && <p style={{ fontSize: '12px', color: '#f9a825' }}>🎵 {s.song}</p>}
                    <button onClick={() => navigate(`/tip/${s.performer_id}`)} style={{ marginTop: '8px', width: '100%', background: '#f9a825', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Tip Now 💛</button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}