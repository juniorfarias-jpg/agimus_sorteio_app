import React from 'react';
import { Gift, Volume2, VolumeX, Tv, ShieldCheck, Ticket, Users, Sparkles, Smartphone } from 'lucide-react';
import { getMuted, setMuted } from '../utils/audio.ts';
import { Raffle } from '../types.ts';

interface NavbarProps {
  activeTab: 'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal';
  setActiveTab: (tab: 'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal') => void;
  participantCount: number;
  raffle?: Raffle | null;
  onOpenMobileQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  participantCount,
  raffle,
  onOpenMobileQR,
}) => {
  const [muted, setMutedState] = React.useState(getMuted());

  const toggleSound = () => {
    const newState = !muted;
    setMuted(newState);
    setMutedState(newState);
  };

  const announcement = raffle?.settings?.showAnnouncement ? raffle?.settings?.announcementBanner : null;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      {/* Top Announcement Bar if configured */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 py-1.5 px-4 text-center text-xs font-bold text-white shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
          <span>{announcement}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('live')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Gift className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  SorteioLive
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AO VIVO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {raffle?.settings?.organizerName || 'Sorteios com Validação & QR Code'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('live')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'live'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Resultados & Ao Vivo
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Inscrever-se
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'lookup'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Meu Bilhete / QR Code
            </button>

            <button
              onClick={() => setActiveTab('stage')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stage'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Modo Telão para Projetor / Apresentação"
            >
              <Tv className="w-4 h-4 text-purple-400" />
              Modo Telão
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* QR Telemovel quick modal button */}
            <button
              onClick={onOpenMobileQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Abrir QR Code para escanear com o telemóvel"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">QR Telemóvel</span>
            </button>

            {/* Live Participants counter */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Inscritos:</span>
              <span className="font-bold text-white text-sm">{participantCount}</span>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                muted
                  ? 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
              }`}
              title={muted ? 'Ativar Efeitos Sonoros' : 'Mutar Sons'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'live' ? 'bg-indigo-600 text-white' : 'text-slate-300'
            }`}
          >
            Ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'register' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
            }`}
          >
            Inscrição
          </button>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'lookup' ? 'bg-indigo-600 text-white' : 'text-slate-300'
            }`}
          >
            Meu QR
          </button>
          <button
            onClick={() => setActiveTab('stage')}
            className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
              activeTab === 'stage' ? 'bg-indigo-600 text-white' : 'text-slate-300'
            }`}
          >
            Telão
          </button>
        </div>
      </div>
    </header>
  );
};
