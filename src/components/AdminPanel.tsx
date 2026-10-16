import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Users,
  Download,
  Search,
  CheckCircle2,
  Settings,
  Gift,
  ShieldCheck,
  Mail,
  Plus,
  Trash2,
  Save,
  Sliders,
  FileText,
  KeyRound,
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Phone,
  MapPin,
  RefreshCw,
  Lock,
  Unlock,
  QrCode,
  Flame,
  FileDown,
  Printer,
  Smartphone,
  Palette,
  Image as ImageIcon,
  Upload,
  Eye,
  Check,
  Calendar,
  Clock,
  Minus,
} from 'lucide-react';
import QRCode from 'qrcode';
import { AppSettings, Prize, Raffle } from '../types.ts';
import { exportParticipantsPDF, exportWinnersPDF } from '../utils/pdfExport.ts';
import { THEME_PRESETS, AppLogo, getThemeStyles } from '../utils/theme.tsx';
import { CountdownClock, formatDrawDateHuman } from './CountdownClock.tsx';

interface AdminPanelProps {
  raffle: Raffle;
  participants: Array<{
    id: string;
    ticketNumber: string;
    name: string;
    email?: string;
    emailMasked: string;
    phone?: string;
    city: string;
    registeredAt: string;
  }>;
  onViewTicket: (ticketNum: string) => void;
  onRefreshState: () => void;
  onClose?: () => void;
  serverPublicUrl?: string;
  onOpenPrintPoster?: () => void;
}

const AdminPosterQRCode: React.FC<{ targetUrl: string }> = ({ targetUrl }) => {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then(setDataUrl)
        .catch((err) => console.error('Erro ao gerar QR Code para cartaz:', err));
    }
  }, [targetUrl]);

  if (!dataUrl) {
    return <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Gerando QR Code...</div>;
  }
  return <img src={dataUrl} alt="QR Code Oficial" className="w-52 h-52 mx-auto" />;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  raffle,
  participants,
  onViewTicket,
  onRefreshState,
  onClose,
  serverPublicUrl,
  onOpenPrintPoster,
}) => {
  // Navigation inside Admin Panel
  const [adminTab, setAdminTab] = useState<
    'draw' | 'prizes' | 'schedule' | 'theme' | 'form' | 'poster' | 'settings' | 'rules' | 'participants' | 'audit'
  >('prizes');

  // Track if user has modified anything so background polls don't erase what they are typing
  const hasUserEdited = useRef(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setActionError('A imagem do logo deve ter no máximo 15MB.');
      return;
    }

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

    const reader = new FileReader();
    reader.onload = () => {
      const rawBase64 = reader.result as string;

      const finishUpload = (finalDataUrl: string) => {
        hasUserEdited.current = true;
        setSettings((prev) => ({ ...prev, logoUrl: finalDataUrl }));

        fetch('/api/admin/upload-logo', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: finalDataUrl }),
        })
          .then(async (r) => {
            if (!r.ok) {
              const alt = await fetch('/api/upload-logo', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: finalDataUrl }),
              });
              return alt.json();
            }
            return r.json();
          })
          .then((data) => {
            if (data && data.logoUrl) {
              setSettings((prev) => ({ ...prev, logoUrl: data.logoUrl }));
              onRefreshState();
              setActionSuccess('✅ Logo carregado, otimizado e gravado na base de dados com sucesso!');
            }
          })
          .catch(() => {
            setActionSuccess('Logo pronto! Clique em "Salvar Alterações" para gravar permanentemente.');
          });
      };

      if (isSvg) {
        finishUpload(rawBase64);
        return;
      }

      // Client-side canvas compression for raster images (PNG, JPG, WebP)
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let w = img.width || 480;
        let h = img.height || 480;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/png', 0.9);
          finishUpload(compressed);
        } else {
          finishUpload(rawBase64);
        }
      };
      img.onerror = () => {
        finishUpload(rawBase64);
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectThemePreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    hasUserEdited.current = true;
    setSettings((prev) => ({
      ...prev,
      themePreset: preset.id,
      themeBgColorPrimary: preset.primary,
      themeBgColorSecondary: preset.secondary,
      themeBgStyle: preset.style,
      themeTextColor: preset.isLight ? 'dark' : 'light',
    }));
    setActionSuccess(`Tema de cores "${preset.name}" selecionado! Clique em Gravar Alterações para salvar.`);
  };

  // Form states for general configuration
  const [title, setTitle] = useState(raffle.title);
  const [description, setDescription] = useState(raffle.description);
  const [prizes, setPrizes] = useState<Prize[]>(
    (raffle.prizes || []).map((p) => ({
      ...p,
      quantity: typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1,
    }))
  );

  // Settings
  const [settings, setSettings] = useState<AppSettings>(
    raffle.settings || {
      organizerName: 'Comissão Organizadora Oficial',
      contactEmail: 'suporte@sorteiolive.com',
      contactPhone: '(11) 98765-4321',
      rulesText: '1. Inscrição única por e-mail com validação em tempo real.\n2. O QR Code gerado é o comprovante oficial de participação.\n3. O sorteio é transmitido e auditado ao vivo.',
      requirePhone: false,
      requireCity: false,
      maxParticipants: 0,
      codeExpirationMinutes: 10,
      soundEnabledByDefault: true,
      adminPin: '1234',
      announcementBanner: '🎉 Grande Sorteio Oficial em Andamento! Cadastre-se e acompanhe os resultados ao vivo.',
      showAnnouncement: true,
      drawDate: '2026-05-15',
      drawTime: '20:00',
      drawDateTime: '2026-05-15T20:00',
      drawTimezone: 'Horário Oficial',
      drawLocation: 'Transmissão Ao Vivo Oficial',
      showDrawCalendar: true,
      showCountdownTimer: true,
      countdownTitle: 'Contagem Regressiva para o Sorteio',
      countdownMessage: '🎉 O Sorteio está acontecendo agora ao vivo!',
    }
  );

  // Sync state ONLY if user has not made local changes (prevent typing loss)
  useEffect(() => {
    if (!hasUserEdited.current) {
      setTitle(raffle.title);
      setDescription(raffle.description);
      setPrizes(
        (raffle.prizes || []).map((p) => ({
          ...p,
          quantity: typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1,
        }))
      );
      if (raffle.settings) {
        setSettings(raffle.settings);
      }
    }
  }, [raffle]);

  // Operational states
  const [search, setSearch] = useState('');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(() => {
    const list = raffle.prizes || [];
    const winners = raffle.winners || [];
    const rem = list.find((p) => {
      const drawn = winners.filter((w) => w.prizeId === p.id).length;
      const maxW = typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1;
      return drawn < maxW;
    });
    return rem?.id || list[0]?.id || '';
  });
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Prize modal/form with QUANTITY
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizeVal, setNewPrizeVal] = useState('');
  const [newPrizeQty, setNewPrizeQty] = useState(1);

  // Email Audit logs
  const [emailAudit, setEmailAudit] = useState<{ emailLog: any[]; activeCodes: any[] }>({
    emailLog: [],
    activeCodes: [],
  });

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/recent-emails');
      if (res.ok) {
        const data = await res.json();
        setEmailAudit(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (adminTab === 'audit') {
      loadAuditLogs();
    }
  }, [adminTab]);

  // Save full configuration
  const handleSaveFullConfig = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoadingAction(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      let currentSettings = { ...settings };

      // If user pasted or selected a heavy base64 logo, upload it to the dedicated file endpoint first
      if (
        currentSettings.logoUrl &&
        typeof currentSettings.logoUrl === 'string' &&
        currentSettings.logoUrl.startsWith('data:image/') &&
        currentSettings.logoUrl.length > 2000
      ) {
        try {
          const upRes = await fetch('/api/admin/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: currentSettings.logoUrl }),
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            if (upData.logoUrl) {
              currentSettings.logoUrl = upData.logoUrl;
              setSettings((prev) => ({ ...prev, logoUrl: upData.logoUrl }));
            }
          }
        } catch (uploadErr) {
          console.warn('Pre-upload notice:', uploadErr);
        }
      }

      // Save directly to localStorage as resilient client-side backup
      try {
        localStorage.setItem(
          'sorteio_offline_backup',
          JSON.stringify({
            title,
            description,
            prizes,
            settings: currentSettings,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (lsErr) {
        console.warn('LocalStorage backup notice:', lsErr);
      }

      const savePayload = JSON.stringify({
        title,
        description,
        prizes,
        settings: currentSettings,
      });

      const endpoints = [
        '/api/admin/save-config',
        '/api/save-config',
        `${window.location.origin}/api/admin/save-config`,
        `${window.location.origin}/api/save-config`,
      ];

      let res: Response | null = null;
      let text = '';
      let data: any = null;

      for (const ep of endpoints) {
        try {
          const attempt = await fetch(ep, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: savePayload,
          });

          const attemptText = await attempt.text();
          let parsed: any = null;
          try {
            parsed = JSON.parse(attemptText);
          } catch {
            parsed = null;
          }

          if (attempt.ok && parsed && parsed.success) {
            res = attempt;
            text = attemptText;
            data = parsed;
            break;
          } else if (!res) {
            res = attempt;
            text = attemptText;
            data = parsed;
          }
        } catch (netErr) {
          console.warn(`Attempt failed on ${ep}:`, netErr);
        }
      }

      if (!res) {
        throw new Error('Não foi possível conectar com os serviços da base de dados.');
      }

      if (!data) {
        try {
          data = JSON.parse(text);
        } catch {
          if (!res.ok) {
            throw new Error(`Servidor respondeu com código ${res.status}: ${res.statusText || 'Erro inesperado'}`);
          }
        }
      }

      if (res.ok && data.success) {
        hasUserEdited.current = false;
        if (data.raffle?.settings?.logoUrl) {
          setSettings((prev) => ({ ...prev, logoUrl: data.raffle.settings.logoUrl }));
        }
        setActionSuccess('✅ Todas as alterações (logo, tema de cores, prêmios, calendário, relógio) foram gravadas e verificadas na base de dados com sucesso!');
        onRefreshState();
      } else {
        setActionError('❌ ' + (data.error || 'Erro ao salvar alterações no servidor.'));
      }
    } catch (err: any) {
      setActionError('Falha ao comunicar com o servidor: ' + (err.message || 'Erro de rede'));
    } finally {
      setLoadingAction(false);
    }
  };

  // Add Prize with Quantity
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeTitle.trim()) return;

    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      rank: prizes.length + 1,
      title: newPrizeTitle.trim(),
      description: newPrizeDesc.trim() || undefined,
      estimatedValue: newPrizeVal.trim() || undefined,
      quantity: Math.max(1, Number(newPrizeQty) || 1),
    };

    const updated = [...prizes, newPrize];
    setPrizes(updated);
    hasUserEdited.current = true;
    setNewPrizeTitle('');
    setNewPrizeDesc('');
    setNewPrizeVal('');
    setNewPrizeQty(1);
    setActionSuccess(`Prêmio "${newPrize.title}" (${newPrize.quantity} un.) adicionado à lista. Clique em "Gravar Alterações" para salvar.`);
  };

  const handleUpdatePrizeQty = (prizeId: string, delta: number) => {
    hasUserEdited.current = true;
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id === prizeId) {
          const current = typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1;
          const next = Math.max(1, current + delta);
          return { ...p, quantity: next };
        }
        return p;
      })
    );
  };

  const handleSetPrizeQtyDirect = (prizeId: string, val: number) => {
    hasUserEdited.current = true;
    setPrizes((prev) =>
      prev.map((p) => (p.id === prizeId ? { ...p, quantity: Math.max(1, val || 1) } : p))
    );
  };

  const handleDiscardEdits = () => {
    hasUserEdited.current = false;
    setTitle(raffle.title);
    setDescription(raffle.description);
    setPrizes(
      (raffle.prizes || []).map((p) => ({
        ...p,
        quantity: typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1,
      }))
    );
    if (raffle.settings) {
      setSettings(raffle.settings);
    }
    setActionSuccess('Alterações descartadas e dados recarregados da base central.');
  };

  // Remove Prize
  const handleRemovePrize = (id: string) => {
    const winners = raffle.winners || [];
    if (winners.some((w) => w.prizeId === id)) {
      setActionError('Este prêmio já foi sorteado! Para removê-lo, reinicie os ganhadores primeiro.');
      return;
    }
    const filtered = prizes.filter((p) => p.id !== id).map((p, idx) => ({ ...p, rank: idx + 1 }));
    setPrizes(filtered);
  };

  // Delete individual participant
  const handleDeleteParticipant = async (id: string, ticketNumber: string) => {
    if (!confirm(`Remover participante bilhete ${ticketNumber}?`)) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/delete-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ticketNumber }),
      });
      if (res.ok) {
        setActionSuccess(`Participante ${ticketNumber} removido da base.`);
        onRefreshState();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Clear all participants
  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Deseja realmente excluir TODOS os participantes da base de dados? Esta ação é irreversível.')) {
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/clear-all-participants', { method: 'POST' });
      if (res.ok) {
        setActionSuccess('Base de participantes zerada.');
        onRefreshState();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Seed sample participants
  const handleSeedParticipants = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/seed-participants', { method: 'POST' });
      if (res.ok) {
        setActionSuccess('Participantes de exemplo adicionados para demonstração.');
        onRefreshState();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Live Draw Trigger
  const handleDrawPrize = async (prizeIdToDraw: string) => {
    if (!prizeIdToDraw) return;
    setLoadingAction(true);
    setActionSuccess('Iniciando sorteio ao vivo com efeitos sonoros e suspense sincronizado...');

    try {
      await fetch('/api/admin/start-draw-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: prizeIdToDraw }),
      });

      setTimeout(async () => {
        try {
          const res = await fetch('/api/admin/draw-winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prizeId: prizeIdToDraw }),
          });
          const data = await res.json();
          if (res.ok) {
            setActionSuccess(`🎉 Parabéns! ${data.winner.participantName} ganhou o ${data.winner.prizeTitle}!`);
            onRefreshState();
          } else {
            setActionError(`Erro: ${data.error}`);
          }
        } catch {
          setActionError('Erro ao registrar ganhador.');
        } finally {
          setLoadingAction(false);
        }
      }, 4000);
    } catch {
      setActionError('Falha ao acionar sorteio.');
      setLoadingAction(false);
    }
  };

  // Reset winners
  const handleResetWinners = async () => {
    if (!confirm('Deseja reiniciar todos os ganhadores deste sorteio?')) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/reset-winners', { method: 'POST' });
      if (res.ok) {
        setActionSuccess('Ganhadores reiniciados com sucesso!');
        onRefreshState();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle registrations
  const handleToggleRegistration = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/toggle-registration', { method: 'POST' });
      if (res.ok) {
        onRefreshState();
        setActionSuccess('Status de inscrições alterado!');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Export CSV with full email for administrator
  const handleExportCSV = () => {
    const headers = ['Bilhete', 'Nome', 'Email Completo', 'Telefone', 'Cidade', 'Data Inscrição'];
    const rows = participants.map((p) => [
      p.ticketNumber,
      `"${p.name.replace(/"/g, '""')}"`,
      p.email || p.emailMasked,
      `"${(p.phone || '').replace(/"/g, '""')}"`,
      `"${(p.city || '').replace(/"/g, '""')}"`,
      p.registeredAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participantes-sorteio-admin-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const availablePrizes = (prizes || []).filter((p) => {
    const winnersForPrize = (raffle.winners || []).filter((w) => w.prizeId === p.id);
    const maxWinners = typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1;
    return winnersForPrize.length < maxWinners;
  });

  const safeParticipants = participants || [];
  const filteredParticipants = safeParticipants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.ticketNumber.toLowerCase().includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      p.emailMasked.toLowerCase().includes(q) ||
      (p.city && p.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header with Keyboard Shortcut Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Painel de Gestão Completo
            </span>
            {/* Alt + C Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
              <span className="text-amber-400">Atalho:</span> Alt + C
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Configuração Geral & Administração
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Personalize títulos, regras, prêmios, limites de vagas, e controle o sorteio ao vivo.
          </p>
        </div>

        {/* Global Save, PDF & Exit Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Voltar para a tela principal (Atalho: Alt + C)"
            >
              ← Voltar ao Sorteio
            </button>
          )}

          <button
            type="button"
            onClick={() => exportParticipantsPDF(raffle, participants)}
            disabled={participants.length === 0}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar documento PDF com a relação completa de inscritos (com e-mails completos)"
          >
            <FileDown className="w-4 h-4 text-indigo-400" />
            PDF Inscritos ({participants.length})
          </button>

          <button
            type="button"
            onClick={() => exportWinnersPDF(raffle, participants)}
            className="py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar Ata Oficial de Homologação de Ganhadores em PDF"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            PDF Ata de Ganhadores
          </button>

          <button
            onClick={() => handleSaveFullConfig()}
            disabled={loadingAction}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-xl shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-white font-bold ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setAdminTab('draw')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'draw'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Realizar Sorteio
        </button>

        <button
          onClick={() => setAdminTab('theme')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'theme'
              ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white shadow-md font-bold'
              : 'text-amber-300 hover:text-white hover:bg-slate-800 border border-amber-500/30'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-amber-300" />
          🎨 Logo & Cores de Fundo
        </button>

        <button
          onClick={() => setAdminTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'form'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
              : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40 border border-emerald-500/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          Formulário de Inscrição (Campos em Verde)
        </button>

        <button
          onClick={() => setAdminTab('poster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'poster'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
              : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 border border-indigo-500/30'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-indigo-400" />
          Cartaz QR Code Papel (A4)
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Dados & Textos do Sorteio
        </button>

        <button
          onClick={() => setAdminTab('prizes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'prizes'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-amber-400" />
          Gerenciar Prêmios ({prizes.length})
        </button>

        <button
          onClick={() => setAdminTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'schedule'
              ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md font-bold'
              : 'text-amber-300 hover:text-white hover:bg-slate-800 border border-amber-500/30'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          📅 Calendário & Relógio do Sorteio
        </button>

        <button
          onClick={() => setAdminTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'rules'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Regras de Inscrição & Validação
        </button>

        <button
          onClick={() => setAdminTab('participants')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'participants'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          Participantes ({participants.length})
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            adminTab === 'audit'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-emerald-400" />
          Auditoria de E-mails
        </button>
      </div>

      {/* ================= TAB 1: REALIZAR SORTEIO ================= */}
      {adminTab === 'draw' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Disparador de Sorteio</h2>
                  <p className="text-xs text-slate-400">Acione a roleta oficial ao vivo</p>
                </div>
              </div>

              <button
                onClick={handleToggleRegistration}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  raffle.allowRegistrations
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {raffle.allowRegistrations ? (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-400" />
                    Inscrições Abertas
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4 text-rose-400" />
                    Inscrições Pausadas
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Escolha o Prêmio a ser Sorteado:
              </label>
              <select
                value={selectedPrizeId}
                onChange={(e) => setSelectedPrizeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
              >
                {availablePrizes.length === 0 ? (
                  <option value="">Todos os prêmios foram sorteados!</option>
                ) : (
                  availablePrizes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.rank}º Lugar - {p.title} {p.estimatedValue ? `(${p.estimatedValue})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={() => handleDrawPrize(selectedPrizeId)}
              disabled={loadingAction || availablePrizes.length === 0 || participants.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <Play className="w-5 h-5 fill-white" />
              {loadingAction ? 'Sorteio em Andamento no Telão...' : 'Iniciar Sorteio ao Vivo com Roleta!'}
            </button>

            {participants.length === 0 && (
              <p className="text-xs text-rose-400 text-center font-medium">
                Nenhum participante na base. Adicione ou cadastre participantes para poder sortear.
              </p>
            )}
          </div>

          {/* Quick status side column */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Resumo do Sorteio
            </h3>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total de Concorrentes:</span>
                <span className="font-bold text-white">{participants.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Prêmios Cadastrados:</span>
                <span className="font-bold text-white">{prizes.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Prêmios Sorteados:</span>
                <span className="font-bold text-amber-400">{(raffle.winners || []).length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Prêmios Pendentes:</span>
                <span className="font-bold text-emerald-400">{availablePrizes.length}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleResetWinners}
                disabled={loadingAction || (raffle.winners || []).length === 0}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar Ganhadores
              </button>
            </div>
          </div>

          {/* Winners table in admin draw tab with FULL unmasked emails */}
          {raffle.winners.length > 0 && (
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    Ganhadores Homologados ({raffle.winners.length}) • Visão do Administrador
                  </h3>
                  <p className="text-xs text-slate-400">
                    E-mails completos visíveis para contato direto com os contemplados
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportWinnersPDF(raffle, participants)}
                  className="py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Ata PDF
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Prêmio</th>
                      <th className="py-3 px-4">Nº Bilhete</th>
                      <th className="py-3 px-4">Nome do Ganhador</th>
                      <th className="py-3 px-4">E-mail Completo (Admin)</th>
                      <th className="py-3 px-4">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {(raffle.winners || []).map((w, idx) => {
                      const fullEmail =
                        w.participantEmail ||
                        (participants || []).find((p) => p.ticketNumber === w.ticketNumber || p.id === w.participantId)?.email ||
                        w.participantEmailMasked;

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-amber-400">{w.prizeTitle}</td>
                          <td className="py-3 px-4 font-mono font-bold text-white">{w.ticketNumber}</td>
                          <td className="py-3 px-4 font-medium text-white">{w.participantName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-200 select-all break-all">
                            {fullEmail}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {w.drawnAt ? new Date(w.drawnAt).toLocaleString('pt-BR') : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB: LOGO & CORES DE FUNDO & ACESSO RESTRITO ================= */}
      {adminTab === 'theme' && (
        <form onSubmit={handleSaveFullConfig} noValidate className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 animate-fade-in">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5">
                <Palette className="w-3.5 h-3.5" />
                Identidade Visual & Controle de Acesso
              </div>
              <h2 className="text-xl font-black text-white">Logo da Marca, Cores de Fundo & Acesso</h2>
              <p className="text-xs text-slate-400">
                Personalize o logo onde está escrito Sorteio, mude as cores de fundo do aplicativo e controle a privacidade da base.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSaveFullConfig()}
              disabled={loadingAction}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-xs shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loadingAction ? 'Gravando...' : 'Salvar Alterações'}
            </button>
          </div>

          {/* Section 1: Logo da Marca (Onde está escrito Sorteio) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              1. Logo da Marca (Onde está escrito Sorteio)
            </h3>

            {/* Live Preview of Current Logo */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">Visualização Atual no Aplicativo:</span>
                <AppLogo
                  logoUrl={settings.logoUrl}
                  logoText={settings.logoText || 'Sorteio'}
                  size="md"
                  subtitle={settings.organizerName}
                />
              </div>

              {settings.logoUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setSettings({ ...settings, logoUrl: '' });
                    setActionSuccess('Logo removido. Voltou ao ícone padrão.');
                  }}
                  className="py-1.5 px-3 rounded-xl border border-rose-500/30 text-rose-300 hover:text-white hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Remover Logo Personalizado
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Carregar Arquivo de Imagem do Logo:
                </label>
                <label className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border-2 border-dashed border-indigo-500/50 text-indigo-200 hover:text-white font-bold text-xs cursor-pointer shadow-md transition-all">
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>Escolher Imagem (PNG, JPG, SVG, WebP)</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  A imagem é convertida e gravada diretamente na base de dados para sincronizar em todos os telemóveis.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Ou Informe o Link / URL da Imagem do Logo:
                </label>
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setSettings({ ...settings, logoUrl: e.target.value });
                  }}
                  placeholder="https://sua-empresa.com/logo.png ou /uploads/logo.png"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Link direto para a imagem do seu logo na internet ou caminho carregado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome / Texto da Marca (Onde está escrito "Sorteio")
                </label>
                <input
                  type="text"
                  value={settings.logoText || ''}
                  onChange={(e) => setSettings({ ...settings, logoText: e.target.value })}
                  placeholder="Sorteio"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Texto que aparece ao lado ou abaixo do logo (padrão: Sorteio).
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-white block">Exibir Logo</span>
                  <p className="text-[11px] text-slate-400">Mostrar o logo no cabeçalho e formulário.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showLogo: settings.showLogo === false })}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                    settings.showLogo !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {settings.showLogo !== false ? 'Ativo' : 'Oculto'}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Cores de Fundo do Aplicativo */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Palette className="w-4 h-4 text-amber-400" />
              2. Cores de Fundo do Aplicativo (Background Colors)
            </h3>
            <p className="text-xs text-slate-300">
              Escolha uma das paletas predefinidas ou selecione cores personalizadas para o fundo do formulário e de todas as telas.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isActive = (settings.themePreset || 'dark-slate') === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectThemePreset(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? 'border-amber-400 bg-slate-800 ring-2 ring-amber-400/40 shadow-lg'
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center -space-x-1">
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: preset.secondary }}
                        />
                      </div>
                      {isActive && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                    <span className="text-[11px] font-bold text-white leading-tight block">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cor Primária de Fundo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.themeBgColorPrimary || '#020617'}
                    onChange={(e) =>
                      setSettings({ ...settings, themePreset: 'custom', themeBgColorPrimary: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.themeBgColorPrimary || '#020617'}
                    onChange={(e) =>
                      setSettings({ ...settings, themePreset: 'custom', themeBgColorPrimary: e.target.value })
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cor Secundária (Degradê)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.themeBgColorSecondary || '#0f172a'}
                    onChange={(e) =>
                      setSettings({ ...settings, themePreset: 'custom', themeBgColorSecondary: e.target.value })
                    }
                    className="w-9 h-9 rounded-lg bg-transparent border border-slate-700 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={settings.themeBgColorSecondary || '#0f172a'}
                    onChange={(e) =>
                      setSettings({ ...settings, themePreset: 'custom', themeBgColorSecondary: e.target.value })
                    }
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Estilo do Fundo
                </label>
                <select
                  value={settings.themeBgStyle || 'linear-to-b'}
                  onChange={(e) =>
                    setSettings({ ...settings, themePreset: 'custom', themeBgStyle: e.target.value as any })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="linear-to-b">Degradê Vertical</option>
                  <option value="linear-to-br">Degradê Diagonal</option>
                  <option value="radial">Degradê Radial (Centro)</option>
                  <option value="solid">Cor Sólida Única</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Contraste do Texto
                </label>
                <select
                  value={settings.themeTextColor || 'light'}
                  onChange={(e) =>
                    setSettings({ ...settings, themeTextColor: e.target.value as any })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs outline-none"
                >
                  <option value="light">Texto Claro (para fundos escuros)</option>
                  <option value="dark">Texto Escuro (para fundos claros/brancos)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Acesso Restrito ao Administrador */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Lock className="w-4 h-4 text-amber-400" />
              3. Privacidade & Controle de Acesso Restrito
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Só o Administrador tem Acesso a Todo o Aplicativo
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Participantes veem apenas o formulário. Roleta, telão e lista só abrem com PIN.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSettings({ ...settings, onlyAdminAccessAll: settings.onlyAdminAccessAll === false })
                  }
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ml-3 ${
                    settings.onlyAdminAccessAll !== false
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {settings.onlyAdminAccessAll !== false ? 'Restrito (Ativo)' : 'Público'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <label className="block text-xs font-bold text-white uppercase mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  PIN de Segurança do Administrador:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.adminPin || ''}
                    onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                    placeholder="1234"
                    className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs font-mono tracking-widest outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Usado no botão "Admin (PIN)" no cabeçalho.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Remover Elementos do Formulário ("Remover isto que está selecionado") */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <Eye className="w-4 h-4 text-rose-400" />
              4. Ocultar / Remover Elementos do Formulário ("Remover isto que está selecionado")
            </h3>
            <p className="text-xs text-slate-300">
              Desative qualquer um dos blocos abaixo para removê-lo da tela de inscrição do participante:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Toggle Selo Superior */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Selo Superior (Inscrição Oficial)</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showFormBadge: settings.showFormBadge === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showFormBadge !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showFormBadge !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>

              {/* Toggle Descrição */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Descrição do Sorteio</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showFormDescription: settings.showFormDescription === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showFormDescription !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showFormDescription !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>

              {/* Toggle Prêmios em Disputa */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Bloco de Prêmios em Disputa</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showPrizesPreview: settings.showPrizesPreview === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showPrizesPreview !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showPrizesPreview !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>

              {/* Toggle Indicadores 1 Inscrição, Bilhete Numerado, etc. */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Indicadores (Bilhete Numerado, etc.)</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showInfoIndicators: settings.showInfoIndicators === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showInfoIndicators !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showInfoIndicators !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>

              {/* Toggle Tag Inscrição Direta */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Tag Verde (Inscrição Direta)</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showCardTag: settings.showCardTag === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showCardTag !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showCardTag !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>

              {/* Toggle Regulamento */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200">Regulamento no Rodapé</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showRulesSection: settings.showRulesSection === false })}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    settings.showRulesSection !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {settings.showRulesSection !== false ? 'Exibido' : 'Removido'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              As alterações de cores e logo são salvas diretamente e sincronizam em tempo real.
            </span>
            <button
              type="button"
              onClick={() => handleSaveFullConfig()}
              disabled={loadingAction}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loadingAction ? 'Gravando na Base de Dados...' : 'Salvar Todas as Configurações'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB: FORMULÁRIO DE INSCRIÇÃO & CAMPOS EM VERDE ================= */}
      {adminTab === 'form' && (
        <form onSubmit={handleSaveFullConfig} noValidate className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Personalização dos Textos e Campos (Assinalados em Verde)
              </div>
              <h2 className="text-xl font-black text-white">Configurações do Formulário de Inscrição</h2>
              <p className="text-xs text-slate-400">
                Altere aqui todos os textos, títulos, rótulos, campos obrigatórios/opcionais e mensagens exibidas no formulário do sorteio.
              </p>
            </div>
            <button
              type="submit"
              disabled={loadingAction}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Salvar Alterações
            </button>
          </div>

          {/* Section 1: Cabeçalho & Títulos do Formulário */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              1. Cabeçalho & Títulos (Assinalados em Verde)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Badge Superior do Cabeçalho
                </label>
                <input
                  type="text"
                  value={settings.formBadgeText || ''}
                  onChange={(e) => setSettings({ ...settings, formBadgeText: e.target.value })}
                  placeholder="Inscrição Oficial para o Sorteio"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Exibido na tag com brilho no topo do formulário.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Tag do Cartão de Inscrição
                </label>
                <input
                  type="text"
                  value={settings.formCardTag || ''}
                  onChange={(e) => setSettings({ ...settings, formCardTag: e.target.value })}
                  placeholder="Inscrição Direta"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Badge verde na lateral direita do formulário.</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título Principal do Sorteio
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Grande Sorteio Oficial de Tecnologia 2026"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Descrição / Apresentação do Sorteio
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Participe do maior sorteio comunitário do ano! Inscrição 100% gratuita..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título do Cartão do Formulário
                </label>
                <input
                  type="text"
                  value={settings.formCardTitle || ''}
                  onChange={(e) => setSettings({ ...settings, formCardTitle: e.target.value })}
                  placeholder="Formulário de Inscrição"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Subtítulo / Instrução do Cartão
                </label>
                <input
                  type="text"
                  value={settings.formCardSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, formCardSubtitle: e.target.value })}
                  placeholder="Insira os dados solicitados pelo administrador do aplicativo"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Campos de Entrada de Dados */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              2. Campos Solicitados aos Participantes (Assinalados em Verde)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo: Nome Completo */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Campo 1: Nome Completo (Obrigatório)</span>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rótulo do Campo (Label):</label>
                  <input
                    type="text"
                    value={settings.formNameLabel || ''}
                    onChange={(e) => setSettings({ ...settings, formNameLabel: e.target.value })}
                    placeholder="Nome Completo"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto de Exemplo (Placeholder):</label>
                  <input
                    type="text"
                    value={settings.formNamePlaceholder || ''}
                    onChange={(e) => setSettings({ ...settings, formNamePlaceholder: e.target.value })}
                    placeholder="Ex: Maria dos Santos Silva"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo: E-mail */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase">Campo 2: E-mail (Identificador Oficial)</span>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rótulo do Campo (Label):</label>
                  <input
                    type="text"
                    value={settings.formEmailLabel || ''}
                    onChange={(e) => setSettings({ ...settings, formEmailLabel: e.target.value })}
                    placeholder="E-mail"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto de Exemplo (Placeholder):</label>
                  <input
                    type="text"
                    value={settings.formEmailPlaceholder || ''}
                    onChange={(e) => setSettings({ ...settings, formEmailPlaceholder: e.target.value })}
                    placeholder="Ex: seu.nome@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto de Ajuda / Nota Abaixo do Campo:</label>
                  <input
                    type="text"
                    value={settings.formEmailHelpText || ''}
                    onChange={(e) => setSettings({ ...settings, formEmailHelpText: e.target.value })}
                    placeholder="Inscrição direta sem código de verificação por e-mail."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo: Telefone / WhatsApp */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Campo 3: Telefone / WhatsApp</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, formEnablePhone: settings.formEnablePhone === false })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        settings.formEnablePhone !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {settings.formEnablePhone !== false ? 'Visível' : 'Oculto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, requirePhone: !settings.requirePhone })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        settings.requirePhone ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {settings.requirePhone ? 'Obrigatório' : 'Opcional'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rótulo do Campo (Label):</label>
                  <input
                    type="text"
                    value={settings.formPhoneLabel || ''}
                    onChange={(e) => setSettings({ ...settings, formPhoneLabel: e.target.value })}
                    placeholder="Telefone / WhatsApp"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto de Exemplo (Placeholder):</label>
                  <input
                    type="text"
                    value={settings.formPhonePlaceholder || ''}
                    onChange={(e) => setSettings({ ...settings, formPhonePlaceholder: e.target.value })}
                    placeholder="Ex: (11) 98765-4321 ou +244 9..."
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Campo: Cidade / Estado / Localidade */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Campo 4: Cidade / Província / Estado</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, formEnableCity: settings.formEnableCity === false })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        settings.formEnableCity !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {settings.formEnableCity !== false ? 'Visível' : 'Oculto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, requireCity: !settings.requireCity })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        settings.requireCity ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {settings.requireCity ? 'Obrigatório' : 'Opcional'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rótulo do Campo (Label):</label>
                  <input
                    type="text"
                    value={settings.formCityLabel || ''}
                    onChange={(e) => setSettings({ ...settings, formCityLabel: e.target.value })}
                    placeholder="Cidade / Província / Estado"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Texto de Exemplo (Placeholder):</label>
                  <input
                    type="text"
                    value={settings.formCityPlaceholder || ''}
                    onChange={(e) => setSettings({ ...settings, formCityPlaceholder: e.target.value })}
                    placeholder="Ex: São Paulo - SP ou Luanda"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Botão de Envio & Regulamento / Rodapé */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. Botão de Envio, Regulamento & Rodapé (Assinalados em Verde)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Texto do Botão de Inscrição
                </label>
                <input
                  type="text"
                  value={settings.formSubmitButtonText || ''}
                  onChange={(e) => setSettings({ ...settings, formSubmitButtonText: e.target.value })}
                  placeholder="Confirmar Inscrição no Sorteio"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Título da Seção de Regulamento
                </label>
                <input
                  type="text"
                  value={settings.rulesTitle || ''}
                  onChange={(e) => setSettings({ ...settings, rulesTitle: e.target.value })}
                  placeholder="Regulamento do Sorteio"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Texto do Link de Consulta de Bilhete
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.checkTicketText || ''}
                    onChange={(e) => setSettings({ ...settings, checkTicketText: e.target.value })}
                    placeholder="Consultar meu bilhete"
                    className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, showCheckTicketLink: settings.showCheckTicketLink === false })}
                    className={`text-[10px] font-bold px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                      settings.showCheckTicketLink !== false ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {settings.showCheckTicketLink !== false ? 'Ativo' : 'Oculto'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Texto do Regulamento / Instruções (Exibido no rodapé do formulário)
                </label>
                <textarea
                  rows={3}
                  value={settings.rulesText || ''}
                  onChange={(e) => setSettings({ ...settings, rulesText: e.target.value })}
                  placeholder="1. Cada participante tem direito a 1 único bilhete numerado..."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="md:col-span-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="block text-xs font-semibold text-indigo-400 uppercase mb-1">
                  URL Base Pública para o QR Code Impresso em Papel
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Esta é a URL que será embutida no QR Code impresso no papel. Deixe em branco para usar o endereço do servidor detectado automaticamente.
                </p>
                <input
                  type="text"
                  value={settings.customPublicUrl || ''}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setSettings({ ...settings, customPublicUrl: e.target.value });
                  }}
                  placeholder={serverPublicUrl || 'https://...'}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs outline-none font-mono focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Todas as alterações são salvas diretamente na base de dados central.
            </span>
            <button
              type="submit"
              disabled={loadingAction}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Salvar Todas as Informações
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB: CARTAZ QR CODE PARA PAPEL (A4) ================= */}
      {adminTab === 'poster' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1.5">
                <Printer className="w-3.5 h-3.5" />
                Formato para Impressão em Papel (A4 / Folha de Inscrição)
              </div>
              <h2 className="text-xl font-black text-white">Cartaz Oficial de Inscrição</h2>
              <p className="text-xs text-slate-400">
                Imprima este cartaz oficial em papel para que os participantes possam escanear direto pelo telemóvel e abrir o formulário.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenPrintPoster) {
                    onOpenPrintPoster();
                  } else {
                    window.print();
                  }
                }}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir em Papel (A4)
              </button>
            </div>
          </div>

          <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-slate-200 shadow-xl">
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-200">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 uppercase tracking-widest mb-2">
                {settings.formBadgeText || 'Inscrição Oficial para o Sorteio'}
              </span>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                {title}
              </h1>
              <p className="text-xs text-slate-600 mt-1.5">
                {description}
              </p>
            </div>

            <div className="py-6 text-center">
              <div className="inline-block p-4 rounded-3xl bg-slate-50 border-4 border-indigo-600 shadow-lg mb-2">
                <AdminPosterQRCode targetUrl={`${(settings.customPublicUrl?.trim() || serverPublicUrl || window.location.origin).replace(/\/$/, '')}/?portal=participante`} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  Aponte a câmara do telemóvel para se inscrever
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-t-2 border-b-2 border-dashed border-slate-200 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">1</span>
                <p className="font-bold text-slate-800">Aponte a Câmara</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">2</span>
                <p className="font-bold text-slate-800">Preencha o Formulário</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] inline-flex items-center justify-center mb-1">3</span>
                <p className="font-bold text-slate-800">Receba seu Bilhete</p>
              </div>
            </div>

            <div className="mt-3 text-center text-[10px] font-mono text-slate-500 break-all">
              {`${(settings.customPublicUrl?.trim() || serverPublicUrl || window.location.origin).replace(/\/$/, '')}/?portal=participante`}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: DADOS & TEXTOS GERAIS ================= */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveFullConfig} noValidate className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">Identidade & Conteúdo do Sorteio</h2>
            <p className="text-xs text-slate-400">Configure os textos exibidos na tela principal e nos bilhetes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Título do Sorteio
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Descrição e Apresentação
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Nome da Empresa / Organizador
              </label>
              <input
                type="text"
                value={settings.organizerName}
                onChange={(e) => setSettings({ ...settings, organizerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                E-mail de Contato / Suporte
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Telefone / WhatsApp de Suporte
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Banner de Anúncio no Topo
              </label>
              <input
                type="text"
                value={settings.announcementBanner}
                onChange={(e) => setSettings({ ...settings, announcementBanner: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Regulamento Oficial & Instruções (Uma por linha)
              </label>
              <textarea
                rows={4}
                value={settings.rulesText}
                onChange={(e) => setSettings({ ...settings, rulesText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loadingAction}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 3: GERENCIAR PRÊMIOS ================= */}
      {adminTab === 'prizes' && (
        <div className="space-y-6">
          {/* Add Prize Form */}
          <form onSubmit={handleAddPrize} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Adicionar Novo Prêmio à Disputa
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Defina o nome do prêmio, o valor estimado e a <strong>quantidade de unidades em disputa</strong> que serão sorteadas.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Título do Prêmio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Notebook Gamer Ultra / iPhone 16"
                  value={newPrizeTitle}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setNewPrizeTitle(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Quantidade em Disputa
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newPrizeQty}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setNewPrizeQty(Math.max(1, parseInt(e.target.value) || 1));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Valor Estimado (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: R$ 5.000,00"
                  value={newPrizeVal}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setNewPrizeVal(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                  Descrição ou Regras do Prêmio
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cor preta, 512GB SSD, garantia de 1 ano do fabricante"
                  value={newPrizeDesc}
                  onChange={(e) => {
                    hasUserEdited.current = true;
                    setNewPrizeDesc(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Incluir Prêmio
                </button>
              </div>
            </div>
          </form>

          {/* List of current prizes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  Prêmios Cadastrados ({prizes.length} categorias • {prizes.reduce((sum, p) => sum + (p.quantity || 1), 0)} itens no total em disputa)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste as quantidades usando os botões <strong>+</strong> e <strong>-</strong> e clique em Gravar Alterações.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSaveFullConfig()}
                disabled={loadingAction}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Save className="w-4 h-4" />
                {loadingAction ? 'Gravando...' : 'Gravar Prêmios e Quantidades'}
              </button>
            </div>

            {prizes.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                Nenhum prêmio cadastrado. Utilize o formulário acima para adicionar os prêmios em disputa.
              </div>
            ) : (
              <div className="space-y-3">
                {prizes.map((p, idx) => {
                  const qty = typeof p.quantity === 'number' && p.quantity > 0 ? p.quantity : 1;
                  const winnersForPrize = raffle.winners.filter((w) => w.prizeId === p.id);
                  const isFullyDrawn = winnersForPrize.length >= qty;

                  return (
                    <div
                      key={p.id}
                      className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {p.rank}º
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-white text-sm">{p.title}</h4>
                            <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md text-[11px] border border-amber-500/30">
                              Qtd: {qty} {qty === 1 ? 'unidade' : 'unidades'} em disputa
                            </span>
                            {p.estimatedValue && (
                              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                {p.estimatedValue}
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p className="text-xs text-slate-400 mt-1">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Qtd:</span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePrizeQty(p.id, -1)}
                            disabled={qty <= 1}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                            title="Diminuir quantidade"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) => handleSetPrizeQtyDirect(p.id, parseInt(e.target.value) || 1)}
                            className="w-12 text-center bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg py-1 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdatePrizeQty(p.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                            title="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>

                        {/* Status / Remove */}
                        <div className="flex items-center gap-2">
                          {winnersForPrize.length > 0 && (
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              {winnersForPrize.length}/{qty} Ganhadores
                            </span>
                          )}

                          {winnersForPrize.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePrize(p.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Remover prêmio"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveFullConfig()}
                disabled={loadingAction}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4" />
                {loadingAction ? 'Gravando na Base de Dados...' : 'Salvar Alterações de Prêmios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: CALENDÁRIO & RELÓGIO DE TEMPO ================= */}
      {adminTab === 'schedule' && (
        <form onSubmit={handleSaveFullConfig} noValidate className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                Calendário dos Dias de Sorteio & Relógio de Tempo
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure as datas e horários em que o sorteio será realizado e o relógio de contagem regressiva exibido aos participantes.
              </p>
            </div>

            <button
              type="submit"
              disabled={loadingAction}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
            >
              <Save className="w-4 h-4" />
              {loadingAction ? 'Gravando...' : 'Gravar Calendário & Relógio'}
            </button>
          </div>

          {/* Interactive Live Preview */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pré-visualização em Tempo Real (Como os participantes veem)
            </span>
            <CountdownClock
              drawDate={settings.drawDate || '2026-05-15'}
              drawTime={settings.drawTime || '20:00'}
              drawDateTime={settings.drawDateTime}
              drawLocation={settings.drawLocation || 'Transmissão Ao Vivo'}
              drawTimezone={settings.drawTimezone || 'America/Sao_Paulo'}
              title={settings.countdownTitle || 'Contagem Regressiva para o Sorteio'}
              customMessage={settings.countdownMessage}
              showCalendarBadge={settings.showDrawCalendar !== false}
              variant="card"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            {/* Toggle Countdown Timer */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-xs uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Ativar Relógio de Tempo (Contagem Regressiva)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Exibe o cronômetro em tempo real (dias, horas, minutos, segundos) até o momento do sorteio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  hasUserEdited.current = true;
                  setSettings({
                    ...settings,
                    showCountdownTimer: settings.showCountdownTimer === false ? true : false,
                  });
                }}
                className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                  settings.showCountdownTimer !== false ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.showCountdownTimer !== false ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Toggle Calendar Badge */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-xs uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Exibir Calendário de Dias de Sorteio
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Mostra a data e hora formatada em destaque nos bilhetes e no formulário de inscrição.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  hasUserEdited.current = true;
                  setSettings({
                    ...settings,
                    showDrawCalendar: settings.showDrawCalendar === false ? true : false,
                  });
                }}
                className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                  settings.showDrawCalendar !== false ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform absolute top-1 ${
                    settings.showDrawCalendar !== false ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Draw Date Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Data do Sorteio (Dia / Mês / Ano)
              </label>
              <input
                type="date"
                required
                value={settings.drawDate || '2026-05-15'}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, drawDate: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Data oficial em que a urna ou roleta será acionada.</p>
            </div>

            {/* Draw Time Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Hora do Sorteio
              </label>
              <input
                type="time"
                required
                value={settings.drawTime || '20:00'}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, drawTime: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Horário de início da apuração ou transmissão.</p>
            </div>

            {/* Location / Streaming Channel */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Localização / Canal da Live
              </label>
              <input
                type="text"
                placeholder="Ex: Transmissão Ao Vivo no YouTube / Instagram @sorteiooficial"
                value={settings.drawLocation || ''}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, drawLocation: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Fuso Horário Oficial
              </label>
              <input
                type="text"
                placeholder="Ex: Horário de Brasília (UTC-3) ou Lisboa (WET)"
                value={settings.drawTimezone || 'Horário Oficial de Brasília (UTC-3)'}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, drawTimezone: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Countdown Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Título do Bloco de Contagem
              </label>
              <input
                type="text"
                placeholder="Ex: Faltam Poucos Dias para o Sorteio Oficial!"
                value={settings.countdownTitle || ''}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, countdownTitle: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Custom Message / Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Mensagem Adicional / Aviso de Transmissão
              </label>
              <input
                type="text"
                placeholder="Ex: Garanta já seu bilhete antes que as inscrições encerrem!"
                value={settings.countdownMessage || ''}
                onChange={(e) => {
                  hasUserEdited.current = true;
                  setSettings({ ...settings, countdownMessage: e.target.value });
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="submit"
              disabled={loadingAction}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              {loadingAction ? 'Gravando na Base de Dados...' : 'Gravar Calendário & Relógio na Base de Dados'}
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 4: REGRAS & VALIDAÇÃO ================= */}
      {adminTab === 'rules' && (
        <form onSubmit={handleSaveFullConfig} noValidate className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">Regras de Inscrição & Validação</h2>
            <p className="text-xs text-slate-400">Ajuste os parâmetros de validação e proteção do sorteio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            {/* Limit of registrations */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Limite Máximo de Participantes
              </label>
              <p className="text-xs text-slate-400 mb-2">Digite 0 para vagas ilimitadas.</p>
              <input
                type="number"
                min={0}
                value={settings.maxParticipants}
                onChange={(e) => setSettings({ ...settings, maxParticipants: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Inscrição Direta Info */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Validação Direta via QR Code
              </label>
              <p className="text-xs text-slate-300 mb-1">
                Inscrição simplificada ativa: participantes preenchem os dados solicitados e emitem o bilhete diretamente, sem necessidade de código por e-mail.
              </p>
              <span className="inline-block text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Sem código por e-mail (Ativo)
              </span>
            </div>

            {/* Require Phone Toggle */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-xs uppercase">Telefone / WhatsApp Obrigatório</p>
                <p className="text-xs text-slate-400 mt-0.5">Exige preenchimento de telefone no cadastro.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, requirePhone: !settings.requirePhone })}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  settings.requirePhone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {settings.requirePhone ? 'Obrigatório' : 'Opcional'}
              </button>
            </div>

            {/* Require City Toggle */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white text-xs uppercase">Cidade / Estado Obrigatório</p>
                <p className="text-xs text-slate-400 mt-0.5">Exige localização na inscrição.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, requireCity: !settings.requireCity })}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  settings.requireCity ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {settings.requireCity ? 'Obrigatório' : 'Opcional'}
              </button>
            </div>

            {/* Admin PIN */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                PIN de Segurança do Admin
              </label>
              <p className="text-xs text-slate-400 mb-2">Código para proteção do painel (Padrão: 1234).</p>
              <input
                type="text"
                value={settings.adminPin}
                onChange={(e) => setSettings({ ...settings, adminPin: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm outline-none font-mono focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loadingAction}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              Salvar Regras
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 5: PARTICIPANTES ================= */}
      {adminTab === 'participants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Participantes ({participants.length})</h2>
              <p className="text-xs text-slate-400">Gerencie e modere inscrições individuais</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedParticipants}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Adicionar Participantes Demo
              </button>

              <button
                type="button"
                onClick={() => exportParticipantsPDF(raffle, participants)}
                disabled={participants.length === 0}
                className="py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                Exportar PDF
              </button>

              <button
                onClick={handleExportCSV}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar CSV
              </button>

              <button
                onClick={handleClearAll}
                className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800/80 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Todos
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por bilhete, nome ou e-mail..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Bilhete</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">E-mail (Completo)</th>
                  <th className="py-3 px-4">Cidade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum participante encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => {
                    const won = (raffle.winners || []).find((w) => w.ticketNumber === p.ticketNumber);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">{p.ticketNumber}</td>
                        <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                        <td className="py-3 px-4 font-mono font-medium text-amber-200 select-all break-all">{p.email || p.emailMasked}</td>
                        <td className="py-3 px-4 text-slate-400">{p.city || '-'}</td>
                        <td className="py-3 px-4">
                          {won ? (
                            <span className="text-amber-300 font-bold">🏆 {won.prizeTitle}</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Ativo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => onViewTicket(p.ticketNumber)}
                            className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                          >
                            Ver QR
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p.id, p.ticketNumber)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer font-medium"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: AUDITORIA DE E-MAILS ================= */}
      {adminTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Auditoria de Validação por E-mail</h2>
              <p className="text-xs text-slate-400">Histórico de códigos gerados e registros de envio</p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar Logs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Verification Codes */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Códigos Ativos Aguardando Confirmação
              </h3>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2 max-h-80 overflow-y-auto">
                {emailAudit.activeCodes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhum código ativo no momento.</p>
                ) : (
                  emailAudit.activeCodes.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-slate-300">{c.email}</span>
                        <span className="text-[10px] text-slate-500 block">Expira em {c.expiresInSec}s</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-sm">
                        {c.code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Email Dispatch History */}
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400" />
                Histórico Recente de Disparos
              </h3>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-3 space-y-2 max-h-80 overflow-y-auto">
                {emailAudit.emailLog.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Nenhum registro de envio.</p>
                ) : (
                  emailAudit.emailLog.map((log, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-200">{log.email}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {new Date(log.sentAt).toLocaleTimeString('pt-BR')} • {new Date(log.sentAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        Código: {log.code}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
