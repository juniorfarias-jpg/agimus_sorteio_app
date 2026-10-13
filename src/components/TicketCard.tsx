import React, { useRef } from 'react';
import { CheckCircle2, QrCode, Download, ExternalLink, Copy, Check, Trophy, Sparkles, ShieldCheck } from 'lucide-react';
import { Participant, Winner } from '../types.ts';

interface TicketCardProps {
  participant: Participant;
  winnerInfo?: Winner | null;
  onGoToLive?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ participant, winnerInfo, onGoToLive }) => {
  const [copied, setCopied] = React.useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const directUrl = `${window.location.origin}/?ticket=${encodeURIComponent(participant.ticketNumber)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintOrDownload = () => {
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
    <div className="w-full max-w-md mx-auto">
      {/* Winner banner if participant won */}
      {winnerInfo && (
        <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 animate-bounce">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-200" />
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
        className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 p-6 shadow-2xl text-white overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
              Bilhete Oficial de Participação
            </span>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              SorteioLive <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Validado por E-mail
          </div>
        </div>

        {/* Ticket Big Number */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 text-center mb-5">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Número do Bilhete</p>
          <p className="font-mono text-3xl font-black text-amber-400 tracking-wider my-1 selection:bg-amber-500">
            {participant.ticketNumber}
          </p>
          <p className="text-[11px] text-slate-500">Inscrição única e intransferível</p>
        </div>

        {/* Participant Details */}
        <div className="space-y-3 text-sm mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Nome do Participante</span>
            <span className="font-semibold text-white text-base">{participant.name}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400 block font-medium">E-mail Validado</span>
              <span className="font-medium text-slate-300 text-xs font-mono">{participant.email}</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          {participant.phone && (
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 block font-medium">Telefone / Contato</span>
              <span className="text-xs text-slate-300">{participant.phone}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
            <span>Inscrito em:</span>
            <span className="font-medium text-slate-300">{formattedDate}</span>
          </div>
        </div>

        {/* Ticket Cutout Line */}
        <div className="relative my-6 -mx-6 flex items-center justify-between">
          <div className="w-5 h-8 bg-slate-950 rounded-r-full border-r border-t border-b border-slate-800" />
          <div className="flex-1 border-b-2 border-dashed border-slate-700 mx-2" />
          <div className="w-5 h-8 bg-slate-950 rounded-l-full border-l border-t border-b border-slate-800" />
        </div>

        {/* Individual QR Code Section */}
        <div className="text-center pt-2">
          <div className="inline-block p-3 rounded-2xl bg-white shadow-xl shadow-indigo-950/50 mb-3 border-2 border-indigo-200">
            {participant.qrCodeDataUrl ? (
              <img
                src={participant.qrCodeDataUrl}
                alt={`QR Code para ${participant.ticketNumber}`}
                className="w-48 h-48 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400">
                <QrCode className="w-16 h-16 animate-pulse" />
              </div>
            )}
          </div>

          <p className="text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            QR Code Individual de Acesso
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            Aponte a câmera do celular para abrir diretamente a tela principal e acompanhar o sorteio ao vivo!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2.5">
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Tela Principal pelo Link do QR Code
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>

            <button
              onClick={handlePrintOrDownload}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimir / Salvar
            </button>
          </div>

          {onGoToLive && (
            <button
              onClick={onGoToLive}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 transition-colors text-center"
            >
              ← Voltar e acompanhar apuração em tempo real
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
