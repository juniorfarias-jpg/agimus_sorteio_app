import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import { AppSettings, Participant, Prize, Raffle, Winner } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sorteio_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface VerificationRecord {
  email: string;
  code: string;
  raffleId: string;
  expiresAt: number;
  createdAt: string;
}

interface DBData {
  raffle: Raffle;
  participants: Participant[];
  verificationCodes: VerificationRecord[];
  emailLog: { email: string; code: string; sentAt: string }[];
}

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

const defaultSettings: AppSettings = {
  organizerName: 'Comissão Organizadora Oficial',
  contactEmail: 'suporte@sorteiolive.com',
  contactPhone: '(11) 98765-4321',
  rulesText: '1. Cada participante tem direito a 1 (um) único bilhete numerado.\n2. O sorteio é realizado ao vivo com transparência pública auditável.\n3. O contemplado receberá a confirmação através dos dados cadastrados.',
  rulesTitle: 'Regulamento do Sorteio',
  requirePhone: false,
  requireCity: false,
  maxParticipants: 0, // 0 = sem limite
  codeExpirationMinutes: 10,
  soundEnabledByDefault: true,
  adminPin: '1234',
  announcementBanner: '🎉 Grande Sorteio Oficial em Andamento! Cadastre-se e acompanhe os resultados ao vivo.',
  showAnnouncement: true,

  // Campos customizáveis do formulário
  formBadgeText: 'Inscrição Oficial para o Sorteio',
  formCardTitle: 'Formulário de Inscrição',
  formCardSubtitle: 'Insira os dados solicitados pelo administrador do aplicativo',
  formCardTag: 'Inscrição Direta',
  formNameLabel: 'Nome Completo',
  formNamePlaceholder: 'Ex: Maria dos Santos Silva',
  formEmailLabel: 'E-mail',
  formEmailPlaceholder: 'Ex: seu.nome@gmail.com',
  formEmailHelpText: 'Inscrição direta sem código de verificação por e-mail.',
  formEnablePhone: true,
  formPhoneLabel: 'Telefone / WhatsApp',
  formPhonePlaceholder: 'Ex: (11) 98765-4321 ou +244 9...',
  formEnableCity: true,
  formCityLabel: 'Cidade / Província / Estado',
  formCityPlaceholder: 'Ex: São Paulo - SP ou Luanda',
  formSubmitButtonText: 'Confirmar Inscrição no Sorteio',
  showCheckTicketLink: true,
  checkTicketText: 'Consultar meu bilhete',
  customPublicUrl: '',
};

const defaultPrizes: Prize[] = [
  { id: 'prize-1', rank: 1, title: 'MacBook Air M3 / Notebook Gamer Ultra', description: 'Computador de alta performance para trabalho e jogos', estimatedValue: 'R$ 9.500,00' },
  { id: 'prize-2', rank: 2, title: 'PlayStation 5 Pro + 2 Controles', description: 'Console de última geração com kit de jogos', estimatedValue: 'R$ 5.800,00' },
  { id: 'prize-3', rank: 3, title: 'iPhone 16 Pro Max 256GB', description: 'Smartphone topo de linha com câmera profissional', estimatedValue: 'R$ 8.900,00' },
  { id: 'prize-4', rank: 4, title: 'Smart TV 65" 4K QLED', description: 'Cinema em casa com som Dolby Atmos', estimatedValue: 'R$ 4.200,00' },
  { id: 'prize-5', rank: 5, title: 'Vale-Compras de R$ 1.500,00', description: 'Crédito livre para compras online', estimatedValue: 'R$ 1.500,00' },
];

const initialRaffle: Raffle = {
  id: 'raffle-2026-01',
  title: 'Grande Sorteio Oficial de Tecnologia 2026',
  description: 'Participe do maior sorteio comunitário do ano! Inscrição 100% gratuita, validação segura por e-mail e emissão de QR Code oficial para cada bilhete.',
  prizes: defaultPrizes,
  status: 'open',
  allowRegistrations: true,
  createdAt: new Date().toISOString(),
  winners: [],
  settings: defaultSettings,
};

const sampleSeedParticipants: Participant[] = [
  {
    id: 'part-001',
    raffleId: 'raffle-2026-01',
    ticketNumber: 'SOR-10842',
    name: 'Mariana Silva Santos',
    email: 'mariana.silva@exemplo.com.br',
    phone: '(11) 98452-1100',
    city: 'São Paulo - SP',
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'part-002',
    raffleId: 'raffle-2026-01',
    ticketNumber: 'SOR-24915',
    name: 'Carlos Eduardo Oliveira',
    email: 'carlos.eduardo@exemplo.com.br',
    phone: '(21) 99123-4567',
    city: 'Rio de Janeiro - RJ',
    registeredAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'part-003',
    raffleId: 'raffle-2026-01',
    ticketNumber: 'SOR-38102',
    name: 'Ana Beatriz Souza',
    email: 'ana.beatriz@exemplo.com.br',
    phone: '(31) 98765-4321',
    city: 'Belo Horizonte - MG',
    registeredAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'part-004',
    raffleId: 'raffle-2026-01',
    ticketNumber: 'SOR-45091',
    name: 'Lucas Gabriel Moreira',
    email: 'lucas.gabriel@exemplo.com.br',
    phone: '(41) 97654-3210',
    city: 'Curitiba - PR',
    registeredAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'part-005',
    raffleId: 'raffle-2026-01',
    ticketNumber: 'SOR-59283',
    name: 'Juliana Costa Ferreira',
    email: 'juliana.costa@exemplo.com.br',
    phone: '(51) 96543-2109',
    city: 'Porto Alegre - RS',
    registeredAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    verifiedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

let db: DBData;

function loadDatabase(): DBData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.raffle && Array.isArray(parsed.participants)) {
        if (!parsed.raffle.settings) {
          parsed.raffle.settings = defaultSettings;
        } else {
          parsed.raffle.settings = { ...defaultSettings, ...parsed.raffle.settings };
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse database file, initializing defaults:', err);
  }
  const initialData: DBData = {
    raffle: initialRaffle,
    participants: sampleSeedParticipants,
    verificationCodes: [],
    emailLog: [],
  };
  saveDatabase(initialData);
  return initialData;
}

function saveDatabase(data: DBData = db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

db = loadDatabase();

// SSE Clients
const sseClients = new Set<Response>();

function broadcastSSE(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Generate QR Code data URL for participant
async function generateTicketQR(ticketNumber: string, email: string, baseUrl: string): Promise<string> {
  const targetUrl = `${baseUrl.replace(/\/$/, '')}/?ticket=${encodeURIComponent(ticketNumber)}&email=${encodeURIComponent(email)}`;
  return QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // CORS middleware to support iframe and cross-origin requests in preview environment
  app.use((req: Request, res: Response, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // SSE endpoint
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    // Initial event
    res.write(`event: CONNECTED\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Heartbeat every 25 seconds
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(': keepalive\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 25000);

  // Helper for base url
  const getBaseUrl = (req: Request) => {
    const envUrl = process.env.APP_URL;
    if (envUrl && envUrl.startsWith('http')) return envUrl;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    return `${protocol}://${host}`;
  };

  // GET /api/state
  app.get('/api/state', (req: Request, res: Response) => {
    const participantsList = db.participants.map((p) => ({
      id: p.id,
      ticketNumber: p.ticketNumber,
      name: p.name,
      email: p.email, // Full unmasked email for administrator
      emailMasked: maskEmail(p.email),
      phone: p.phone || '',
      city: p.city || '',
      registeredAt: p.registeredAt,
    }));

    const enrichedWinners = db.raffle.winners.map((w) => {
      const part = db.participants.find((p) => p.id === w.participantId || p.ticketNumber === w.ticketNumber);
      return {
        ...w,
        participantEmail: w.participantEmail || part?.email || '',
      };
    });

    const effectivePublicUrl = db.raffle.settings?.customPublicUrl?.trim() || process.env.APP_URL || getBaseUrl(req);

    res.json({
      raffle: {
        ...db.raffle,
        settings: {
          ...defaultSettings,
          ...db.raffle.settings,
        },
        winners: enrichedWinners,
      },
      publicUrl: effectivePublicUrl,
      participantCount: db.participants.length,
      participants: participantsList,
      winners: enrichedWinners,
    });
  });

  // GET /api/admin/participants (Full unmasked participant details for admin)
  app.get('/api/admin/participants', (_req: Request, res: Response) => {
    res.json({
      participants: db.participants.map((p) => ({
        id: p.id,
        ticketNumber: p.ticketNumber,
        name: p.name,
        email: p.email, // Full email
        phone: p.phone || '',
        city: p.city || '',
        registeredAt: p.registeredAt,
      })),
      total: db.participants.length,
    });
  });

  // POST /api/request-verification
  app.post('/api/request-verification', (req: Request, res: Response) => {
    const { email, raffleId } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'E-mail inválido ou não informado.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Por favor, insira um formato de e-mail válido.' });
    }

    if (!db.raffle.allowRegistrations || db.raffle.status === 'completed') {
      return res.status(400).json({ error: 'As inscrições para este sorteio estão encerradas no momento.' });
    }

    // Check maximum participants limit configured in settings
    const maxP = db.raffle.settings?.maxParticipants || 0;
    if (maxP > 0 && db.participants.length >= maxP) {
      return res.status(400).json({
        error: `O limite máximo configurado de ${maxP} inscrições foi atingido para este sorteio.`,
      });
    }

    // CHECK UNICITY: Is this email already registered?
    const alreadyExists = db.participants.find(
      (p) => p.email.toLowerCase() === cleanEmail && (!raffleId || p.raffleId === db.raffle.id)
    );

    if (alreadyExists) {
      return res.status(409).json({
        error: 'Este e-mail já está inscrito neste sorteio! Cada participante só pode se inscrever uma única vez.',
        alreadyRegistered: true,
        ticketNumber: alreadyExists.ticketNumber,
      });
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expMin = db.raffle.settings?.codeExpirationMinutes || 10;
    const expiresAt = Date.now() + expMin * 60 * 1000;

    // Remove older codes for this email
    db.verificationCodes = db.verificationCodes.filter((v) => v.email !== cleanEmail);
    db.verificationCodes.push({
      email: cleanEmail,
      code,
      raffleId: db.raffle.id,
      expiresAt,
      createdAt: new Date().toISOString(),
    });

    const logEntry = { email: cleanEmail, code, sentAt: new Date().toISOString() };
    db.emailLog.unshift(logEntry);
    if (db.emailLog.length > 50) db.emailLog.pop();

    saveDatabase();

    return res.json({
      success: true,
      message: 'Código de verificação gerado e enviado com sucesso!',
      email: cleanEmail,
      expiresInMinutes: expMin,
      simulatedDelivery: {
        email: cleanEmail,
        code,
        note: 'Em ambiente de demonstração, o código também é disponibilizado diretamente na interface para agilidade nos testes.',
      },
    });
  });

  // POST /api/register
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, name, phone, city } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'Nome completo e e-mail são obrigatórios para a inscrição.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = String(name).trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ error: 'Por favor, informe um endereço de e-mail válido (ex: nome@exemplo.com).' });
      }

      if (cleanName.length < 2) {
        return res.status(400).json({ error: 'Por favor, informe seu nome completo (mínimo 2 caracteres).' });
      }

      if (!db.raffle.allowRegistrations || db.raffle.status === 'completed') {
        return res.status(400).json({ error: 'Inscrições encerradas para este sorteio.' });
      }

      if (db.raffle.settings?.maxParticipants && db.raffle.settings.maxParticipants > 0 && db.participants.length >= db.raffle.settings.maxParticipants) {
        return res.status(400).json({ error: 'O limite máximo de participantes deste sorteio já foi atingido.' });
      }

      // Check required fields based on settings requested by the administrator
      const isPhoneEnabled = db.raffle.settings?.formEnablePhone !== false;
      const isCityEnabled = db.raffle.settings?.formEnableCity !== false;

      if (isPhoneEnabled && db.raffle.settings?.requirePhone && (!phone || !String(phone).trim())) {
        const phoneLabel = db.raffle.settings?.formPhoneLabel || 'telefone / WhatsApp';
        return res.status(400).json({ error: `O campo "${phoneLabel}" é obrigatório para participar deste sorteio.` });
      }
      if (isCityEnabled && db.raffle.settings?.requireCity && (!city || !String(city).trim())) {
        const cityLabel = db.raffle.settings?.formCityLabel || 'cidade / localidade';
        return res.status(400).json({ error: `O campo "${cityLabel}" é obrigatório para participar deste sorteio.` });
      }

      // 1. Strict duplicate check (1 participation per email)
      const existing = db.participants.find(
        (p) => p.email.toLowerCase() === cleanEmail && p.raffleId === db.raffle.id
      );
      if (existing) {
        return res.status(409).json({
          error: `Este e-mail já possui uma inscrição confirmada com o bilhete ${existing.ticketNumber}. Limite de 1 inscrição por participante.`,
          ticketNumber: existing.ticketNumber,
          participant: existing,
        });
      }

      // 3. Generate unique ticket number
      let ticketNumber = '';
      let isUnique = false;
      while (!isUnique) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        ticketNumber = `SOR-${randomNum}`;
        if (!db.participants.some((p) => p.ticketNumber === ticketNumber)) {
          isUnique = true;
        }
      }

      const participantId = `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const baseUrl = getBaseUrl(req);
      const qrCodeDataUrl = await generateTicketQR(ticketNumber, cleanEmail, baseUrl);

      const newParticipant: Participant = {
        id: participantId,
        raffleId: db.raffle.id,
        ticketNumber,
        name: cleanName,
        email: cleanEmail,
        phone: phone ? String(phone).trim() : undefined,
        city: city ? String(city).trim() : undefined,
        registeredAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        qrCodeDataUrl,
      };

      db.participants.push(newParticipant);
      saveDatabase();

      // Broadcast real-time participant update
      broadcastSSE('PARTICIPANT_JOINED', {
        id: newParticipant.id,
        ticketNumber: newParticipant.ticketNumber,
        name: newParticipant.name,
        email: newParticipant.email,
        emailMasked: maskEmail(newParticipant.email),
        phone: newParticipant.phone || '',
        city: newParticipant.city || '',
        registeredAt: newParticipant.registeredAt,
        totalParticipants: db.participants.length,
      });

      return res.status(201).json({
        success: true,
        participant: newParticipant,
        directAppUrl: `${baseUrl}/?ticket=${ticketNumber}`,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Erro interno ao processar inscrição: ' + (err.message || 'Desconhecido') });
    }
  });

  // GET /api/ticket/:identifier (by ticketNumber or email)
  app.get('/api/ticket/:identifier', async (req: Request, res: Response) => {
    const idParam = decodeURIComponent(req.params.identifier).trim().toLowerCase();
    const participant = db.participants.find(
      (p) => p.ticketNumber.toLowerCase() === idParam || p.email.toLowerCase() === idParam || p.id === idParam
    );

    if (!participant) {
      return res.status(404).json({ error: 'Bilhete ou participante não encontrado.' });
    }

    const baseUrl = getBaseUrl(req);
    if (!participant.qrCodeDataUrl) {
      participant.qrCodeDataUrl = await generateTicketQR(participant.ticketNumber, participant.email, baseUrl);
    }

    const wonPrize = db.raffle.winners.find((w) => w.participantId === participant.id);

    return res.json({
      participant,
      raffle: db.raffle,
      hasWon: !!wonPrize,
      prizeWon: wonPrize || null,
      directUrl: `${baseUrl}/?ticket=${participant.ticketNumber}`,
    });
  });

  // ================= ADMIN & CONFIGURATION ENDPOINTS =================

  // POST /api/admin/save-config (Configure EVERYTHING about the raffle)
  app.post('/api/admin/save-config', (req: Request, res: Response) => {
    const { title, description, allowRegistrations, prizes, settings } = req.body;

    if (title && typeof title === 'string') {
      db.raffle.title = title.trim();
    }
    if (description !== undefined && typeof description === 'string') {
      db.raffle.description = description.trim();
    }
    if (typeof allowRegistrations === 'boolean') {
      db.raffle.allowRegistrations = allowRegistrations;
    }
    if (Array.isArray(prizes)) {
      db.raffle.prizes = prizes;
    }
    if (settings && typeof settings === 'object') {
      db.raffle.settings = {
        ...defaultSettings,
        ...(db.raffle.settings || {}),
        ...settings,
      };
    }

    saveDatabase();
    broadcastSSE('STATE_UPDATED', { raffle: db.raffle });

    res.json({
      success: true,
      message: 'Configurações do aplicativo salvas com sucesso!',
      raffle: db.raffle,
    });
  });

  // POST /api/admin/start-draw-animation
  app.post('/api/admin/start-draw-animation', (req: Request, res: Response) => {
    const { prizeId } = req.body;
    const prize = db.raffle.prizes.find((p) => p.id === prizeId);
    if (!prize) {
      return res.status(404).json({ error: 'Prêmio não encontrado.' });
    }

    db.raffle.status = 'drawing';
    saveDatabase();

    broadcastSSE('DRAW_ANIMATION_START', {
      prizeId: prize.id,
      prizeTitle: prize.title,
      rank: prize.rank,
      timestamp: Date.now(),
    });

    res.json({ success: true, message: 'Animação de sorteio iniciada.' });
  });

  // POST /api/admin/draw-winner
  app.post('/api/admin/draw-winner', (req: Request, res: Response) => {
    const { prizeId } = req.body;
    const prize = db.raffle.prizes.find((p) => p.id === prizeId);
    if (!prize) {
      return res.status(404).json({ error: 'Prêmio não encontrado.' });
    }

    // Check if prize was already drawn
    if (db.raffle.winners.some((w) => w.prizeId === prizeId)) {
      return res.status(400).json({ error: 'Este prêmio já possui um ganhador sorteado!' });
    }

    // Eligible participants: all registered who haven't won a prize yet
    const winningParticipantIds = new Set(db.raffle.winners.map((w) => w.participantId));
    const eligible = db.participants.filter((p) => !winningParticipantIds.has(p.id));

    if (eligible.length === 0) {
      return res.status(400).json({ error: 'Não há participantes elegíveis disponíveis para este sorteio.' });
    }

    // Truly random selection
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosenWinner = eligible[randomIndex];

    const winnerRecord: Winner = {
      prizeId: prize.id,
      prizeTitle: prize.title,
      participantId: chosenWinner.id,
      participantName: chosenWinner.name,
      participantEmail: chosenWinner.email,
      participantEmailMasked: maskEmail(chosenWinner.email),
      ticketNumber: chosenWinner.ticketNumber,
      drawnAt: new Date().toISOString(),
    };

    db.raffle.winners.push(winnerRecord);

    // If all prizes are won, set raffle status completed
    if (db.raffle.winners.length >= db.raffle.prizes.length) {
      db.raffle.status = 'completed';
    } else {
      db.raffle.status = 'open';
    }

    saveDatabase();

    // Broadcast winner to all live screens
    broadcastSSE('WINNER_SELECTED', {
      winner: winnerRecord,
      raffleStatus: db.raffle.status,
      remainingPrizes: db.raffle.prizes.length - db.raffle.winners.length,
    });

    res.json({ success: true, winner: winnerRecord });
  });

  // POST /api/admin/toggle-registration
  app.post('/api/admin/toggle-registration', (req: Request, res: Response) => {
    db.raffle.allowRegistrations = !db.raffle.allowRegistrations;
    saveDatabase();

    broadcastSSE('REGISTRATION_TOGGLED', {
      allowRegistrations: db.raffle.allowRegistrations,
    });

    res.json({ success: true, allowRegistrations: db.raffle.allowRegistrations });
  });

  // POST /api/admin/reset-winners
  app.post('/api/admin/reset-winners', (req: Request, res: Response) => {
    db.raffle.winners = [];
    db.raffle.status = 'open';
    saveDatabase();

    broadcastSSE('WINNERS_RESET', { raffle: db.raffle });
    res.json({ success: true, message: 'Ganhadores reiniciados com sucesso.' });
  });

  // POST /api/admin/delete-participant
  app.post('/api/admin/delete-participant', (req: Request, res: Response) => {
    const { id, ticketNumber } = req.body;
    const prevCount = db.participants.length;

    db.participants = db.participants.filter(
      (p) => p.id !== id && p.ticketNumber !== ticketNumber
    );

    // Also remove from winners if won
    db.raffle.winners = db.raffle.winners.filter(
      (w) => w.participantId !== id && w.ticketNumber !== ticketNumber
    );

    saveDatabase();
    broadcastSSE('STATE_UPDATED', { raffle: db.raffle });

    res.json({
      success: true,
      removed: prevCount - db.participants.length,
      currentCount: db.participants.length,
    });
  });

  // POST /api/admin/clear-all-participants
  app.post('/api/admin/clear-all-participants', (req: Request, res: Response) => {
    db.participants = [];
    db.raffle.winners = [];
    db.raffle.status = 'open';
    saveDatabase();

    broadcastSSE('STATE_UPDATED', { raffle: db.raffle });
    res.json({ success: true, message: 'Todos os participantes e ganhadores foram limpos.' });
  });

  // POST /api/admin/seed-participants
  app.post('/api/admin/seed-participants', (req: Request, res: Response) => {
    // Add sample participants
    for (const sample of sampleSeedParticipants) {
      if (!db.participants.some((p) => p.email === sample.email)) {
        db.participants.push({ ...sample, registeredAt: new Date().toISOString() });
      }
    }
    saveDatabase();
    broadcastSSE('STATE_UPDATED', { raffle: db.raffle });
    res.json({ success: true, count: db.participants.length });
  });

  // GET /api/admin/recent-emails
  app.get('/api/admin/recent-emails', (_req: Request, res: Response) => {
    res.json({
      emailLog: db.emailLog,
      activeCodes: db.verificationCodes.map((v) => ({
        email: v.email,
        code: v.code,
        expiresInSec: Math.max(0, Math.round((v.expiresAt - Date.now()) / 1000)),
      })),
    });
  });

  // Mount Vite or static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SorteioLive server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
