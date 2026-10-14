import React from 'react';
import {
  Volume2,
  VolumeX,
  Tv,
  ShieldCheck,
  Ticket,
  Users,
  Sparkles,
  Smartphone,
  Printer,
  Lock,
  Unlock,
  Settings,
  LogOut,
  Gift,
} from 'lucide-react';
import { getMuted, setMuted } from '../utils/audio.ts';
import { Raffle } from '../types.ts';
import { AppLogo } from '../utils/theme.tsx';

interface NavbarProps {
  activeTab: 'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal';
  setActiveTab: (tab: 'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal') => void;
  participantCount: number;
  raffle?: Raffle | null;
  onOpenMobileQR: () => void;
  onOpenPrintPoster?: () => void;
  isAdmin: boolean;
  onOpenAdminAuth: () => void;
  onAdminLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  participantCount,
  raffle,
  onOpenMobileQR,
  onOpenPrintPoster,
  isAdmin,
  onOpenAdminAuth,
  onAdminLogout,
}) => {
  const [muted, setMutedState] = React.useState(getMuted());

  const toggleSound = () => {
    const newState = !muted;
    setMuted(newState);
    setMutedState(newState);
  };

  const announcement = raffle?.settings?.showAnnouncement ? raffle?.settings?.announcementBanner : null;
  const settings = raffle?.settings;
  const logoUrl = settings?.logoUrl;
  const logoText = settings?.logoText || 'Sorteio';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      {/* Top Announcement Bar if configured */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 py-1 px-4 text-center text-xs font-bold text-white shadow-inner flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
          <span>{announcement}</span>
        </div>
      )}

      {/* Admin Mode Ribbon if authenticated */}
      {isAdmin && (
        <div className="bg-emerald-600/20 border-b border-emerald-500/30 px-4 py-1 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Modo Administrador Ativo • Acesso Total Liberado</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('admin')}
              className="text-white hover:underline text-[11px] font-bold"
            >
              Abrir Painel Admin
            </button>
            <span>•</span>
            <button
              onClick={onAdminLogout}
              className="text-rose-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              Sair do Admin
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand with custom Logo where "Sorteio" is written */}
          <div
            className="cursor-pointer flex items-center gap-2"
            onClick={() => {
              if (isAdmin) {
                setActiveTab('admin');
              } else {
                setActiveTab('register');
              }
            }}
          >
            <AppLogo
              logoUrl={logoUrl}
              logoText={logoText}
              size="md"
              subtitle={settings?.organizerName || 'Sorteio Oficial com Validação'}
            />
          </div>

          {/* Navigation - Only visible to Admin or if admin turned off restriction */}
          {isAdmin ? (
            <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-indigo-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-amber-300" />
                Painel Admin
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'live'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Sorteador & Roleta
              </button>

              <button
                onClick={() => setActiveTab('stage')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'stage'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Modo Telão para Projetor / Apresentação"
              >
                <Tv className="w-3.5 h-3.5 text-purple-400" />
                Modo Telão
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'register' || activeTab === 'portal'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                Formulário
              </button>

              <button
                onClick={() => setActiveTab('lookup')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'lookup'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Consultar Bilhete
              </button>
            </nav>
          ) : (
            /* When not admin: clean indicator */
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Inscrições Abertas no Formulário Oficial</span>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* If Admin: print A4 poster button & QR telemovel */}
            {isAdmin && (
              <>
                <button
                  onClick={onOpenMobileQR}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  title="Abrir QR Code para telemóvel"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-300" />
                  <span>QR Telemóvel</span>
                </button>

                {onOpenPrintPoster && (
                  <button
                    onClick={onOpenPrintPoster}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                    title="Imprimir Cartaz com QR Code para Papel (A4)"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden md:inline">Cartaz Papel (A4)</span>
                  </button>
                )}

                {/* Participants counter only for admin */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-400">Inscritos:</span>
                  <span className="font-bold text-white text-sm">{participantCount}</span>
                </div>
              </>
            )}

            {/* Admin Lock / Unlock button */}
            {isAdmin ? (
              <button
                onClick={onAdminLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                title="Sair do Modo Administrador"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Admin (Sair)</span>
              </button>
            ) : (
              <button
                onClick={onOpenAdminAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500/50 text-xs font-bold transition-colors cursor-pointer"
                title="Acesso Restrito ao Administrador (PIN)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin (PIN)</span>
              </button>
            )}

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

        {/* Mobile Navigation bar - only visible if Admin */}
        {isAdmin && (
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs overflow-x-auto gap-1">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1.5 rounded-md font-bold whitespace-nowrap ${
                activeTab === 'admin' ? 'bg-indigo-600 text-white' : 'text-indigo-300'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
                activeTab === 'live' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              Sorteador
            </button>
            <button
              onClick={() => setActiveTab('stage')}
              className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
                activeTab === 'stage' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              Telão
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
                activeTab === 'register' || activeTab === 'portal' ? 'bg-emerald-600 text-white' : 'text-emerald-400'
              }`}
            >
              Formulário
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-2.5 py-1.5 rounded-md font-medium whitespace-nowrap ${
                activeTab === 'lookup' ? 'bg-indigo-600 text-white' : 'text-slate-300'
              }`}
            >
              Bilhetes
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
