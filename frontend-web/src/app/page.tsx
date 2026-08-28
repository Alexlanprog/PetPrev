import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-8 sm:p-20">
      <header className="flex justify-between items-center max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="PetPrev Logo" width={48} height={48} className="object-contain" />
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-[#0D9488]">Pet</span>Prev
          </span>
        </div>
        <Link 
          href="/dashboard"
          className="bg-[#0D9488] hover:bg-[#0b796f] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg"
        >
          Acessar Painel Admin ➔
        </Link>
      </header>

      <main className="max-w-4xl mx-auto text-center my-auto py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-[#0D9488] text-xs font-semibold uppercase tracking-wider mb-6 border border-slate-700">
          <span>🐾 Saúde Veterinária Preventiva Domiciliar</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-white mb-6">
          Cuidado completo para o seu pet, <span className="text-[#0D9488]">no conforto de casa.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Plataforma modular para consultas domiciliares, vacinação com auditoria de cadeia de frio em tempo real e prontuário digital imutável.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="bg-[#0D9488] hover:bg-[#0b796f] text-white px-8 py-4 rounded-xl font-bold text-base transition-all shadow-xl hover:scale-105"
          >
            Painel do Responsável Técnico (RT)
          </Link>
          <Link
            href="/audits"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-8 py-4 rounded-xl font-bold text-base transition-all"
          >
            Auditoria da Cadeia de Frio
          </Link>
        </div>
      </main>

      <footer className="text-center text-slate-500 text-sm max-w-6xl mx-auto w-full border-t border-slate-800 pt-8">
        PetPrev © {new Date().getFullYear()} — Plataforma de Saúde Preventiva Veterinária
      </footer>
    </div>
  );
}
