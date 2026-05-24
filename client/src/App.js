import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PerformerSetup from './pages/PerformerSetup.js';
import PerformerDashboard from './pages/PerformerDashboard';
import TipPage from './pages/TipPage';
import MapPage from './pages/MapPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<PerformerSetup />} />
        <Route path="/dashboard/:performerId" element={<PerformerDashboard />} />
        <Route path="/tip/:performerId" element={<TipPage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  );
}