import React, { useState } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Loader2,
  Sparkles,
  Ticket,
  Gift,
  Trophy,
  RefreshCw,
  Calendar,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Participant, Raffle } from '../types.ts';
import { TicketCard } from './TicketCard.tsx';
import { AppLogo } from '../utils/theme.tsx';
import { CountdownClock } from './CountdownClock.tsx';

interface RegistrationFormProps {
  raffle: Raffle;
  onRegistered: (participant: Participant) => void;
  onGoToLive?: () => void;
  onViewExistingTicket: (ticketNumOrEmail: string) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  raffle,
  onRegistered,
  onGoToLive,
  onViewExistingTicket,
}) => {
  // Input fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  // Status & feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [alreadyRegisteredTicket, setAlreadyRegisteredTicket] = useState<string | null>(null);
  const [registeredParticipant, setRegisteredParticipant] = useState<Participant | null>(null);

  const isRegistrationOpen = raffle.allowRegistrations && raffle.status !== 'completed';
  const settings = raffle.settings || ({} as any);

  // Logo configuration (Onde está escrito Sorteio)
  const logoUrl = settings.logoUrl || '';
  const logoText = settings.logoText || 'Sorteio';
  const showLogo = settings.showLogo !== false;

  // Visibility toggles to allow removing unwanted elements ("Remover isto que está selecionado")
  const showFormBadge = settings.showFormBadge !== false;
  const showFormDescription = settings.showFormDescription !== false;
  const showPrizesPreview = settings.showPrizesPreview !== false;
  const showInfoIndicators = settings.showInfoIndicators !== false;
  const showCardTag = settings.showCardTag !== false;
  const showRulesSection = settings.showRulesSection !== false;

  // Field configurations from Settings (customizable by Admin)
  const badgeText = settings.formBadgeText || 'Inscrição Oficial para o Sorteio';
  const cardTitle = settings.formCardTitle || 'Formulário de Inscrição';
  const cardSubtitle = settings.formCardSubtitle || 'Insira os dados solicitados pela organização para emitir seu bilhete';
  const cardTag = settings.formCardTag || 'Inscrição Direta';

  const nameLabel = settings.formNameLabel || 'Nome Completo';
  const namePlaceholder = settings.formNamePlaceholder || 'Ex: Maria dos Santos Silva';

  const emailLabel = settings.formEmailLabel || 'E-mail';
  const emailPlaceholder = settings.formEmailPlaceholder || 'Ex: seu.nome@gmail.com';
  const emailHelpText = settings.formEmailHelpText || 'Inscrição direta sem código de validação por e-mail.';

  const enablePhone = settings.formEnablePhone !== false;
  const requirePhone = !!settings.requirePhone;
  const phoneLabel = settings.formPhoneLabel || 'Telefone / WhatsApp';
  const phonePlaceholder = settings.formPhonePlaceholder || 'Ex: (11) 98765-4321 ou +244 9...';

  const enableCity = settings.formEnableCity !== false;
  const requireCity = !!settings.requireCity;
  const cityLabel = settings.formCityLabel || 'Cidade / Província / Estado';
  const cityPlaceholder = settings.formCityPlaceholder || 'Ex: São Paulo - SP ou Luanda';

  const submitButtonText = settings.formSubmitButtonText || 'Confirmar Inscrição no Sorteio';
  const rulesTitle = settings.rulesTitle || 'Regulamento do Sorteio';
  const rulesText = settings.rulesText || '';
  const showCheckTicketLink = settings.showCheckTicketLink !== false;
  const checkTicketText = settings.checkTicketText || 'Consultar meu bilhete';

  // Calendário e Relógio de Contagem Regressiva
  const showCountdownTimer = settings.showCountdownTimer !== false;
  const showDrawCalendar = settings.showDrawCalendar !== false;
  const drawDate = settings.drawDate || '2026-05-15';
  const drawTime = settings.drawTime || '20:00';
  const drawDateTime = settings.drawDateTime;
  const drawLocation = settings.drawLocation || 'Transmissão Ao Vivo Oficial';
  const drawTimezone = settings.drawTimezone || 'Horário Oficial';
  const countdownTitle = settings.countdownTitle || 'Contagem Regressiva para o Sorteio';
  const countdownMessage = settings.countdownMessage || '🎉 O Sorteio está acontecendo agora ao vivo!';

  const playSuccessChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.1);
        osc.stop(audioCtx.currentTime + i * 0.1 + 0.35);
      });
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAlreadyRegisteredTicket(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCity = city.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Por favor, informe seu nome completo (mínimo de 2 caracteres).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Por favor, informe um endereço de e-mail válido (ex: seu.nome@exemplo.com).');
      return;
    }

    if (enablePhone && requirePhone && !cleanPhone) {
      setErrorMsg(`O campo "${phoneLabel}" é obrigatório para participar deste sorteio.`);
      return;
    }

    if (enableCity && requireCity && !cleanCity) {
      setErrorMsg(`O campo "${cityLabel}" é obrigatório para participar deste sorteio.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: enablePhone && cleanPhone ? cleanPhone : undefined,
          city: enableCity && cleanCity ? cleanCity : undefined,
          raffleId: raffle.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.ticketNumber) {
          setAlreadyRegisteredTicket(data.ticketNumber);
        }
        setErrorMsg(data.error || 'Erro ao realizar a inscrição no servidor.');
        return;
      }

      playSuccessChime();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });

      setRegisteredParticipant(data.participant);
      onRegistered(data.participant);
    } catch (err) {
      console.error('Falha de conexão com a base de dados:', err);
      setErrorMsg(
        'Não foi possível salvar sua inscrição no servidor central. Verifique sua conexão com a internet e clique em "Tentar Novamente". A inscrição só é válida após confirmação na base de dados.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (registeredParticipant) {
    return (
      <div className="py-6 px-4 animate-fade-in">
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Inscrição Confirmada!</h2>
          <p className="text-sm text-slate-300 mt-1.5">
            Seu bilhete oficial foi registrado com sucesso na base de dados central.
          </p>
        </div>

        <TicketCard participant={registeredParticipant} onGoToLive={onGoToLive} />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-6 px-4">
      {/* Raffle Info Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 mb-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/15 via-rose-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Logo Onde está escrito Sorteio */}
        {showLogo && (
          <div className="mb-4 pb-3 border-b border-slate-800/80">
            <AppLogo logoUrl={logoUrl} logoText={logoText} size="md" subtitle={settings.organizerName} />
          </div>
        )}

        {showFormBadge && badgeText && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {badgeText}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
          {raffle.title}
        </h1>

        {showFormDescription && raffle.description && (
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {raffle.description}
          </p>
        )}

        {/* Prizes preview banner */}
        {showPrizesPreview && raffle.prizes && raffle.prizes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5" />
                Prêmios em Disputa ({raffle.prizes.reduce((sum, p) => sum + (p.quantity || 1), 0)} itens no total):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {raffle.prizes.map((p) => {
                const qty = typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1;
                return (
                  <div
                    key={p.id}
                    className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] flex items-center justify-center shrink-0">
                      {p.rank}º
                    </span>
                    <span className="font-semibold text-white">{p.title}</span>
                    <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] border border-amber-500/30 shrink-0">
                      Qtd: {qty}
                    </span>
                    {p.estimatedValue && (
                      <span className="text-[10px] text-emerald-400 font-mono">({p.estimatedValue})</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info indicators */}
        {showInfoIndicators && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>1 Inscrição por E-mail</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
              <Ticket className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Bilhete Numerado</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Sorteio Auditável</span>
            </div>
          </div>
        )}
      </div>

      {/* Relógio de Tempo / Contagem Regressiva para o Sorteio */}
      {showCountdownTimer && (
        <div className="mb-6">
          <CountdownClock
            drawDate={drawDate}
            drawTime={drawTime}
            drawDateTime={drawDateTime}
            drawLocation={drawLocation}
            drawTimezone={drawTimezone}
            title={countdownTitle}
            customMessage={countdownMessage}
            showCalendarBadge={showDrawCalendar}
            variant="card"
          />
        </div>
      )}

      {/* Main Registration Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-400" />
              {cardTitle}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {cardSubtitle}
            </p>
          </div>

          {showCardTag && cardTag && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {cardTag}
            </span>
          )}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
            {alreadyRegisteredTicket && (
              <button
                type="button"
                onClick={() => onViewExistingTicket(alreadyRegisteredTicket)}
                className="mt-2 w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors text-center cursor-pointer shadow-md"
              >
                Acessar Meu Bilhete Cadastrado ({alreadyRegisteredTicket}) →
              </button>
            )}
          </div>
        )}

        {!isRegistrationOpen ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Inscrições Encerradas</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              As inscrições para este sorteio foram pausadas ou encerradas pela organização. Acompanhe o sorteio ao vivo!
            </p>
            <button
              type="button"
              onClick={onGoToLive}
              className="mt-5 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Ver Sorteio Ao Vivo →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field: Full Name (Required) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {nameLabel} <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">obrigatório</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={namePlaceholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Field: Email (Required, no verification code needed) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {emailLabel} <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">para contato e premiação</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={emailPlaceholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              {emailHelpText && (
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  {emailHelpText}
                </p>
              )}
            </div>

            {/* Field: Phone / WhatsApp (Requested by Admin) */}
            {enablePhone && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    {phoneLabel} {requirePhone && <span className="text-rose-400">*</span>}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      requirePhone
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {requirePhone ? 'Obrigatório' : 'Opcional'}
                  </span>
                </label>
                <input
                  type="tel"
                  required={requirePhone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={phonePlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Field: City / Location (Requested by Admin) */}
            {enableCity && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {cityLabel} {requireCity && <span className="text-rose-400">*</span>}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      requireCity
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {requireCity ? 'Obrigatório' : 'Opcional'}
                  </span>
                </label>
                <input
                  type="text"
                  required={requireCity}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={cityPlaceholder}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            )}

            {/* Rules Text if configured */}
            {showRulesSection && rulesText && (
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300 block mb-0.5">{rulesTitle}:</span>
                <p className="whitespace-pre-line">{rulesText}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gravando Inscrição na Base de Dados...
                  </>
                ) : (
                  <>
                    <span>{submitButtonText}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing ticket check option */}
        {showCheckTicketLink && (
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Já realizou sua inscrição anteriormente?{' '}
              <button
                type="button"
                onClick={() => {
                  const search = prompt('Digite seu e-mail ou número de bilhete:');
                  if (search) onViewExistingTicket(search.trim());
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1 cursor-pointer"
              >
                {checkTicketText}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
