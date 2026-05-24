import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px', background:'#080808', position:'relative', overflow:'hidden' }}>
      <style>{`@keyframes breathe{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.15);opacity:0.9}}`}</style>

      {/* Glow orbs */}
      <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(249,168,37,0.08) 0%,transparent 70%)', animation:'breathe 4s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'20%', left:'20%', width:'200px', height:'200px', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,111,0,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div style={{ zIndex:1, textAlign:'center', marginBottom:'56px' }}>
        <p style={{ fontSize:'11px', color:'#333', letterSpacing:'0.2em', textTransform:'uppercase', marginBottom:'16px' }}>Welcome to</p>
        <h1 style={{ fontSize:'64px', fontWeight:'800', color:'#fff', letterSpacing:'-3px', lineHeight:1, marginBottom:'12px' }}>Ovatio</h1>
        <p style={{ color:'#333', fontSize:'14px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Digital infrastructure for live performers</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'12px', width:'100%', maxWidth:'320px', zIndex:1 }}>
        <button onClick={() => navigate('/setup')} style={{ background:'linear-gradient(135deg,#f9a825,#ff6f00)', color:'#fff', border:'none', padding:'22px', borderRadius:'18px', fontSize:'17px', fontWeight:'700', letterSpacing:'-0.3px', boxShadow:'0 8px 32px rgba(249,168,37,0.25)' }}>
          I'm a Performer 🎤
        </button>
        <button onClick={() => navigate('/map')} style={{ background:'rgba(255,255,255,0.04)', color:'#555', border:'1px solid #1a1a1a', padding:'22px', borderRadius:'18px', fontSize:'17px', fontWeight:'500' }}>
          Find Performers Nearby
        </button>
      </div>

      <p style={{ position:'absolute', bottom:'28px', color:'#1a1a1a', fontSize:'11px', letterSpacing:'0.1em', zIndex:1 }}>OVATIO © 2026</p>
    </div>
  );
}