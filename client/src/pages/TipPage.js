import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API, SOCKET } from '../config';

const AMOUNTS = [2, 5, 10, 20];
const REACTIONS = [{ emoji: '🔥', label: 'Fire' }, { emoji: '❤️', label: 'Love' }, { emoji: '👏', label: 'Clap' }, { emoji: '🎵', label: 'Vibe' }];

export default function TipPage() {
  const { performerId } = useParams();
  const [performer, setPerformer] = useState(null);
  const [session, setSession] = useState(null);
  const [amount, setAmount] = useState(5);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [reactionSent, setReactionSent] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    axios.get(`${API}/performers/${performerId}`).then(r => setPerformer(r.data));
    axios.get(`${API}/performers/${performerId}/session`).then(r => setSession(r.data));
  }, [performerId]);

  useEffect(() => {
    if (!session) return;
    socketRef.current = io(SOCKET);
    socketRef.current.emit('viewer_join', session.id);
    socketRef.current.on('viewer_count', count => setViewers(count));
    socketRef.current.on('reaction_broadcast', ({ emoji }) => {
      const id = Date.now() + Math.random();
      setFloatingReactions(prev => [...prev, { id, emoji, x: 20 + Math.random() * 60 }]);
      setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 2500);
    });
    return () => socketRef.current?.disconnect();
  }, [session]);

  const sendReaction = (emoji) => {
    if (!session) return;
    socketRef.current?.emit('reaction', { session_id: session.id, emoji });
    setReactionSent(emoji);
    setTimeout(() => setReactionSent(null), 1500);
  };

  const finalAmount = custom ? parseFloat(custom) : amount;

  const submit = async () => {
    if (!session) return alert('This performer has no active session right now.');
    if (!finalAmount || finalAmount <= 0) return alert('Choose an amount');
    setLoading(true);
    await axios.post(`${API}/tips`, { session_id: session.id, performer_id: performerId, name: name || 'Anonymous', message, amount: finalAmount });
    setDone(true);
    setLoading(false);
  };

  const inp = { width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid #1f1f1f', borderRadius: '14px', color: '#fff', fontSize: '16px', outline: 'none', marginTop: '8px' };

  if (!performer) return (
    <div style={{ height: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #222', borderTop: '3px solid #f9a825', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (done) {
    const paypalUrl = performer.paypal ? 'https://' + performer.paypal.replace('https://','').replace('http://','') + '/' + finalAmount + 'CAD' : null;
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
        <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ fontSize: '80px', marginBottom: '24px', animation: 'pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>🎉</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>You're amazing!</h2>
        <p style={{ color: '#555', fontSize: '16px', marginBottom: '6px' }}>You tipped <span style={{ color: '#f9a825', fontWeight: '700' }}>${Number(finalAmount).toFixed(2)}</span> to {performer.name}</p>
        <p style={{ color: '#333', fontSize: '13px', marginBottom: '40px' }}>Complete your payment below</p>
        <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paypalUrl && <a href={paypalUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#003087', color: '#fff', padding: '18px', borderRadius: '16px', fontWeight: '700', fontSize: '16px', textDecoration: 'none' }}>Pay via PayPal</a>}
          {performer.venmo && (
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '16px', padding: '20px' }}>
              <p style={{ fontSize: '11px', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interac E-Transfer</p>
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{performer.venmo}</p>
              <p style={{ fontSize: '13px', color: '#444' }}>Send ${Number(finalAmount).toFixed(2)} CAD</p>
            </div>
          )}
          {!paypalUrl && !performer.venmo && <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '16px', padding: '24px', textAlign: 'center' }}><p style={{ color: '#555', fontSize: '15px' }}>Ask {performer.name} how they'd like to receive your tip!</p></div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', padding: '0 20px 40px', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes floatUp{from{transform:translateY(0);opacity:1}to{transform:translateY(-120px);opacity:0}}`}</style>

      {floatingReactions.map(r => (
        <div key={r.id} style={{ position: 'fixed', bottom: '200px', left: `${r.x}%`, fontSize: '32px', animation: 'floatUp 2.5s ease-out forwards', pointerEvents: 'none', zIndex: 100 }}>{r.emoji}</div>
      ))}

      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', paddingTop: '52px', marginBottom: '32px' }}>
          {performer.photo
            ? <img src={performer.photo} alt="" style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '3px solid #f9a825', boxShadow: '0 0 24px rgba(249,168,37,0.3)' }} />
            : <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: '#181818', border: '3px solid #f9a825', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 16px', boxShadow: '0 0 24px rgba(249,168,37,0.3)' }}>🎵</div>
          }
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>{performer.name}</h2>
          {performer.genre && <p style={{ color: '#555', fontSize: '14px', marginBottom: '10px' }}>{performer.genre}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {session?.song && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#111', border: '1px solid #1f1f1f', padding: '6px 14px', borderRadius: '99px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} />
                <span style={{ fontSize: '12px', color: '#aaa' }}>{session.song}</span>
              </div>
            )}
            {viewers > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#111', border: '1px solid #1f1f1f', padding: '6px 14px', borderRadius: '99px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>👁 {viewers} watching</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '24px' }}>
          {REACTIONS.map(r => (
            <button key={r.emoji} onClick={() => sendReaction(r.emoji)} style={{ padding: '14px 0', borderRadius: '14px', border: `1px solid ${reactionSent === r.emoji ? '#f9a825' : '#1f1f1f'}`, background: reactionSent === r.emoji ? 'rgba(249,168,37,0.1)' : 'rgba(255,255,255,0.03)', fontSize: '22px', transition: 'all 0.15s', transform: reactionSent === r.emoji ? 'scale(1.1)' : 'scale(1)' }}>
              {r.emoji}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600' }}>Choose an amount (CAD)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(a); setCustom(''); }} style={{ padding: '18px 0', borderRadius: '14px', border: amount === a && !custom ? '2px solid #f9a825' : '1px solid #1f1f1f', background: amount === a && !custom ? 'rgba(249,168,37,0.1)' : 'rgba(255,255,255,0.03)', color: amount === a && !custom ? '#f9a825' : '#555', fontSize: '18px', fontWeight: '700', transition: 'all 0.15s' }}>${a}</button>
            ))}
          </div>
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Other amount..." type="number" style={inp} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" style={inp} />
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Leave a message..." style={inp} />
        </div>

        <button onClick={submit} disabled={loading} style={{ width: '100%', background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #f9a825, #ff6f00)', color: loading ? '#444' : '#fff', border: 'none', padding: '22px', borderRadius: '18px', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.3px', transition: 'all 0.2s' }}>
          {loading ? 'Sending...' : `Tip $${Number(finalAmount || 0).toFixed(2)}`}
        </button>
        <p style={{ textAlign: 'center', color: '#222', fontSize: '12px', marginTop: '16px' }}>You'll complete payment after confirming</p>
      </div>
    </div>
  );
}