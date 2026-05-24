import React, { useState } from 'react';

export default function QRCode({ url }) {
  const [fullscreen, setFullscreen] = useState(false);
  const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=080808&color=ffffff&margin=20`;

  const print = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Ovatio QR</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:white;font-family:-apple-system,sans-serif;}img{width:280px;height:280px;}h2{margin-top:20px;font-size:24px;letter-spacing:-1px;}p{color:#999;font-size:13px;margin-top:8px;letter-spacing:0.05em;text-transform:uppercase;}</style></head><body><img src="${imgSrc}"/><h2>Tip me on Ovatio</h2><p>Scan to tip — no app needed</p><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
    w.document.close();
  };

  if (fullscreen) return (
    <div onClick={() => setFullscreen(false)} style={{ position:'fixed', inset:0, background:'#080808', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999, cursor:'pointer' }}>
      <img src={imgSrc} alt="QR" style={{ width:'80vw', maxWidth:'360px', height:'80vw', maxHeight:'360px', borderRadius:'24px' }} />
      <p style={{ color:'#333', fontSize:'14px', marginTop:'28px', letterSpacing:'0.05em' }}>TAP ANYWHERE TO CLOSE</p>
      <p style={{ color:'#1a1a1a', fontSize:'12px', marginTop:'8px' }}>Show this to fans to scan</p>
    </div>
  );

  return (
    <div style={{ background:'#0f0f0f', border:'1px solid #141414', borderRadius:'20px', padding:'24px', textAlign:'center' }}>
      <img src={imgSrc} alt="QR" style={{ width:'180px', height:'180px', borderRadius:'16px', marginBottom:'16px' }} />
      <p style={{ color:'#222', fontSize:'11px', wordBreak:'break-all', marginBottom:'16px', letterSpacing:'0.02em' }}>{url}</p>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={() => setFullscreen(true)} style={{ flex:1, padding:'14px', background:'linear-gradient(135deg,#f9a825,#ff6f00)', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'700' }}>Fullscreen</button>
        <button onClick={print} style={{ flex:1, padding:'14px', background:'rgba(255,255,255,0.04)', border:'1px solid #1a1a1a', borderRadius:'12px', color:'#555', fontSize:'14px' }}>Print</button>
      </div>
    </div>
  );
}