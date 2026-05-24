import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config';

const AMOUNTS = [2, 5, 10, 20];

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

  useEffect(() => {
    axios.get(`${API}/performers/${performerId}`).then(r => setPerformer(r.data));
    axios.get(`${API}/performers/${performerId}/session`).then(r => setSession(r.data));
  }, [performerId]);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const submit = async () => {
    if (!session) return alert('This performer has no active session right now.');
    if (!finalAmount || finalAmount <= 0) return alert('Choose an amount');
    setLoading(true);
    await axios.post(`${API}/tips`, { session_id: session.id, performer_id: performerId, name: name || 'Anonymous', message, amount: finalAmount });
    setDone(true);
    setLoading(false);
  };

  const inp = { width: '100%', padding: '14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', marginTop: '8px' };

  if (!performer) return <div style={{ height: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '36px', height: '36px', border: '3px solid #222', borderTop: '3px solid #f9a825', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  if (done) {
    const paypalUrl = performer.paypal ? 'https://' + performer.paypal.replace('https://','').replace('http://','') + '/' + finalAmount + 'CAD' : null;
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
        <style>{`@keyframes pop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        <div style={{ fontSize: '72px', marginBottom: '20px', animation: 'pop 0.4s ease' }}>🎵</div>
        <h2 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>You're amazing!</h2>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '8px' }}>You tipped <span style={{ color: '#f9a825', fontWeight: '700' }}>${Number(finalAmount).toFixed(2)}</span> to {performer.name}</p>
        <p style={{ color: '#444', fontSize: '13px', marginBottom: '36px' }}>Now complete your payment below</p>
        <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paypalUrl && <a href={paypalUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#003087', color: '#fff', padding: '16px', borderRadius: '14px', fontWeight: '700', fontSize: '15px', textDecoration: 'none' }}>Pay ${Number(finalAmount).toFixed(2)} via PayPal</a>}
          {performer.venmo && (
            <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px' }}>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-Transfer</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{performer.venmo}</p>
              <p style={{ fontSize: '12px', color: '#555' }}>Send ${Number(finalAmount).toFixed(2)} CAD via Interac e-Transfer</p>
            </div>
          )}
          {!paypalUrl && !performer.venmo && <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '20px', textAlign: 'center' }}><p style={{ color: '#666', fontSize: '14px' }}>Ask {performer.name} how they'd like to receive your tip!</p></div>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '0 20px 40px' }}>
      <div style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', paddingTop: '48px', marginBottom: '32px' }}>
          {performer.photo ? <img src={performer.photo} alt="" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', marginBottom: '14px', border: '3px solid #f9a825' }} /> : <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#181818', border: '3px solid #f9a825', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 14px' }}>🎵</div>}
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{performer.name}</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '6px' }}>{performer.genre}</p>
          {session?.song && <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#141414', border: '1px solid #222', padding: '6px 14px', borderRadius: '99px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 6px #4caf50' }} /><span style={{ fontSize: '12px', color: '#aaa' }}>{session.song}</span></div>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: '600' }}>Choose an amount (CAD)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(a); setCustom(''); }} style={{ padding: '16px 0', borderRadius: '12px', border: amount === a && !custom ? '2px solid #f9a825' : '1px solid #222', background: amount === a && !custom ? '#1a1400' : '#111', color: amount === a && !custom ? '#f9a825' : '#666', fontSize: '17px', fontWeight: '700' }}>${a}</button>
            ))}
          </div>
          <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Other amount..." type="number" style={inp} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)" style={inp} />
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Leave a message..." style={inp} />
        </div>

        <button onClick={submit} disabled={loading} style={{ width: '100%', background: loading ? '#333' : 'linear-gradient(135deg, #f9a825, #ff6f00)', color: '#fff', border: 'none', padding: '20px', borderRadius: '16px', fontSize: '18px', fontWeight: '800' }}>
          {loading ? 'Sending...' : 'Tip $' + Number(finalAmount || 0).toFixed(2) + ' 🎸'}
        </button>
        <p style={{ textAlign: 'center', color: '#333', fontSize: '12px', marginTop: '16px' }}>You'll complete payment after confirming</p>
      </div>
    </div>
  );
}