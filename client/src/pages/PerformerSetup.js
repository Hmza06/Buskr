import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../config';

export default function PerformerSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState('');
  const [form, setForm] = useState({ name:'', genre:'', bio:'', venmo:'', paypal:'' });
  const [session, setSession] = useState({ song:'', lat:'', lng:'' });

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
      alert('Something went wrong.');
    }
    setLoading(false);
  };

  const inp = { width:'100%', padding:'16px', background:'rgba(255,255,255,0.04)', border:'1px solid #1a1a1a', borderRadius:'14px', color:'#fff', fontSize:'16px', outline:'none', marginTop:'8px', transition:'border 0.2s' };
  const lbl = { fontSize:'11px', color:'#444', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.1em' };

  return (
    <div style={{ minHeight:'100vh', background:'#080808', padding:'0 20px 48px' }}>
      <style>{`input::placeholder,textarea::placeholder{color:#2a2a2a}`}</style>
      <div style={{ maxWidth:'440px', margin:'0 auto' }}>
        <div style={{ paddingTop:'52px', marginBottom:'40px' }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', color:'#333', fontSize:'14px', marginBottom:'24px', padding:0, letterSpacing:'0.05em' }}>← Back</button>
          <h1 style={{ fontSize:'30px', fontWeight:'800', marginBottom:'6px', letterSpacing:'-1px' }}>{step === 1 ? 'Your profile' : 'Go live'}</h1>
          <p style={{ color:'#333', fontSize:'14px', marginBottom:'24px' }}>Step {step} of 2</p>
          <div style={{ display:'flex', gap:'6px' }}>
            {[1,2].map(s => <div key={s} style={{ height:'2px', flex:1, borderRadius:'99px', background: step >= s ? '#f9a825' : '#141414', transition:'background 0.4s' }} />)}
          </div>
        </div>

        {step === 1 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div style={{ textAlign:'center' }}>
              <label htmlFor="photo-upload" style={{ cursor:'pointer', display:'inline-block' }}>
                <div style={{ width:'96px', height:'96px', borderRadius:'50%', background:'#111', border:'2px dashed #222', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', overflow:'hidden', transition:'border 0.2s' }}>
                  {photo ? <img src={photo} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:'32px' }}>📷</span>}
                </div>
                <span style={{ fontSize:'13px', color:'#f9a825', letterSpacing:'0.05em' }}>{photo ? 'Change photo' : 'Add photo'}</span>
              </label>
              <input id="photo-upload" type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
            </div>

            <div><label style={lbl}>Stage Name *</label><input name="name" value={form.name} onChange={handle} placeholder="Your name" style={inp} /></div>
            <div><label style={lbl}>Genre</label><input name="genre" value={form.genre} onChange={handle} placeholder="Jazz · Soul · Hip-Hop" style={inp} /></div>
            <div><label style={lbl}>Bio</label><textarea name="bio" value={form.bio} onChange={handle} placeholder="Tell your story..." style={{ ...inp, minHeight:'100px', resize:'vertical' }} /></div>

            <div style={{ borderTop:'1px solid #111', paddingTop:'24px' }}>
              <p style={{ ...lbl, marginBottom:'16px' }}>How fans pay you</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <input name="venmo" value={form.venmo} onChange={handle} placeholder="E-Transfer email" style={inp} />
                <input name="paypal" value={form.paypal} onChange={handle} placeholder="PayPal.me link" style={inp} />
              </div>
            </div>

            <button onClick={() => { if (!form.name) return alert('Name is required'); setStep(2); }} style={{ background:'linear-gradient(135deg,#f9a825,#ff6f00)', color:'#fff', border:'none', padding:'20px', borderRadius:'16px', fontSize:'17px', fontWeight:'700', marginTop:'8px', boxShadow:'0 8px 32px rgba(249,168,37,0.2)' }}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
            <div><label style={lbl}>What are you playing today?</label><input name="song" value={session.song} onChange={handleSession} placeholder="Jazz standards · My originals..." style={inp} /></div>
            <div>
              <label style={lbl}>Your Location</label>
              <button onClick={getLocation} style={{ width:'100%', marginTop:'8px', padding:'16px', background:'rgba(255,255,255,0.04)', border:`1px solid ${session.lat ? 'rgba(249,168,37,0.4)' : '#1a1a1a'}`, borderRadius:'14px', color: session.lat ? '#f9a825' : '#333', fontSize:'15px', transition:'all 0.2s' }}>
                {session.lat ? '📍 Location captured' : '📍 Share my location'}
              </button>
            </div>

            <div style={{ background:'rgba(249,168,37,0.04)', border:'1px solid rgba(249,168,37,0.08)', borderRadius:'16px', padding:'18px' }}>
              <p style={{ fontSize:'13px', color:'#444', lineHeight:'1.7' }}>Once live, fans nearby can find you on the map and scan your QR to tip instantly — no app needed.</p>
            </div>

            <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:'20px', background:'rgba(255,255,255,0.04)', border:'1px solid #1a1a1a', borderRadius:'16px', color:'#555', fontSize:'16px' }}>← Back</button>
              <button onClick={submit} disabled={loading} style={{ flex:2, background: loading ? '#1a1a1a' : 'linear-gradient(135deg,#f9a825,#ff6f00)', color: loading ? '#444' : '#fff', border:'none', padding:'20px', borderRadius:'16px', fontSize:'17px', fontWeight:'700', boxShadow: loading ? 'none' : '0 8px 32px rgba(249,168,37,0.2)' }}>
                {loading ? 'Going live...' : '🎤 Go Live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}