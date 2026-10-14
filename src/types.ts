export interface Prize {
  id: string;
  rank: number;
  title: string;
  description?: string;
  estimatedValue?: string;
  quantity?: number; // Quantidade de unidades deste prêmio em disputa
}

export interface Winner {
  prizeId: string;
  prizeTitle: string;
  participantId: string;
  participantName: string;
  participantEmail?: string;
  participantEmailMasked: string;
  ticketNumber: string;
  drawnAt: string;
}

export interface Participant {
  id: string;
  raffleId: string;
  ticketNumber: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  registeredAt: string;
  verifiedAt: string;
  qrCodeDataUrl?: string;
}

export interface AppSettings {
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  rulesText: string;
  requirePhone: boolean;
  requireCity: boolean;
  maxParticipants: number; // 0 = unlimited
  codeExpirationMinutes: number;
  soundEnabledByDefault: boolean;
  adminPin: string;
  announcementBanner: string;
  showAnnouncement: boolean;

  // Campos customizáveis do formulário de inscrição
  formBadgeText?: string;
  formCardTitle?: string;
  formCardSubtitle?: string;
  formCardTag?: string;
  formNameLabel?: string;
  formNamePlaceholder?: string;
  formEmailLabel?: string;
  formEmailPlaceholder?: string;
  formEmailHelpText?: string;
  formEnablePhone?: boolean;
  formPhoneLabel?: string;
  formPhonePlaceholder?: string;
  formEnableCity?: boolean;
  formCityLabel?: string;
  formCityPlaceholder?: string;
  formSubmitButtonText?: string;
  rulesTitle?: string;
  showCheckTicketLink?: boolean;
  checkTicketText?: string;
  customPublicUrl?: string;

  // Personalização de Logo (Onde está escrito Sorteio)
  logoUrl?: string;
  logoText?: string;
  showLogo?: boolean;

  // Personalização das Cores de Fundo (Background Colors)
  themePreset?: string;
  themeBgColorPrimary?: string;
  themeBgColorSecondary?: string;
  themeBgStyle?: 'solid' | 'linear-to-b' | 'linear-to-br' | 'radial';
  themeTextColor?: 'light' | 'dark' | 'auto';

  // Controle de Exibição / Remoção de Elementos ("Remover isto que esta selecionado")
  showFormBadge?: boolean;
  showFormDescription?: boolean;
  showPrizesPreview?: boolean;
  showInfoIndicators?: boolean;
  showCardTag?: boolean;
  showRulesSection?: boolean;

  // Controle de Acesso Restrito ("Só o administrador tem acesso às informações de todo o aplicativo")
  onlyAdminAccessAll?: boolean;

  // Calendário e Horário do Sorteio (Dias e Horas que será feito)
  drawDate?: string; // Ex: '2026-05-15'
  drawTime?: string; // Ex: '20:00'
  drawDateTime?: string; // ISO ou '2026-05-15T20:00'
  drawTimezone?: string; // Ex: 'Horário Oficial'
  drawLocation?: string; // Ex: 'Transmissão Ao Vivo Oficial'
  showDrawCalendar?: boolean;

  // Relógio de Tempo / Contagem Regressiva para o Sorteio
  showCountdownTimer?: boolean;
  countdownTitle?: string;
  countdownMessage?: string;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  prizes: Prize[];
  status: 'open' | 'paused' | 'drawing' | 'completed';
  allowRegistrations: boolean;
  createdAt: string;
  drawnAt?: string;
  winners: Winner[];
  settings: AppSettings;
}

export interface VerificationCode {
  email: string;
  raffleId: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

export interface ServerState {
  currentRaffle: Raffle;
  participants: Participant[];
  recentCodes: { email: string; code: string; sentAt: string }[];
}
