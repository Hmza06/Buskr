import React from 'react';

export default function QRCode({ url }) {
  const [fullscreen, setFullscreen] = React.useState(false);
  const imgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=0a0a0a&color=ffffff&margin=20`;

  const print = () => {
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Buskr QR</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:white;font-family:sans-serif;}img{width:300px;height:300px;}h2{margin-top:16px;}p{color:#888;font-size:14px;margin-top:6px;}</style></head><body><img src="${imgSrc}"/><h2>Tip me on Buskr</h2><p>Scan to tip — no app needed</p><script>window.onload=()=>{window.print();window.close();}</script></body></html>`);
    w.document.close();
  };

  if (fullscreen) return (
    <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}>
      <img src={imgSrc} alt="QR" style={{ width: '80vw', maxWidth: '360px', height: '80vw', maxHeight: '360px', borderRadius: '20px' }} />
      <p style={{ color: '#555', fontSize: '14px', marginTop: '24px' }}>Tap anywhere to close</p>
    </div>
  );

  return (
    <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
      <img src={imgSrc} alt="QR" style={{ width: '160px', height: '160px', borderRadius: '12px', marginBottom: '14px' }} />
      <p style={{ color: '#555', fontSize: '11px', wordBreak: 'break-all', marginBottom: '14px' }}>{url}</p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setFullscreen(true)} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #f9a825, #ff6f00)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '700' }}>Fullscreen</button>
        <button onClick={print} style={{ flex: 1, padding: '12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', color: '#aaa', fontSize: '13px' }}>Print</button>
      </div>
    </div>
  );
}