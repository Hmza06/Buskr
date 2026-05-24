import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config';

export default function PerformerSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState('');
  const [form, setForm] = useState({ name: '', genre: '', bio: '', venmo: '', paypal: '' });
  const [session, setSession] = useState({ song: '', lat: '', lng: '' });

  const handlePhoto = useCallback(e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSession = e => setSession(s => ({ ...s, [e.target.name]: e.target.value }));

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setSession(s => ({ ...s, lat: pos.coords.latitude, lng: pos.coords.longitude })),
      () => alert('Could not get location. Please allow location access.')
    );
  };

  const submit = async () => {
    if (!form.name) return alert('Name is required');
    setLoading(true);
    try {
      const { data: performer } = await axios.post(`${API}/performers`, { ...form, photo });
      if (session.song && session.lat) {
        await axios.post(`${API}/sessions`, { performer_id: performer.id, ...session });
      }
      localStorage.setItem('buskr_performer', JSON.stringify(performer));
      navigate(`/dashboard/${performer.id}`);
    } catch (e) {
      alert('Something went wrong. Is the server running?');
    }
    setLoading(false);
  };

  const inp = { width: '100%', padding: '14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', marginTop: '8px' };
  const lbl = { fontSize: '11px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '0 20px 40px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>
        <div style={{ paddingTop: '48px', marginBottom: '36px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', marginBottom: '20px', padding: 0 }}>← Back</button>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>{step === 1 ? 'Your profile' : 'Start your session'}</h1>
          <p style={{ color: '#555', fontSize: '14px', marginBottom: '20px' }}>Step {step} of 2</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2].map(s => <div key={s} style={{ height: '3px', flex: 1, borderRadius: '99px', background: step >= s ? '#f9a825' : '#222', transition: 'background 0.3s' }} />)}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <label htmlFor="photo-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: '#181818', border: '2px dashed #333', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', overflow: 'hidden' }}>
                  {photo ? <img src={photo} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '28px' }}>📷</span>}
                </div>
                <span style={{ fontSize: '13px', color: '#f9a825' }}>{photo ? 'Change photo' : 'Add photo'}</span>
              </label>
              <input id="photo-upload" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            </div>
            <div><label style={lbl}>Your Name *</label><input name="name" value={form.name} onChange={handle} placeholder="Maya Johnson" style={inp} /></div>
            <div><label style={lbl}>Genre</label><input name="genre" value={form.genre} onChange={handle} placeholder="Jazz · Acoustic · Hip-Hop" style={inp} /></div>
            <div><label style={lbl}>Short Bio</label><textarea name="bio" value={form.bio} onChange={handle} placeholder="Tell people about yourself..." style={{ ...inp, minHeight: '90px', resize: 'vertical' }} /></div>
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
              <p style={{ ...lbl, marginBottom: '14px' }}>Payment links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input name="venmo" value={form.venmo} onChange={handle} placeholder="E-Transfer email — you@email.com" style={inp} />
                <input name="paypal" value={form.paypal} onChange={handle} placeholder="PayPal.me — paypal.me/yourname" style={inp} />
              </div>
            </div>
            <button onClick={() => { if (!form.name) return alert('Name is required'); setStep(2); }} style={{ background: 'linear-gradient(135deg, #f9a825, #ff6f00)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '700' }}>Next →</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div><label style={lbl}>What are you playing today?</label><input name="song" value={session.song} onChange={handleSession} placeholder="Jazz standards · Original songs..." style={inp} /></div>
            <div>
              <label style={lbl}>Your Location</label>
              <button onClick={getLocation} style={{ width: '100%', marginTop: '8px', padding: '14px', background: '#111', border: `1px solid ${session.lat ? '#f9a825' : '#2a2a2a'}`, borderRadius: '12px', color: session.lat ? '#f9a825' : '#666', fontSize: '14px' }}>
                {session.lat ? '📍 Location captured' : '📍 Share my location'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '18px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px', color: '#fff', fontSize: '15px' }}>← Back</button>
              <button onClick={submit} disabled={loading} style={{ flex: 2, background: 'linear-gradient(135deg, #f9a825, #ff6f00)', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontSize: '16px', fontWeight: '700' }}>
                {loading ? 'Going live...' : '🎵 Go Live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}