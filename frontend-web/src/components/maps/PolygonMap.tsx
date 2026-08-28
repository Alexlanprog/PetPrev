'use client';
import React, { useEffect, useState } from 'react';

// Mock component since react-map-gl/leaflet requires heavy setup and browser APIs
export default function PolygonMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-96 bg-slate-100 animate-pulse rounded-xl"></div>;

  return (
    <div className="relative h-[600px] w-full bg-slate-200 rounded-xl overflow-hidden border border-slate-300">
      {/* Fallback visual for the map */}
      <div className="absolute inset-0 flex items-center justify-center bg-[#0F172A]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0D9488]/20 mb-4">
            <svg className="w-8 h-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Cobertura H3 Integrada</h3>
          <p className="text-slate-400 mt-2 max-w-md">O mapa interativo será renderizado aqui com os polígonos H3 representando as áreas de atuação dos veterinários (Leaflet/Mapbox).</p>
        </div>
      </div>
      
      {/* Mock HUD Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-white/20">
        <h4 className="font-semibold text-slate-900 text-sm">Filtros de Região</h4>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded text-[#0D9488] focus:ring-[#0D9488]" defaultChecked />
            Veterinários Ativos
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded text-[#0D9488] focus:ring-[#0D9488]" defaultChecked />
            Zonas de Alta Demanda
          </label>
        </div>
      </div>
    </div>
  );
}
