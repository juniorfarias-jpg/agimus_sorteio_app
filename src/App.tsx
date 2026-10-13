import React, { useEffect, useState, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { LiveDrawScreen } from './components/LiveDrawScreen.tsx';
import { RegistrationForm } from './components/RegistrationForm.tsx';
import { TicketLookup } from './components/TicketLookup.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { StageMode } from './components/StageMode.tsx';
import { Participant, Prize, Raffle, Winner } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'register' | 'lookup' | 'admin' | 'stage'>('live');
  const [raffle, setRaffle] = useState<Raffle | null>(null);
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

  // Fetch initial state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setRaffle(data.raffle);
        setParticipants(data.participants);
        setParticipantCount(data.participantCount);
      }
    } catch (err) {
      console.error('Error fetching raffle state:', err);
    }
  }, []);

  // Parse URL search params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket');
    if (ticketParam) {
      setUrlTicket(ticketParam);
      // Main screen opens and shows the ticket banner as requested!
      setActiveTab('live');
    }
  }, []);

  // Load initial state and setup SSE listener
  useEffect(() => {
    fetchState();

    // Setup SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

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

          setRaffle((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              status: data.raffleStatus,
              winners: [...prev.winners, data.winner],
            };
          });
        } catch (err) {
          console.error('SSE WINNER_SELECTED error:', err);
        }
      });

      eventSource.addEventListener('REGISTRATION_TOGGLED', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          setRaffle((prev) => (prev ? { ...prev, allowRegistrations: data.allowRegistrations } : null));
        } catch (err) {
          console.error('SSE REGISTRATION_TOGGLED error:', err);
        }
      });

      eventSource.addEventListener('WINNERS_RESET', (e: MessageEvent) => {
        try {
          setLatestWinner(null);
          setIsDrawingActive(false);
          setRaffle((prev) => (prev ? { ...prev, winners: [], status: 'open' } : null));
        } catch (err) {
          console.error('SSE WINNERS_RESET error:', err);
        }
      });

      eventSource.addEventListener('STATE_UPDATED', () => {
        fetchState();
      });
    } catch (err) {
      console.warn('SSE not supported or failed to connect:', err);
    }

    // Polling backup
    const interval = setInterval(fetchState, 15000);

    return () => {
      clearInterval(interval);
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

  if (!raffle) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Conectando à base de dados do sorteio...</p>
        </div>
      </div>
    );
  }

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
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        participantCount={participantCount}
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
          <p>© 2026 SorteioLive • Sistema Seguro de Sorteios com Validação Única & QR Code</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Validação por E-mail</span>
            <span>•</span>
            <span>QR Code Redireciona para Tela Principal</span>
            <span>•</span>
            <span>1 Inscrição por Pessoa</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
