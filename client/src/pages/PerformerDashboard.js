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
  const [viewers, setViewers] = useState(0);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    axios.get(`${API}/performers/${performerId}`).then(r => setPerformer(r.data));
    axios.get(`${API}/performers/${performerId}/session`).then(r => {
      if (r.data) {
        setSession(r.data);
        axios.get(`${API}/sessions/${r.data.id}/tips`).then(t => setTips(t.data));
      }
    });
  }, [performerId]);

  useEffect(() => {
    if (!session?.started_at) return;
    const start = new Date(session.started_at).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    socketRef.current = io(SOCKET);
    socketRef.current.emit('join_session', session.id);
    socketRef.current.on('viewer_count', count => setViewers(count));
    socketRef.current.on('reaction_broadcast', ({ emoji }) => {
      const id = Date.now() + Math.random();
      setFloatingReactions(prev => [...prev, { id, emoji, x: 10 + Math.random() * 80 }]);
      setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
    });
    socketRef.current.on('new_tip', tip => {
      setTips(prev => [tip, ...prev]);
      setSession(prev => ({ ...prev, total_tips: (prev.total_tips || 0) + tip.amount, tip_count: (prev.tip_count || 0) + 1 }));
      setNewTip(tip);
      setTimeout(() => setNewTip(null), 4000);
    });
    return () => socketRef.current?.disconnect();
  }, [session]);

  const endSession = async () => {
    if (!window.confirm('End this session?')) return;
    await axios.post(`${API}/sessions/${session.id}/end`);
    setSession(null); setTips([]);
  };

  const formatTime = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const avgTip = session?.tip_count > 0 ? (session.total_tips / session.tip_count).toFixed(2) : '0.00';
  const tipUrl = `${window.location.origin}/tip/${performerId}`;

  if (!performer) return (
    <div style={{ height:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', border:'3px solid #1a1a1a', borderTop:'3px solid #f9a825', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#333', fontSize:'13px', letterSpacing:'0.1em' }}>LOADING</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#080808', color:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-140px) scale(1.4);opacity:0}}
        @keyframes slideDown{from{transform:translateY(-20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes tipIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}
      `}</style>

      {floatingReactions.map(r => (
        <div key={r.id} style={{ position:'fixed', bottom:'160px', left:`${r.x}%`, fontSize:'40px', animation:'floatUp 2.5s ease-out forwards', pointerEvents:'none', zIndex:1000 }}>{r.emoji}</div>
      ))}

      {/* Hero section */}
      <div style={{ position:'relative', padding:'0 20px 32px', background:'linear-gradient(180deg, #0f0f0f 0%, #080808 100%)', borderBottom:'1px solid #111' }}>
        <div style={{ maxWidth:'480px', margin:'0 auto', paddingTop:'48px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'28px' }}>
            <div style={{ position:'relative' }}>
              {performer.photo
                ? <img src={performer.photo} alt="" style={{ width:'64px', height:'64px', borderRadius:'50%', objectFit:'cover', border: session ? '2px solid #f9a825' : '2px solid #222' }} />
                : <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'#181818', border: session ? '2px solid #f9a825' : '2px solid #222', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>🎵</div>
              }
              {session && <div style={{ position:'absolute', bottom:2, right:2, width:'12px', height:'12px', borderRadius:'50%', background:'#4caf50', border:'2px solid #080808', animation:'pulse 2s infinite' }} />}
            </div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'2px', letterSpacing:'-0.5px' }}>{performer.name}</h1>
              <p style={{ color:'#555', fontSize:'13px' }}>{performer.genre || 'Performer'}</p>
            </div>
            {session && (
              <div style={{ background:'rgba(76,175,80,0.1)', border:'1px solid rgba(76,175,80,0.3)', padding:'6px 14px', borderRadius:'99px', display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4caf50', animation:'pulse 1.5s infinite' }} />
                <span style={{ fontSize:'12px', color:'#4caf50', fontWeight:'600', letterSpacing:'0.05em' }}>LIVE</span>
              </div>
            )}
          </div>

          {session && (
            <>
              {/* Big earnings */}
              <div style={{ textAlign:'center', marginBottom:'28px', padding:'32px 20px', background:'rgba(249,168,37,0.04)', borderRadius:'24px', border:'1px solid rgba(249,168,37,0.08)' }}>
                <p style={{ fontSize:'11px', color:'#444', textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:'8px' }}>Total Earned</p>
                <p style={{ fontSize:'56px', fontWeight:'800', color:'#f9a825', letterSpacing:'-2px', lineHeight:1 }}>${Number(session.total_tips||0).toFixed(2)}</p>
                <p style={{ color:'#333', fontSize:'13px', marginTop:'8px' }}>CAD</p>
              </div>

              {/* Stats row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
                {[['Tips', session.tip_count||0, '#fff'], ['Avg', `$${avgTip}`, '#aaa'], ['Watching', viewers, '#4caf50']].map(([label, val, color]) => (
                  <div key={label} style={{ background:'#0f0f0f', border:'1px solid #141414', borderRadius:'16px', padding:'16px 12px', textAlign:'center' }}>
                    <p style={{ fontSize:'10px', color:'#333', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>{label}</p>
                    <p style={{ fontSize:'22px', fontWeight:'700', color }}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Timer */}
              <div style={{ background:'#0f0f0f', border:'1px solid #141414', borderRadius:'14px', padding:'14px 20px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'12px', color:'#333', textTransform:'uppercase', letterSpacing:'0.08em' }}>Session</span>
                <span style={{ fontSize:'18px', fontWeight:'700', color:'#444', fontVariantNumeric:'tabular-nums', letterSpacing:'0.05em' }}>{formatTime(elapsed)}</span>
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display:'flex', gap:'10px' }}>
            {session ? (
              <>
                <button onClick={() => setShowQR(!showQR)} style={{ flex:1, padding:'16px', background: showQR ? 'rgba(249,168,37,0.1)' : '#0f0f0f', border:`1px solid ${showQR ? 'rgba(249,168,37,0.4)' : '#141414'}`, borderRadius:'14px', color: showQR ? '#f9a825' : '#666', fontSize:'14px', fontWeight:'600' }}>
                  {showQR ? 'Hide QR' : 'Show QR'}
                </button>
                <button onClick={endSession} style={{ flex:1, padding:'16px', background:'#0f0f0f', border:'1px solid #1a0a0a', borderRadius:'14px', color:'#ff4444', fontSize:'14px', fontWeight:'600' }}>
                  End Session
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/setup')} style={{ flex:1, padding:'18px', background:'linear-gradient(135deg,#f9a825,#ff6f00)', border:'none', borderRadius:'16px', color:'#fff', fontSize:'16px', fontWeight:'700' }}>
                Start New Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR */}
      {showQR && (
        <div style={{ padding:'20px', maxWidth:'480px', margin:'0 auto' }}>
          <QRCode url={tipUrl} />
        </div>
      )}

      {/* New tip flash */}
      {newTip && (
        <div style={{ margin:'16px 20px 0', maxWidth:'480px', marginLeft:'auto', marginRight:'auto', background:'linear-gradient(135deg,rgba(249,168,37,0.15),rgba(255,111,0,0.08))', border:'1px solid rgba(249,168,37,0.3)', borderRadius:'18px', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', animation:'slideDown 0.3s ease' }}>
          <div>
            <p style={{ fontWeight:'700', fontSize:'16px', marginBottom:'4px' }}>🎉 {newTip.name} tipped you!</p>
            {newTip.message && <p style={{ color:'#888', fontSize:'14px' }}>"{newTip.message}"</p>}
          </div>
          <span style={{ fontSize:'28px', fontWeight:'800', color:'#f9a825' }}>${Number(newTip.amount).toFixed(2)}</span>
        </div>
      )}

      {/* Tips feed */}
      <div style={{ padding:'24px 20px', maxWidth:'480px', margin:'0 auto' }}>
        {session ? (
          <>
            <p style={{ fontSize:'11px', color:'#2a2a2a', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'16px', fontWeight:'600' }}>Live Feed</p>
            {tips.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', border:'1px dashed #141414', borderRadius:'20px' }}>
                <p style={{ fontSize:'40px', marginBottom:'14px' }}>🎸</p>
                <p style={{ color:'#2a2a2a', fontSize:'15px' }}>Share your QR to start receiving tips</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {tips.map((t, i) => (
                  <div key={t.id} style={{ background:'#0f0f0f', border:`1px solid ${i===0?'rgba(249,168,37,0.2)':'#111'}`, borderRadius:'16px', padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', animation: i===0 ? 'tipIn 0.4s ease' : 'none' }}>
                    <div>
                      <p style={{ fontWeight:'600', fontSize:'15px', marginBottom:'4px', color: i===0 ? '#f9a825' : '#fff' }}>{t.name}</p>
                      {t.message && <p style={{ color:'#444', fontSize:'13px', marginBottom:'4px' }}>{t.message}</p>}
                      <p style={{ color:'#222', fontSize:'11px' }}>{new Date(t.created_at).toLocaleTimeString()}</p>
                    </div>
                    <span style={{ fontSize:'20px', fontWeight:'800', color: i===0 ? '#f9a825' : '#333' }}>${Number(t.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <p style={{ color:'#222', fontSize:'15px' }}>No active session</p>
          </div>
        )}
      </div>
    </div>
  );
}