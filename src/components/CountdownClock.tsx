import React, { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, Sparkles, AlertCircle, Radio } from 'lucide-react';

interface CountdownClockProps {
  drawDate?: string;
  drawTime?: string;
  drawDateTime?: string;
  drawTimezone?: string;
  drawLocation?: string;
  title?: string;
  customMessage?: string;
  variant?: 'hero' | 'compact' | 'card' | 'banner';
  showCalendarBadge?: boolean;
  className?: string;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function formatDrawDateHuman(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return 'Data a ser anunciada';

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return `${dateStr} ${timeStr || ''}`;

    const dateObj = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    const formattedDate = dateObj.toLocaleDateString('pt-BR', options);
    // Capitalize first letter
    const capitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    return `${capitalized}${timeStr ? ` às ${timeStr}` : ''}`;
  } catch {
    return `${dateStr} às ${timeStr || '20:00'}`;
  }
}

export const CountdownClock: React.FC<CountdownClockProps> = ({
  drawDate = '2026-05-15',
  drawTime = '20:00',
  drawDateTime,
  drawTimezone = 'Horário Oficial',
  drawLocation = 'Transmissão Ao Vivo',
  title = 'Contagem Regressiva para o Sorteio',
  customMessage,
  variant = 'card',
  showCalendarBadge = true,
  className = '',
}) => {
  const calculateRemaining = (): TimeRemaining => {
    // Determine target timestamp
    let targetMs: number;

    if (drawDateTime) {
      targetMs = new Date(drawDateTime).getTime();
    } else if (drawDate) {
      const time = drawTime || '20:00';
      targetMs = new Date(`${drawDate}T${time}:00`).getTime();
    } else {
      // Default: in 7 days
      targetMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    if (isNaN(targetMs)) {
      targetMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }

    const now = Date.now();
    const diff = targetMs - now;

    if (diff <= 0) {
      return {
        totalMs: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return {
      totalMs: diff,
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  };

  const [remaining, setRemaining] = useState<TimeRemaining>(calculateRemaining);

  useEffect(() => {
    // Initial compute
    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setRemaining(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [drawDate, drawTime, drawDateTime]);

  const padZero = (n: number) => String(n).padStart(2, '0');
  const humanDate = formatDrawDateHuman(drawDate, drawTime);

  // Compact Variant (e.g. for header bar or ticker)
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs shadow-md ${className}`}>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold shrink-0">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>Sorteio:</span>
        </div>
        {remaining.isExpired ? (
          <span className="text-emerald-400 font-black flex items-center gap-1">
            <Radio className="w-3 h-3 animate-ping text-rose-500" />
            AO VIVO AGORA!
          </span>
        ) : (
          <div className="flex items-center gap-1 font-mono font-black text-white">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">{remaining.days}d</span>
            <span>:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded">{padZero(remaining.hours)}h</span>
            <span>:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded">{padZero(remaining.minutes)}m</span>
            <span>:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-rose-400">{padZero(remaining.seconds)}s</span>
          </div>
        )}
      </div>
    );
  }

  // Hero / Card Variant
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-indigo-950/80 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all ${className}`}
    >
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Calendar Date */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-1.5">
              {title}
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h3>
            {showCalendarBadge && (
              <p className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{humanDate}</span>
                {drawTimezone && <span className="text-[10px] text-slate-400">({drawTimezone})</span>}
              </p>
            )}
          </div>
        </div>

        {drawLocation && (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] text-slate-300 font-semibold self-start sm:self-auto">
            <MapPin className="w-3 h-3 text-indigo-400" />
            <span>{drawLocation}</span>
          </div>
        )}
      </div>

      {/* Countdown Digits Grid */}
      <div className="relative z-10 pt-4">
        {remaining.isExpired ? (
          <div className="text-center py-4 px-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Sorteio Oficial Iniciado
            </div>
            <p className="text-base sm:text-lg font-black text-white">
              {customMessage || '🎉 O sorteio está acontecendo ao vivo agora! Acompanhe os contemplados.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            {/* Days */}
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 shadow-inner flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                {padZero(remaining.days)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                {remaining.days === 1 ? 'Dia' : 'Dias'}
              </span>
            </div>

            {/* Hours */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-inner flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {padZero(remaining.hours)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                Horas
              </span>
            </div>

            {/* Minutes */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-inner flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {padZero(remaining.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                Minutos
              </span>
            </div>

            {/* Seconds */}
            <div className="bg-slate-950/90 border border-rose-500/30 rounded-2xl p-2.5 sm:p-3 shadow-inner flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-4xl font-black text-rose-400 font-mono tracking-tight animate-pulse">
                {padZero(remaining.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-300 mt-1">
                Segundos
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
