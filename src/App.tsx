import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { LiveDrawScreen } from './components/LiveDrawScreen.tsx';
import { RegistrationForm } from './components/RegistrationForm.tsx';
import { TicketLookup } from './components/TicketLookup.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { StageMode } from './components/StageMode.tsx';
import { Participant, Prize, Raffle, Winner } from './types.ts';
import { MobileJoinQRModal } from './components/MobileJoinQRModal.tsx';
import { PrintableQRPosterModal } from './components/PrintableQRPosterModal.tsx';
import { ParticipantPortal } from './components/ParticipantPortal.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { getThemeStyles } from './utils/theme.tsx';
import { Settings, Lock, Sparkles, Printer, ShieldCheck } from 'lucide-react';

const fallbackRaffle: Raffle = {
  id: 'raffle-2026-01',
  title: 'Grande Sorteio Oficial de Tecnologia 2026',
  description: 'Participe do maior sorteio comunitário do ano! Inscrição 100% gratuita, validação segura por e-mail e emissão de QR Code oficial para cada bilhete.',
  prizes: [
    { id: 'prize-1', rank: 1, title: 'MacBook Air M3 / Notebook Gamer Ultra', description: 'Computador de alta performance para trabalho e jogos', estimatedValue: 'R$ 9.500,00' },
    { id: 'prize-2', rank: 2, title: 'PlayStation 5 Pro + 2 Controles', description: 'Console de última geração com kit de jogos', estimatedValue: 'R$ 5.800,00' },
    { id: 'prize-3', rank: 3, title: 'iPhone 16 Pro Max 256GB', description: 'Smartphone topo de linha com câmera profissional', estimatedValue: 'R$ 8.900,00' },
    { id: 'prize-4', rank: 4, title: 'Smart TV 65" 4K QLED', description: 'Cinema em casa com som Dolby Atmos', estimatedValue: 'R$ 4.200,00' },
    { id: 'prize-5', rank: 5, title: 'Vale-Compras de R$ 1.500,00', description: 'Crédito livre para compras online', estimatedValue: 'R$ 1.500,00' },
  ],
  status: 'open',
  allowRegistrations: true,
  createdAt: new Date().toISOString(),
  winners: [],
  settings: {
    organizerName: 'Comissão Organizadora Oficial',
    contactEmail: 'suporte@sorteiolive.com',
    contactPhone: '(11) 98765-4321',
    rulesText: '1. Cada participante tem direito a 1 (um) único bilhete numerado.\n2. O sorteio é realizado ao vivo com transparência pública auditável.\n3. O contemplado receberá a confirmação através dos dados cadastrados.',
    rulesTitle: 'Regulamento do Sorteio',
    requirePhone: false,
    requireCity: false,
    maxParticipants: 0,
    codeExpirationMinutes: 10,
    soundEnabledByDefault: true,
    adminPin: '1234',
    announcementBanner: '🎉 Grande Sorteio Oficial em Andamento! Cadastre-se e acompanhe os resultados ao vivo.',
    showAnnouncement: true,

    // Logo
    logoUrl: '',
    logoText: 'Sorteio',
    showLogo: true,

    // Theme Background Colors
    themePreset: 'dark-slate',
    themeBgColorPrimary: '#020617',
    themeBgColorSecondary: '#0f172a',
    themeBgStyle: 'linear-to-b',
    themeTextColor: 'light',

    // Visibility
    showFormBadge: true,
    showFormDescription: true,
    showPrizesPreview: true,
    showInfoIndicators: true,
    showCardTag: true,
    showRulesSection: true,
    showCheckTicketLink: true,

    // Restricted Access: Only admin has access to the whole app
    onlyAdminAccessAll: true,
  },
};

export default function App() {
  // Default to registration form for all participants
  const [activeTab, setActiveTab] = useState<'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal'>('register');
  const [raffle, setRaffle] = useState<Raffle>(() => {
    try {
      const saved = localStorage.getItem('sorteio_saved_config');
      const customLogo = localStorage.getItem('sorteio_custom_logo');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...fallbackRaffle,
          ...parsed,
          settings: {
            ...fallbackRaffle.settings,
            ...(parsed.settings || {}),
            logoUrl: customLogo || parsed.settings?.logoUrl || fallbackRaffle.settings.logoUrl,
          },
        };
      }
      if (customLogo) {
        return {
          ...fallbackRaffle,
          settings: {
            ...fallbackRaffle.settings,
            logoUrl: customLogo,
          },
        };
      }
    } catch (e) {
      console.warn('LocalStorage initial state load notice:', e);
    }
    return fallbackRaffle;
  });
  const [participants, setParticipants] = useState<
    Array<{ id: string; ticketNumber: string; name: string; email?: string; emailMasked: string; phone?: string; city: string; registeredAt: string }>
  >([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sorteio_admin_auth') === 'true';
    }
    return false;
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);

  // Active draw suspense states
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingPrize, setDrawingPrize] = useState<Prize | null>(null);
  const [latestWinner, setLatestWinner] = useState<Winner | null>(null);

  // URL Query parameter for ticket redirect
  const [urlTicket, setUrlTicket] = useState<string | null>(null);
  const [selectedLookupTicket, setSelectedLookupTicket] = useState<string>('');
  const [isMobileQRModalOpen, setIsMobileQRModalOpen] = useState(false);
  const [isPrintPosterModalOpen, setIsPrintPosterModalOpen] = useState(false);
  const [serverPublicUrl, setServerPublicUrl] = useState<string>('');

  // Toast indicator for shortcut
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Fetch state from server
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data.raffle) {
          setRaffle((prev) => {
            const saved = localStorage.getItem('sorteio_saved_config');
            const customLogo = localStorage.getItem('sorteio_custom_logo');
            let merged = { ...data.raffle };
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                merged = {
                  ...merged,
                  ...parsed,
                  settings: {
                    ...merged.settings,
                    ...(parsed.settings || {}),
                  },
                };
              } catch {}
            }
            if (customLogo) {
              merged.settings = {
                ...(merged.settings || {}),
                logoUrl: customLogo,
              };
            }
            if (JSON.stringify(prev) === JSON.stringify(merged)) {
              return prev;
            }
            return merged;
          });
        }
        if (Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
        if (typeof data.participantCount === 'number') {
          setParticipantCount(data.participantCount);
        }
        if (data.publicUrl) {
          setServerPublicUrl(data.publicUrl);
        }
      }
    } catch (err) {
      console.warn('Network sync notice:', err);
    }
  }, []);

  // Safe tab switcher that enforces: "só o administrador tem acesso às informações de todo o aplicativo"
  const handleSelectTab = (tab: 'live' | 'register' | 'lookup' | 'admin' | 'stage' | 'portal') => {
    const isRestrictedTab = tab === 'admin' || tab === 'live' || tab === 'stage';
    const isRestrictedMode = raffle.settings?.onlyAdminAccessAll !== false;

    if (isRestrictedTab && isRestrictedMode && !isAdmin) {
      setIsAdminAuthModalOpen(true);
      return;
    }

    setActiveTab(tab);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('sorteio_admin_auth');
    setIsAdmin(false);
    setActiveTab('register');
    setShortcutToast('Sessão do Administrador encerrada. Acesso restrito ativo.');
    setTimeout(() => setShortcutToast(null), 3000);
  };

  // Global Keyboard Shortcut: "Alt" + "c"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        if (!isAdmin) {
          setIsAdminAuthModalOpen(true);
        } else {
          setActiveTab((prev) => {
            const next = prev === 'admin' ? 'register' : 'admin';
            setShortcutToast(next === 'admin' ? 'Abrindo Painel Admin (Alt + C)' : 'Voltando ao Formulário (Alt + C)');
            setTimeout(() => setShortcutToast(null), 2500);
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdmin]);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');
    const tabParam = params.get('tab');
    const portalParam = params.get('portal');

    if (ticketParam) {
      setUrlTicket(ticketParam);
      setSelectedLookupTicket(ticketParam);
      setActiveTab('lookup');
    } else if (tabParam === 'admin') {
      if (localStorage.getItem('sorteio_admin_auth') === 'true') {
        setIsAdmin(true);
        setActiveTab('admin');
      } else {
        setIsAdminAuthModalOpen(true);
      }
    } else if (portalParam === 'participante' || tabParam === 'register' || tabParam === 'portal') {
      setActiveTab('register');
    }
  }, []);

  // Load initial state and setup listeners
  useEffect(() => {
    fetchState();

    const pollInterval = setInterval(fetchState, 4000);

    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/events');

        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
        };

        eventSource.addEventListener('PARTICIPANT_JOINED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setParticipants((prev) => [data, ...prev]);
            setParticipantCount(data.totalParticipants || ((c) => c + 1));
          } catch (err) {
            console.error('SSE PARTICIPANT_JOINED error:', err);
          }
        });

        eventSource.addEventListener('DRAW_ANIMATION_START', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setIsDrawingActive(true);
            setLatestWinner(null);
            setDrawingPrize({
              id: data.prizeId,
              title: data.prizeTitle,
              rank: data.rank,
            });
          } catch (err) {
            console.error('SSE DRAW_ANIMATION_START error:', err);
          }
        });

        eventSource.addEventListener('WINNER_SELECTED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setIsDrawingActive(false);
            setLatestWinner(data.winner);

            setRaffle((prev) => ({
              ...prev,
              status: data.raffleStatus,
              winners: [...prev.winners, data.winner],
            }));
          } catch (err) {
            console.error('SSE WINNER_SELECTED error:', err);
          }
        });

        eventSource.addEventListener('REGISTRATION_TOGGLED', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            setRaffle((prev) => ({ ...prev, allowRegistrations: data.allowRegistrations }));
          } catch (err) {
            console.error('SSE REGISTRATION_TOGGLED error:', err);
          }
        });

        eventSource.addEventListener('WINNERS_RESET', () => {
          setLatestWinner(null);
          setIsDrawingActive(false);
          setRaffle((prev) => ({ ...prev, winners: [], status: 'open' }));
        });

        eventSource.addEventListener('STATE_UPDATED', () => {
          fetchState();
        });
      }
      window.addEventListener('focus', fetchState);
    } catch (err) {
      console.warn('SSE fallback to polling:', err);
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', fetchState);
      if (eventSource) eventSource.close();
    };
  }, [fetchState]);

  const handleRegistered = (newPart: Participant) => {
    fetchState();
    setSelectedLookupTicket(newPart.ticketNumber);
  };

  const handleViewTicket = (ticketNum: string) => {
    setSelectedLookupTicket(ticketNum);
    setActiveTab('lookup');
  };

  // Get theme styling (Background colors)
  const theme = getThemeStyles(raffle.settings);

  // Fullscreen Stage View (Only for admin)
  if (activeTab === 'stage' && isAdmin) {
    return (
      <StageMode
        raffle={raffle}
        participants={participants}
        participantCount={participantCount}
        isDrawingActive={isDrawingActive}
        drawingPrize={drawingPrize}
        latestWinner={latestWinner}
        onExit={() => setActiveTab('admin')}
        onRefresh={fetchState}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.textColorClass} flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-500`}
      style={theme.style}
    >
      {/* Toast alert on keyboard shortcut */}
      {shortcutToast && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-indigo-400/40 animate-bounce">
          <Settings className="w-4 h-4 text-amber-300" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        participantCount={participantCount}
        raffle={raffle}
        onOpenMobileQR={() => setIsMobileQRModalOpen(true)}
        onOpenPrintPoster={() => setIsPrintPosterModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16">
        {/* PUBLIC DEFAULT VIEW: Registration Form */}
        {(activeTab === 'register' || activeTab === 'portal') && (
          <RegistrationForm
            raffle={raffle}
            onRegistered={handleRegistered}
            onViewExistingTicket={handleViewTicket}
            onGoToLive={() => handleSelectTab('live')}
          />
        )}

        {/* ADMIN VIEWS: Protected and accessed only by the administrator */}
        {activeTab === 'live' && isAdmin && (
          <LiveDrawScreen
            raffle={raffle}
            participants={participants}
            participantCount={participantCount}
            activeTicketParam={urlTicket}
            onGoToRegister={() => setActiveTab('register')}
            onGoToLookup={(t) => {
              if (t) setSelectedLookupTicket(t);
              setActiveTab('lookup');
            }}
            isDrawingActive={isDrawingActive}
            drawingPrize={drawingPrize}
            latestWinner={latestWinner}
          />
        )}

        {activeTab === 'lookup' && (
          <TicketLookup
            initialTicket={selectedLookupTicket || urlTicket || ''}
            onGoToLive={() => handleSelectTab('live')}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <ErrorBoundary
            fallbackTitle="Painel do Administrador"
            onReset={fetchState}
          >
            <AdminPanel
              raffle={raffle}
              participants={participants}
              onViewTicket={handleViewTicket}
              onRefreshState={fetchState}
              onClose={() => setActiveTab('register')}
              serverPublicUrl={serverPublicUrl}
              onOpenPrintPoster={() => setIsPrintPosterModalOpen(true)}
            />
          </ErrorBoundary>
        )}
      </main>

      {/* Admin Authentication Modal (PIN) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          setActiveTab('admin');
          setShortcutToast('Bem-vindo, Administrador! Acesso Liberado.');
          setTimeout(() => setShortcutToast(null), 3000);
        }}
      />

      {/* Mobile QR Modal */}
      <MobileJoinQRModal
        isOpen={isMobileQRModalOpen}
        onClose={() => setIsMobileQRModalOpen(false)}
        raffleTitle={raffle.title}
        serverPublicUrl={serverPublicUrl}
        onOpenPrintPoster={() => setIsPrintPosterModalOpen(true)}
      />

      {/* Printable Poster Modal for Paper (A4) */}
      <PrintableQRPosterModal
        isOpen={isPrintPosterModalOpen}
        onClose={() => setIsPrintPosterModalOpen(false)}
        raffle={raffle}
        serverPublicUrl={serverPublicUrl}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 {raffle.settings?.logoText || 'Sorteio'} • {raffle.settings?.organizerName || 'Sistema Oficial de Sorteios com Validação'}
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Inscrição Oficial</span>
            <span>•</span>
            <span>QR Code no Papel</span>
            <span>•</span>
            {isAdmin ? (
              <button
                onClick={() => setActiveTab('admin')}
                className="text-amber-400 font-bold hover:underline"
              >
                Painel do Administrador
              </button>
            ) : (
              <button
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="text-indigo-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                Acesso do Administrador
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
