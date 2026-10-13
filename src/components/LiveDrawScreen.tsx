import React, { useEffect, useState, useRef } from 'react';
import {
  Trophy,
  Gift,
  Users,
  Sparkles,
  Ticket,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Participant, Prize, Raffle, Winner } from '../types.ts';
import { playFanfare, playTickSound, startDrumroll, stopDrumroll } from '../utils/audio.ts';

interface LiveDrawScreenProps {
  raffle: Raffle;
  participants: Array<{ id: string; ticketNumber: string; name: string; emailMasked: string; city: string; registeredAt: string }>;
  participantCount: number;
  activeTicketParam?: string | null;
  onGoToRegister: () => void;
  onGoToLookup: (ticketNum?: string) => void;
  isDrawingActive: boolean;
  drawingPrize: Prize | null;
  latestWinner: Winner | null;
}

export const LiveDrawScreen: React.FC<LiveDrawScreenProps> = ({
  raffle,
  participants,
  participantCount,
  activeTicketParam,
  onGoToRegister,
  onGoToLookup,
  isDrawingActive,
  drawingPrize,
  latestWinner,
}) => {
  // Local roulette display during active drawing
  const [rouletteIndex, setRouletteIndex] = useState(0);
  const [rouletteSpeed, setRouletteSpeed] = useState(50);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isDrawingActive && participants.length > 0) {
      startDrumroll();
      setRouletteSpeed(50);

      const runRoulette = () => {
        setRouletteIndex((prev) => (prev + 1) % participants.length);
        playTickSound();
      };

      timerRef.current = setInterval(runRoulette, 60);

      return () => {
        clearInterval(timerRef.current);
        stopDrumroll();
      };
    } else {
      stopDrumroll();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isDrawingActive, participants.length]);

  // When latest winner appears
  useEffect(() => {
    if (latestWinner) {
      stopDrumroll();
      playFanfare();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  }, [latestWinner]);

  const activeTicketParticipant = activeTicketParam
    ? participants.find((p) => p.ticketNumber.toLowerCase() === activeTicketParam.toLowerCase())
    : null;

  const remainingPrizes = raffle.prizes.filter((p) => !raffle.winners.some((w) => w.prizeId === p.id));
  const nextPrize = remainingPrizes[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* QR Code Redirect Banner if user arrived via scanned QR Code */}
      {activeTicketParam && (
        <div className="bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  QR Code Escaneado com Sucesso!
                </span>
              </div>
              <h3 className="text-lg font-black text-white">
                Bem-vindo ao Sorteio Oficial! Bilhete:{' '}
                <span className="text-amber-400 font-mono tracking-wider">{activeTicketParam}</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {activeTicketParticipant
                  ? `Participante: ${activeTicketParticipant.name} • E-mail Validado`
                  : 'Seu bilhete está registrado na base de dados e concorre a todos os prêmios em tempo real.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onGoToLookup(activeTicketParam)}
            className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-indigo-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Ver Detalhes do Bilhete Completo →
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Base de Dados Conectada em Tempo Real
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {raffle.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              {raffle.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              {raffle.allowRegistrations && (
                <button
                  onClick={onGoToRegister}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Ticket className="w-4 h-4" />
                  Inscrever-se Gratuitamente Agora
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onGoToLookup()}
                className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Consultar Meu Bilhete / QR
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
              <Users className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
              <p className="text-[11px] text-slate-400 font-medium">Inscritos Totais</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{participantCount}</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center">
              <Gift className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <p className="text-[11px] text-slate-400 font-medium">Prêmios Oficiais</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{raffle.prizes.length}</p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
              <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
              <p className="text-[11px] text-slate-400 font-medium">Ganhadores</p>
              <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {raffle.winners.length} / {raffle.prizes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE LIVE DRAW STAGE ANIMATION MODAL / PANEL */}
      {isDrawingActive && (
        <div className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-indigo-500 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden animate-pulse">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
            SORTEIO AO VIVO EM ANDAMENTO
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
            Sorteando:{' '}
            <span className="text-amber-400">
              {drawingPrize ? `${drawingPrize.rank}º Lugar - ${drawingPrize.title}` : 'Próximo Prêmio'}
            </span>
          </h2>
          <p className="text-sm text-slate-300 mb-6">Embaralhando todos os bilhetes únicos validados na base de dados...</p>

          {/* Ticket Roulette Box */}
          <div className="max-w-md mx-auto bg-slate-950 rounded-3xl border-2 border-amber-400/60 p-6 shadow-2xl shadow-amber-500/20 relative">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Bilhete Selecionado no Globo:
            </div>
            {participants.length > 0 ? (
              <div>
                <p className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-wider">
                  {participants[rouletteIndex]?.ticketNumber}
                </p>
                <p className="text-base font-bold text-white mt-2">
                  {participants[rouletteIndex]?.name}
                </p>
                <p className="text-xs text-slate-400">
                  {participants[rouletteIndex]?.city || 'Participante Oficial'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Nenhum participante cadastrado</p>
            )}
          </div>
        </div>
      )}

      {/* LATEST WINNER SHOWCASE */}
      {latestWinner && !isDrawingActive && (
        <div className="bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-purple-600/30 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden backdrop-blur-md">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black bg-amber-500 text-slate-950 uppercase tracking-wider mb-3 shadow-lg shadow-amber-500/30">
            <Trophy className="w-4 h-4" />
            NOVO GANHADOR ACABOU DE SER SORTEADO!
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
            {latestWinner.prizeTitle}
          </h2>

          <div className="my-4 inline-block bg-slate-950/80 px-6 py-3 rounded-2xl border border-amber-500/40">
            <span className="text-xs text-slate-400 block font-semibold uppercase">Bilhete Premiado:</span>
            <span className="font-mono text-3xl font-black text-amber-400 tracking-widest">
              {latestWinner.ticketNumber}
            </span>
          </div>

          <p className="text-xl font-extrabold text-white">{latestWinner.participantName}</p>
          <p className="text-xs text-slate-300 font-mono mt-0.5">E-mail: {latestWinner.participantEmailMasked}</p>
        </div>
      )}

      {/* MAIN TWO-COLUMN CONTENT: WINNERS & PRIZES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Winners Hall of Fame (2 columns wide) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quadro Oficial de Ganhadores</h2>
                <p className="text-xs text-slate-400">Resultados auditados e transmitidos ao vivo</p>
              </div>
            </div>

            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {raffle.winners.length} Sorteado(s)
            </span>
          </div>

          {raffle.winners.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 text-center">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">Nenhum ganhador sorteado ainda</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                O sorteio está aberto para inscrições. Assim que o organizador acionar o sorteio, os resultados
                aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {raffle.winners.map((winner, idx) => (
                <div
                  key={winner.prizeId}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Award className="w-3.5 h-3.5" />
                      {idx + 1}º Sorteado
                    </span>
                    <span className="font-mono text-xs font-black text-indigo-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {winner.ticketNumber}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-300 transition-colors">
                    {winner.prizeTitle}
                  </h3>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{winner.participantName}</p>
                      <p className="text-[11px] font-mono text-slate-400">{winner.participantEmailMasked}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(winner.drawnAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Real-time recent participants stream */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Últimos Participantes com Validação Concluída
              </h3>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Atualização em tempo real
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 divide-y divide-slate-800">
              {participants.slice(0, 6).map((p) => (
                <div key={p.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {p.ticketNumber}
                    </span>
                    <div>
                      <span className="font-medium text-slate-200 block">{p.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{p.emailMasked}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">{p.city || 'Confirmado'}</span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">Validado ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Prizes Catalog */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lista de Prêmios</h2>
                <p className="text-xs text-slate-400">Prêmios configurados na base</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {raffle.prizes.map((prize) => {
              const won = raffle.winners.find((w) => w.prizeId === prize.id);
              return (
                <div
                  key={prize.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    won
                      ? 'bg-slate-950/60 border-slate-800 opacity-80'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          prize.rank === 1
                            ? 'bg-amber-500 text-slate-950'
                            : prize.rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {prize.rank}º
                      </span>
                      <h4 className="font-bold text-white text-sm">{prize.title}</h4>
                    </div>

                    {won ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Sorteado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Disponível
                      </span>
                    )}
                  </div>

                  {prize.description && (
                    <p className="text-xs text-slate-400 mt-2 pl-8">{prize.description}</p>
                  )}

                  {won && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 pl-8 flex items-center justify-between">
                      <span>
                        Ganhador: <strong className="text-white">{won.participantName}</strong>
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{won.ticketNumber}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Official Rules & Contact Configured via Admin */}
          {raffle.settings && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Regulamento Oficial
              </h4>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px]">
                {raffle.settings.rulesText || 'Inscrição única por e-mail com validação em tempo real.'}
              </div>
              {(raffle.settings.contactEmail || raffle.settings.contactPhone) && (
                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  {raffle.settings.contactEmail && (
                    <span>Contato: <strong className="text-slate-300">{raffle.settings.contactEmail}</strong></span>
                  )}
                  {raffle.settings.contactPhone && (
                    <span>WhatsApp: <strong className="text-slate-300">{raffle.settings.contactPhone}</strong></span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
