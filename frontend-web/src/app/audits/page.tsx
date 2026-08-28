import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function AuditsPage() {
  const audits = [
    {
      id: 'AUD-001',
      vetName: 'Dr. Silva',
      appointmentId: '#1024',
      date: '2026-08-27T10:00:00Z',
      type: 'Trava Térmica',
      hasConflict: true,
      reason: 'Temperatura registrada (12°C) fora do padrão aceitável (2°C - 8°C).',
    },
    {
      id: 'AUD-002',
      vetName: 'Dra. Amanda',
      appointmentId: '#1025',
      date: '2026-08-27T11:30:00Z',
      type: 'Deslocamento',
      hasConflict: false,
      reason: 'Distância auditada (8km) compatível com check-in H3.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Auditoria RT</h1>
        <p className="text-slate-500 mt-2">Validação técnica das operações em campo.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Fila de Revisão</h2>
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
            1 Conflito Pendente
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {audits.map((audit) => (
            <div key={audit.id} className={`p-6 transition-colors ${audit.hasConflict ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {audit.hasConflict ? (
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mt-1" />
                  ) : (
                    <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1" />
                  )}
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-slate-900">{audit.id} • {audit.type}</h3>
                      <span className="text-xs text-slate-500">Consulta {audit.appointmentId}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600 mt-1">Veterinário: <span className="font-medium text-slate-800">{audit.vetName}</span></p>
                    
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-sm text-slate-700">
                      <strong>Parecer Sistêmico:</strong> {audit.reason}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-slate-400">{new Date(audit.date).toLocaleString()}</span>
                  {audit.hasConflict && (
                    <button className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
                      Revisar Falha
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
