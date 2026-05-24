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
    <div style={{ height:'100vh', background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px' }}>
      <div style={{ width:'48px', height:'48px', border:'3px solid #141414', borderTop:'3px solid #f9a825', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#2a2a2a', fontSize:'13px', letterSpacing:'0.1em' }}>FINDING PERFORMERS</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#080808' }}>
      <div style={{ padding:'16px 20px', background:'#080808', borderBottom:'1px solid #0f0f0f', display:'flex', alignItems:'center', gap:'12px' }}>
        <button onClick={() => navigate('/')} style={{ background:'#0f0f0f', border:'1px solid #141414', color:'#555', fontSize:'14px', padding:'10px 16px', borderRadius:'10px' }}>←</button>
        <div>
          <h2 style={{ fontSize:'16px', fontWeight:'700', letterSpacing:'-0.3px' }}>Live Performers</h2>
          <p style={{ fontSize:'11px', color:'#2a2a2a', marginTop:'1px' }}>Montreal area</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'6px', background:'#0f0f0f', padding:'8px 14px', borderRadius:'99px', border:'1px solid #141414' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background: sessions.length > 0 ? '#4caf50' : '#222', boxShadow: sessions.length > 0 ? '0 0 8px #4caf50' : 'none' }} />
          <span style={{ fontSize:'12px', color: sessions.length > 0 ? '#4caf50' : '#333', fontWeight:'600' }}>{sessions.length} live</span>
        </div>
      </div>
      <div style={{ flex:1 }}>
        {center && (
          <MapContainer center={center} zoom={15} style={{ height:'100%', width:'100%' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
            {sessions.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]}>
                <Popup>
                  <div style={{ minWidth:'180px', fontFamily:'sans-serif', padding:'4px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                      {s.photo && <img src={s.photo} alt="" style={{ width:'40px', height:'40px', borderRadius:'50%', objectFit:'cover' }} />}
                      <div>
                        <strong style={{ fontSize:'15px', display:'block' }}>{s.name}</strong>
                        <span style={{ fontSize:'12px', color:'#888' }}>{s.genre}</span>
                      </div>
                    </div>
                    {s.song && <p style={{ fontSize:'12px', color:'#f9a825', marginBottom:'10px' }}>🎵 {s.song}</p>}
                    <button onClick={() => navigate(`/tip/${s.performer_id}`)} style={{ width:'100%', background:'linear-gradient(135deg,#f9a825,#ff6f00)', border:'none', padding:'10px', borderRadius:'8px', fontWeight:'700', cursor:'pointer', fontSize:'14px' }}>Tip Now</button>
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