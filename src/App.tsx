import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { LiveDrawScreen } from './components/LiveDrawScreen.tsx';
import { RegistrationForm } from './components/RegistrationForm.tsx';
import { TicketLookup } from './components/TicketLookup.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { StageMode } from './components/StageMode.tsx';
import { Participant, Prize, Raffle, Winner } from './types.ts';
import { Settings } from 'lucide-react';

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
    rulesText: '1. Cada participante tem direito a 1 (um) único bilhete validado por e-mail.\n2. O QR Code gerado é o comprovante oficial de participação.\n3. O sorteio é realizado ao vivo com transparência pública auditável.',
    requirePhone: false,
    requireCity: false,
    maxParticipants: 0,
    codeExpirationMinutes: 10,
    soundEnabledByDefault: true,
    adminPin: '1234',
    announcementBanner: '🎉 Grande Sorteio Oficial em Andamento! Cadastre-se e acompanhe os resultados ao vivo.',
    showAnnouncement: true,
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'register' | 'lookup' | 'admin' | 'stage'>('live');
  const [raffle, setRaffle] = useState<Raffle>(fallbackRaffle);
  const [participants, setParticipants] = useState<
    Array<{ id: string; ticketNumber: string; name: string; emailMasked: string; city: string; registeredAt: string }>
  >([]);
  const [participantCount, setParticipantCount] = useState(0);

  // Active draw suspense states
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [drawingPrize, setDrawingPrize] = useState<Prize | null>(null);
  const [latestWinner, setLatestWinner] = useState<Winner | null>(null);

  // URL Query parameter for ticket redirect
  const [urlTicket, setUrlTicket] = useState<string | null>(null);
  const [selectedLookupTicket, setSelectedLookupTicket] = useState<string>('');

  // Toast indicator for shortcut
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  // Fetch state from server
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (data.raffle) {
          setRaffle(data.raffle);
        }
        if (Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
        if (typeof data.participantCount === 'number') {
          setParticipantCount(data.participantCount);
        }
      }
    } catch (err) {
      console.warn('Network sync notice:', err);
    }
  }, []);

  // Global Keyboard Shortcut: "Alt" + "c"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC')) {
        e.preventDefault();
        setActiveTab((prev) => {
          const next = prev === 'admin' ? 'live' : 'admin';
          setShortcutToast(next === 'admin' ? 'Abrindo Painel Admin (Alt + C)' : 'Voltando à Tela Principal (Alt + C)');
          setTimeout(() => setShortcutToast(null), 2500);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');
    if (ticketParam) {
      setUrlTicket(ticketParam);
      setActiveTab('live');
    }
  }, []);

  // Load initial state and setup listeners
  useEffect(() => {
    fetchState();

    // 4-second short polling ensures reliable real-time updates across any proxy
    const pollInterval = setInterval(fetchState, 4000);

    // Setup SSE connection with defensive error handling
    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/events');

        eventSource.onerror = () => {
          // Gracefully fallback to polling without locking the UI
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
    } catch (err) {
      console.warn('SSE fallback to polling:', err);
    }

    return () => {
      clearInterval(pollInterval);
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

  // Fullscreen Stage View
  if (activeTab === 'stage') {
    return (
      <StageMode
        raffle={raffle}
        participants={participants}
        participantCount={participantCount}
        isDrawingActive={isDrawingActive}
        drawingPrize={drawingPrize}
        latestWinner={latestWinner}
        onExit={() => setActiveTab('live')}
        onRefresh={fetchState}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast alert on keyboard shortcut */}
      {shortcutToast && (
        <div className="fixed top-20 right-6 z-50 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 border border-indigo-400/40 animate-bounce">
          <Settings className="w-4 h-4 text-amber-300" />
          <span>{shortcutToast}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participantCount={participantCount}
        raffle={raffle}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16">
        {activeTab === 'live' && (
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

        {activeTab === 'register' && (
          <RegistrationForm
            raffle={raffle}
            onRegistered={handleRegistered}
            onViewExistingTicket={handleViewTicket}
            onGoToLive={() => setActiveTab('live')}
          />
        )}

        {activeTab === 'lookup' && (
          <TicketLookup
            initialTicket={selectedLookupTicket || urlTicket || ''}
            onGoToLive={() => setActiveTab('live')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            raffle={raffle}
            participants={participants}
            onViewTicket={handleViewTicket}
            onRefreshState={fetchState}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 SorteioLive • {raffle.settings?.organizerName || 'Sistema Seguro de Sorteios com Validação Única & QR Code'}</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Atalho Admin: <kbd className="font-mono text-amber-300 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">Alt + C</kbd></span>
            <span>•</span>
            <span>Validação por E-mail</span>
            <span>•</span>
            <span>QR Code Oficial</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
