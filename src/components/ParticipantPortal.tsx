import React, { useState } from 'react';
import { Ticket, Trophy, Search, CheckCircle2, Sparkles, Gift, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { Participant, Raffle, Winner } from '../types.ts';
import { RegistrationForm } from './RegistrationForm.tsx';
import { TicketCard } from './TicketCard.tsx';

interface ParticipantPortalProps {
  raffle: Raffle;
  onRegistered: (participant: Participant) => void;
  onViewExistingTicket: (ticketNum: string) => void;
  onGoToLive: () => void;
}

export const ParticipantPortal: React.FC<ParticipantPortalProps> = ({
  raffle,
  onRegistered,
  onViewExistingTicket,
  onGoToLive,
}) => {
  const [viewMode, setViewMode] = useState<'register' | 'winners'>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [queriedTicket, setQueriedTicket] = useState<Participant | null>(null);
  const [queriedWinner, setQueriedWinner] = useState<Winner | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setQueryError(null);
    setQueriedTicket(null);
    setQueriedWinner(null);

    try {
      const res = await fetch(`/api/ticket/${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setQueryError(data.error || 'Nenhum bilhete encontrado com estes dados.');
        return;
      }
      setQueriedTicket(data.participant);
      setQueriedWinner(data.prizeWon || null);
    } catch {
      setQueryError('Erro ao consultar o servidor.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6">
      {/* View Switcher only if viewing winners or explicitly wanting to check */}
      {viewMode === 'winners' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Consulta de Ganhadores & Bilhetes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifique se o seu bilhete foi contemplado no sorteio
              </p>
            </div>
            <button
              onClick={() => setViewMode('register')}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Ticket className="w-4 h-4" />
              Voltar à Inscrição
            </button>
          </div>

          {/* Quick Ticket Checker */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              Verificar se seu Bilhete foi Premiado
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Digite o número do seu bilhete (ex: <code className="text-amber-300 font-mono">SOR-10842</code>) ou seu e-mail cadastrado:
            </p>

            <form onSubmit={handleSearchTicket} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Número do bilhete ou e-mail"
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSearching ? 'Consultando...' : 'Consultar'}
              </button>
            </form>

            {queryError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {queryError}
              </div>
            )}

            {queriedTicket && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <TicketCard participant={queriedTicket} winnerInfo={queriedWinner} onGoToLive={onGoToLive} />
              </div>
            )}
          </div>

          {/* Official Winners List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Ganhadores Oficiais</h2>
                  <p className="text-[11px] text-slate-400">Resultados apurados na base de dados</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                {raffle.winners.length} Sorteado(s)
              </span>
            </div>

            {raffle.winners.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-950 rounded-2xl border border-slate-800 p-6">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">Nenhum prêmio foi sorteado ainda.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  As inscrições estão abertas! Assim que a apuração for realizada, os ganhadores aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {raffle.winners.map((winner, idx) => (
                  <div
                    key={winner.prizeId}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mb-1">
                          <Award className="w-3 h-3" />
                          {idx + 1}º Sorteado
                        </span>
                        <h4 className="font-bold text-white text-sm">{winner.prizeTitle}</h4>
                        <p className="text-xs text-slate-300 mt-1 font-semibold">{winner.participantName}</p>
                        <p className="text-[11px] font-mono text-slate-400">{winner.participantEmailMasked}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-sm font-black text-amber-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 block">
                          {winner.ticketNumber}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(winner.drawnAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PURE REGISTRATION FORM VIEW */
        <div className="animate-fade-in">
          <RegistrationForm
            raffle={raffle}
            onRegistered={onRegistered}
            onViewExistingTicket={onViewExistingTicket}
            onGoToLive={onGoToLive}
          />

          {/* Quick toggle to consult winners if desired */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setViewMode('winners')}
              className="text-xs text-amber-400/90 hover:text-amber-300 font-semibold py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Consultar lista de ganhadores do prêmio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
