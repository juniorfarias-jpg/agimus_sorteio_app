import React, { useState, useEffect } from 'react';
import { Search, Ticket, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { Participant, Winner } from '../types.ts';
import { TicketCard } from './TicketCard.tsx';

interface TicketLookupProps {
  initialTicket?: string;
  onGoToLive: () => void;
}

export const TicketLookup: React.FC<TicketLookupProps> = ({ initialTicket, onGoToLive }) => {
  const [query, setQuery] = useState(initialTicket || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [winnerInfo, setWinnerInfo] = useState<Winner | null>(null);

  const fetchTicket = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setParticipant(null);
    setWinnerInfo(null);

    try {
      const res = await fetch(`/api/ticket/${encodeURIComponent(searchTerm.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Nenhum bilhete encontrado com esta identificação.');
        return;
      }
      setParticipant(data.participant);
      setWinnerInfo(data.prizeWon || null);
    } catch {
      setErrorMsg('Erro ao consultar servidor. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicket) {
      setQuery(initialTicket);
      fetchTicket(initialTicket);
    }
  }, [initialTicket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTicket(query);
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/10">
          <Ticket className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Consultar Bilhete & QR Code</h1>
        <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
          Digite o número do seu bilhete (ex: <code className="text-amber-400 font-mono">SOR-10842</code>) ou seu e-mail
          para visualizar seu QR Code oficial e checar se foi premiado.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-8 shadow-xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Número do bilhete ou seu e-mail"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 text-white rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-slate-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar Bilhete'}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Ticket Result Display */}
      {participant && (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bilhete Oficial Autenticado na Base de Dados</span>
            </div>
            <span className="font-mono font-bold text-emerald-400">{participant.ticketNumber}</span>
          </div>

          <TicketCard participant={participant} winnerInfo={winnerInfo} onGoToLive={onGoToLive} />
        </div>
      )}
    </div>
  );
};
