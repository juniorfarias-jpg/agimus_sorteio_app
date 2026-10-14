import React, { useRef, useState } from 'react';
import { CheckCircle2, Download, ExternalLink, Copy, Check, Trophy, Sparkles, ShieldCheck, Ticket } from 'lucide-react';
import { Participant, Winner } from '../types.ts';

interface TicketCardProps {
  participant: Participant;
  winnerInfo?: Winner | null;
  onGoToLive?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ participant, winnerInfo, onGoToLive }) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const directUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ticket=${encodeURIComponent(participant.ticketNumber)}`
    : '';

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(participant.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(participant.registeredAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {/* Winner banner if participant won */}
      {winnerInfo && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 animate-bounce">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-200 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-200">Parabéns! Bilhete Premiado!</p>
              <h3 className="font-extrabold text-base leading-snug">{winnerInfo.prizeTitle}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Pass Container */}
      <div
        ref={cardRef}
        className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-white overflow-hidden"
      >
        {/* Ambient glow backgrounds */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              Comprovante Oficial de Inscrição
            </span>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
              Sorteio Oficial <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Inscrição Gravada
          </div>
        </div>

        {/* Ticket Big Number Display */}
        <div className="bg-slate-950/90 rounded-2xl p-5 border border-slate-800 text-center mb-5 shadow-inner">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Ticket className="w-3.5 h-3.5 text-amber-400" />
            Número do Bilhete
          </p>
          <p className="font-mono text-3xl sm:text-4xl font-black text-amber-400 tracking-wider my-2 selection:bg-amber-500">
            {participant.ticketNumber}
          </p>
          <div className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            Salvo na base de dados oficial
          </div>
        </div>

        {/* Participant Details */}
        <div className="space-y-3 text-sm mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Nome do Participante</span>
            <span className="font-bold text-white text-base">{participant.name}</span>
          </div>

          <div className="flex justify-between items-center pt-2.5 border-t border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 block font-medium">E-mail Cadastrado</span>
              <span className="font-mono font-medium text-slate-300 text-xs">{participant.email}</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          {participant.phone && (
            <div className="pt-2.5 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block font-medium">Telefone / WhatsApp</span>
              <span className="text-xs text-slate-300">{participant.phone}</span>
            </div>
          )}

          {participant.city && (
            <div className="pt-2.5 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block font-medium">Cidade / Província / Estado</span>
              <span className="text-xs text-slate-300">{participant.city}</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
            <span>Data da Inscrição:</span>
            <span className="font-medium text-slate-300">{formattedDate}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyTicket}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Nº Bilhete'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Imprimir / Salvar
            </button>
          </div>

          {onGoToLive && (
            <button
              onClick={onGoToLive}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-1"
            >
              <ExternalLink className="w-4 h-4" />
              Acompanhar o Sorteio Ao Vivo no Telão →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
