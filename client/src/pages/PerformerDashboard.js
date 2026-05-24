import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import QRCode from './QRCode';
import { API, SOCKET } from '../config';

export default function PerformerDashboard() {
  const { performerId } = useParams();
  const navigate = useNavigate();
  const [performer, setPerformer] = useState(null);
  const [session, setSession] = useState(null);
  const [tips, setTips] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [newTip, setNewTip] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const socketRef = useRef();

  useEffect(() => {
    axios.get(`${API}/performers/${performerId}`).then(r => setPerformer(r.data));
    axios.get(`${API}/performers/${performerId}/session`).then(r => {
      if (r.data) { setSession(r.data); axios.get(`${API}/sessions/${r.data.id}/tips`).then(t => setTips(t.data)); }
    });
  }, [performerId]);

  useEffect(() => {
    if (!session) return;
    const start = new Date(session.started_at).getTime();
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [session?.id]);

  useEffect(() => {
    if (!session) return;
    socketRef.current = io(SOCKET);
    socketRef.current.emit('join_session', session.id);
    socketRef.current.on('new_tip', tip => {
      setTips(prev => [tip, ...prev]);
      setSession(prev => ({ ...prev, total_tips: (prev.total_tips || 0) + tip.amount, tip_count: (prev.tip_count || 0) + 1 }));
      setNewTip(tip);
      setTimeout(() => setNewTip(null), 3000);
    });
    return () => socketRef.current?.disconnect();
  }, [session?.id]);

  const endSession = async () => {
    if (!window.confirm('End this session?')) return;
    await axios.post(`${API}/sessions/${session.id}/end`);
    setSession(null); setTips([]);
  };

  const formatTime = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const avgTip = session?.tip_count > 0 ? (session.total_tips / session.tip_count).toFixed(2) : '0.00';
  const tipUrl = `${window.location.origin}/tip/${performerId}`;

  if (!performer) return <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '36px', height: '36px', border: '3px solid #222', borderTop: '3px solid #f9a825', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '0 20px 60px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ paddingTop: '36px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          {performer.photo ? <img src={performer.photo} alt="" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: session ? '2px solid #4caf50' : '2px solid #333' }} /> : <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#181818', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎵</div>}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '2px' }}>{performer.name}</h2>
            <p style={{ color: '#555', fontSize: '13px' }}>{performer.genre}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#111', border: `1px solid ${session ? '#1a2e1a' : '#222'}`, padding: '6px 12px', borderRadius: '99px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: session ? '#4caf50' : '#444', boxShadow: session ? '0 0 8px #4caf50' : 'none' }} />
            <span style={{ fontSize: '12px', color: session ? '#4caf50' : '#444' }}>{session ? 'Live' : 'Offline'}</span>
          </div>
        </div>

        {newTip && (
          <div style={{ background: '#1a1400', border: '1px solid #f9a825', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '2px' }}>New tip from {newTip.name}! 🎉</p>
              {newTip.message && <p style={{ color: '#888', fontSize: '13px' }}>"{newTip.message}"</p>}
            </div>
            <span style={{ fontSize: '24px', fontWeight: '800', color: '#f9a825' }}>${Number(newTip.amount).toFixed(2)}</span>
          </div>
        )}

        {session ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[['Earned', `$${Number(session.total_tips||0).toFixed(2)}`, '#f9a825'], ['Tips', session.tip_count||0, '#fff'], ['Avg', `$${avgTip}`, '#fff']].map(([label, val, color]) => (
                <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '14px' }}>
                  <p style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</p>
                  <p style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '14px 18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Session time</span>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#888' }}>{formatTime(elapsed)}</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setShowQR(!showQR)} style={{ flex: 1, padding: '14px', background: showQR ? '#1a1400' : '#111', border: `1px solid ${showQR ? '#f9a825' : '#222'}`, borderRadius: '12px', color: showQR ? '#f9a825' : '#aaa', fontSize: '14px', fontWeight: '600' }}>
                {showQR ? 'Hide QR' : '⊞ QR Code'}
              </button>
              <button onClick={endSession} style={{ flex: 1, padding: '14px', background: '#111', border: '1px solid #3a1a1a', borderRadius: '12px', color: '#ff4444', fontSize: '14px', fontWeight: '600' }}>End Session</button>
            </div>

            {showQR && <QRCode url={tipUrl} />}

            <p style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', fontWeight: '600' }}>Live tip feed</p>
            {tips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', border: '1px dashed #1a1a1a', borderRadius: '16px' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>🎸</p>
                <p style={{ color: '#444', fontSize: '14px' }}>Show your QR code to start receiving tips</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tips.map((t, i) => (
                  <div key={t.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: i === 0 ? '3px solid #f9a825' : '3px solid #1a1a1a' }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '3px' }}>{t.name}</p>
                      {t.message && <p style={{ color: '#666', fontSize: '13px' }}>{t.message}</p>}
                      <p style={{ color: '#333', fontSize: '11px', marginTop: '4px' }}>{new Date(t.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#f9a825' }}>${Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed #1a1a1a', borderRadius: '20px' }}>
            <p style={{ fontSize: '40px', marginBottom: '16px' }}>🎵</p>
            <p style={{ color: '#555', fontSize: '15px', marginBottom: '24px' }}>No active session</p>
            <button onClick={() => navigate('/setup')} style={{ background: 'linear-gradient(135deg, #f9a825, #ff6f00)', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '14px', fontSize: '16px', fontWeight: '700' }}>Start a New Session</button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}