export interface Prize {
  id: string;
  rank: number;
  title: string;
  description?: string;
  estimatedValue?: string;
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
