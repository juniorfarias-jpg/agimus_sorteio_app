import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Gift, Users, Maximize, Minimize, Play, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Prize, Raffle, Winner } from '../types.ts';
import { getMuted, playFanfare, playTickSound, setMuted, startDrumroll, stopDrumroll } from '../utils/audio.ts';

interface StageModeProps {
  raffle: Raffle;
  participants: Array<{ id: string; ticketNumber: string; name: string; emailMasked: string; city: string; registeredAt: string }>;
  participantCount: number;
  isDrawingActive: boolean;
  drawingPrize: Prize | null;
  latestWinner: Winner | null;
  onExit: () => void;
  onRefresh: () => void;
}

export const StageMode: React.FC<StageModeProps> = ({
  raffle,
  participants,
  participantCount,
  isDrawingActive,
  drawingPrize,
  latestWinner,
  onExit,
  onRefresh,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMutedState] = useState(getMuted());
  const [localIndex, setLocalIndex] = useState(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleSound = () => {
    const s = !muted;
    setMuted(s);
    setMutedState(s);
  };

  // Roulette animation
  useEffect(() => {
    let interval: any = null;
    if (isDrawingActive && participants.length > 0) {
      startDrumroll();
      interval = setInterval(() => {
        setLocalIndex((prev) => (prev + 1) % participants.length);
        playTickSound();
      }, 55);
    } else {
      stopDrumroll();
    }
    return () => {
      if (interval) clearInterval(interval);
      stopDrumroll();
    };
  }, [isDrawingActive, participants.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden select-none">
      {/* Background ambient stage lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* Top stage bar */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{raffle.title}</h1>
            <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
              Transmissão Oficial de Apuração • Ao Vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-sm">
            <Users className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">Total de Concorrentes:</span>
            <span className="font-mono font-black text-amber-400 text-lg">{participantCount}</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {muted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={onExit}
            className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Sair do Telão
          </button>
        </div>
      </div>

      {/* Stage Central Screen */}
      <div className="relative z-10 my-auto py-8 text-center max-w-4xl mx-auto w-full">
        {isDrawingActive ? (
          /* ACTIVE SUSPENSE DRAW */
          <div className="bg-slate-900/90 border-4 border-amber-400 rounded-3xl p-8 sm:p-14 shadow-2xl shadow-amber-500/20 backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-black bg-rose-500 text-white uppercase tracking-widest mb-6 animate-pulse">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              SORTEANDO AO VIVO NO TELÃO
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-300">
              Prêmio:{' '}
              <span className="text-amber-400">
                {drawingPrize ? `${drawingPrize.rank}º Lugar - ${drawingPrize.title}` : 'Próximo Prêmio'}
              </span>
            </h2>

            {/* Huge animated ticket box */}
            <div className="my-8 py-8 px-6 bg-slate-950 rounded-3xl border-2 border-indigo-500 shadow-inner">
              <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                Bilhete em Disputa no Globo
              </p>
              <p className="font-mono text-5xl sm:text-7xl font-black text-amber-400 tracking-wider">
                {participants[localIndex]?.ticketNumber || 'SOR-00000'}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
                {participants[localIndex]?.name || 'Participante'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {participants[localIndex]?.city || 'Inscrição Verificada'}
              </p>
            </div>
          </div>
        ) : latestWinner ? (
          /* WINNER DISPLAYED ON STAGE */
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-4 border-amber-400 rounded-3xl p-8 sm:p-14 shadow-2xl shadow-amber-500/30 backdrop-blur-xl animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-black bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 uppercase tracking-widest mb-4 shadow-xl">
              <Trophy className="w-5 h-5 text-slate-950" />
              TEMOS UM GANHADOR OFICIAL!
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 leading-tight">
              {latestWinner.prizeTitle}
            </h2>

            <div className="my-8 py-6 px-10 bg-slate-950 rounded-3xl border-2 border-amber-500/60 inline-block shadow-2xl">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">
                Número do Bilhete Sorteado
              </span>
              <span className="font-mono text-5xl sm:text-7xl font-black text-amber-400 tracking-widest">
                {latestWinner.ticketNumber}
              </span>
            </div>

            <p className="text-3xl sm:text-4xl font-extrabold text-white">{latestWinner.participantName}</p>
            <p className="text-base text-slate-300 font-mono mt-1">E-mail: {latestWinner.participantEmailMasked}</p>
          </div>
        ) : (
          /* IDLE / WAITING STAGE */
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-14 backdrop-blur-md">
            <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl sm:text-4xl font-black text-white">Palco de Sorteios em Tempo Real</h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto mt-2">
              Conectado ao servidor oficial. Quando o sorteio for acionado pelo organizador, a roleta ao vivo será exibida
              neste telão automaticamente com efeitos sonoros e confetes!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Stage Ticker: Recent winners */}
      <div className="relative z-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase">
          <Trophy className="w-4 h-4 text-amber-400" />
          Ganhadores Confirmados:
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {raffle.winners.length === 0 ? (
            <span className="text-slate-500">Nenhum ganhador sorteado ainda.</span>
          ) : (
            raffle.winners.map((w) => (
              <span
                key={w.prizeId}
                className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-200 flex items-center gap-2"
              >
                <span className="font-mono font-bold text-amber-400">{w.ticketNumber}</span>
                <span className="font-semibold text-white">{w.participantName}</span>
                <span className="text-slate-400">({w.prizeTitle})</span>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
