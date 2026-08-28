import Link from 'next/link';
import Image from 'next/image';
import { HomeIcon, ClipboardDocumentCheckIcon, MapIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0F172A] text-white flex flex-col h-full shadow-2xl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <Image src="/logo.png" alt="PetPrev Logo" width={40} height={40} className="object-contain" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
            <span className="text-[#0D9488]">Pet</span>Prev
          </h1>
          <p className="text-xs text-slate-400">Admin & Auditoria RT</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <HomeIcon className="w-5 h-5 text-[#0D9488]" />
          Dashboard
        </Link>
        <Link href="/audits" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#0D9488]" />
          Auditoria RT
        </Link>
        <Link href="/coverage" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <MapIcon className="w-5 h-5 text-[#0D9488]" />
          Cobertura (Map)
        </Link>
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm font-medium text-white">Dr. Responsável</p>
          <p className="text-xs text-slate-400 mt-1">CRMV-SP 12345</p>
        </div>
      </div>
    </aside>
  );
}
