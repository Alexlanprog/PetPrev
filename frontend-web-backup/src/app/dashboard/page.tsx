import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard de Operações</h1>
        <p className="text-slate-500 mt-2">Visão geral da plataforma PetPrev em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-medium text-slate-500">Consultas Hoje</h3>
          <p className="text-3xl font-bold text-[#0D9488] mt-2">24</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-500 font-medium">+12%</span>
            <span className="text-slate-400 ml-2">vs ontem</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-medium text-slate-500">Repasses Pendentes (PIX)</h3>
          <p className="text-3xl font-bold text-[#0F172A] mt-2">R$ 1.450,00</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-400">18 transações aguardando</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-medium text-slate-500">Alertas de Auditoria</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">3</p>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-500 font-medium">Requer atenção do RT</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Últimas Consultas Finalizadas</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3 rounded-tl-lg">ID</th>
                <th className="px-6 py-3">Veterinário</th>
                <th className="px-6 py-3">Tutor / Pet</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 rounded-tr-lg">Payout</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock Data */}
              <tr className="bg-white border-b border-slate-50">
                <td className="px-6 py-4 font-medium">#1024</td>
                <td className="px-6 py-4 text-slate-700">Dr. Silva</td>
                <td className="px-6 py-4">Carlos / Rex</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Concluído</span>
                </td>
                <td className="px-6 py-4 font-medium text-[#0D9488]">R$ 80,00</td>
              </tr>
              <tr className="bg-white border-b border-slate-50">
                <td className="px-6 py-4 font-medium">#1025</td>
                <td className="px-6 py-4 text-slate-700">Dra. Amanda</td>
                <td className="px-6 py-4">Juliana / Mia</td>
                <td className="px-6 py-4">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Em Campo</span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-400">Pendente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
