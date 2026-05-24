import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#0a0a0a' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '52px', fontWeight: '800', color: '#f9a825', marginBottom: '8px', letterSpacing: '-1px' }}>Buskr</h1>
        <p style={{ color: '#555', fontSize: '16px' }}>The tip jar for the streets</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
        <button onClick={() => navigate('/setup')} style={{ background: 'linear-gradient(135deg, #f9a825, #ff6f00)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '700' }}>
          I'm a Performer 🎵
        </button>
        <button onClick={() => navigate('/map')} style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '500' }}>
          Find Performers Nearby
        </button>
      </div>
    </div>
  );
}