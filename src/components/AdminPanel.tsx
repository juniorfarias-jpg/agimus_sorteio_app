import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppSettings, Prize, Raffle } from '../types.ts';
import { exportParticipantsPDF, exportWinnersPDF } from '../utils/pdfExport.ts';

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
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  raffle,
  participants,
  onViewTicket,
  onRefreshState,
  onClose,
}) => {
  // Navigation inside Admin Panel
  const [adminTab, setAdminTab] = useState<'draw' | 'settings' | 'prizes' | 'rules' | 'participants' | 'audit'>('draw');

  // Form states for general configuration
  const [title, setTitle] = useState(raffle.title);
  const [description, setDescription] = useState(raffle.description);
  const [prizes, setPrizes] = useState<Prize[]>(raffle.prizes || []);

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
    }
  );

  // Sync state if raffle changes externally
  useEffect(() => {
    setTitle(raffle.title);
    setDescription(raffle.description);
    setPrizes(raffle.prizes);
    if (raffle.settings) {
      setSettings(raffle.settings);
    }
  }, [raffle]);

  // Operational states
  const [search, setSearch] = useState('');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(
    raffle.prizes.find((p) => !raffle.winners.some((w) => w.prizeId === p.id))?.id || raffle.prizes[0]?.id || ''
  );
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Prize modal/form
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeDesc, setNewPrizeDesc] = useState('');
  const [newPrizeVal, setNewPrizeVal] = useState('');

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
    if (e) e.preventDefault();
    setLoadingAction(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          prizes,
          settings,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess('Todas as configurações do aplicativo foram salvas com sucesso na base de dados!');
        onRefreshState();
      } else {
        setActionError(data.error || 'Erro ao salvar configurações.');
      }
    } catch (err: any) {
      setActionError('Falha ao comunicar com o servidor: ' + err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Add Prize
  const handleAddPrize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeTitle.trim()) return;

    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      rank: prizes.length + 1,
      title: newPrizeTitle.trim(),
      description: newPrizeDesc.trim() || undefined,
      estimatedValue: newPrizeVal.trim() || undefined,
    };

    const updated = [...prizes, newPrize];
    setPrizes(updated);
    setNewPrizeTitle('');
    setNewPrizeDesc('');
    setNewPrizeVal('');
    setActionSuccess(`Prêmio "${newPrize.title}" adicionado. Lembre-se de clicar em "Salvar Configurações".`);
  };

  // Remove Prize
  const handleRemovePrize = (id: string) => {
    if (raffle.winners.some((w) => w.prizeId === id)) {
      alert('Este prêmio já foi sorteado! Para removê-lo, reinicie os ganhadores primeiro.');
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

  const availablePrizes = prizes.filter((p) => !raffle.winners.some((w) => w.prizeId === p.id));

  const filteredParticipants = participants.filter((p) => {
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
                <span className="font-bold text-amber-400">{raffle.winners.length}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Prêmios Pendentes:</span>
                <span className="font-bold text-emerald-400">{availablePrizes.length}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleResetWinners}
                disabled={loadingAction || raffle.winners.length === 0}
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
                    {raffle.winners.map((w, idx) => {
                      const fullEmail =
                        w.participantEmail ||
                        participants.find((p) => p.ticketNumber === w.ticketNumber || p.id === w.participantId)?.email ||
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

      {/* ================= TAB 2: DADOS & TEXTOS ================= */}
      {adminTab === 'settings' && (
        <form onSubmit={handleSaveFullConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
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
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Adicionar Novo Prêmio à Disputa
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  placeholder="Título do Prêmio (Ex: Notebook Gamer Ultra)"
                  value={newPrizeTitle}
                  onChange={(e) => setNewPrizeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Valor Estimado (Ex: R$ 5.000,00)"
                  value={newPrizeVal}
                  onChange={(e) => setNewPrizeVal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Descrição opcional do prêmio"
                  value={newPrizeDesc}
                  onChange={(e) => setNewPrizeDesc(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Adicionar Prêmio
                </button>
              </div>
            </div>
          </form>

          {/* List of current prizes */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Lista de Prêmios Cadastrados ({prizes.length})</h3>
              <button
                onClick={() => handleSaveFullConfig()}
                className="py-1.5 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Salvar Ordem dos Prêmios
              </button>
            </div>

            <div className="space-y-3">
              {prizes.map((p, idx) => {
                const won = raffle.winners.find((w) => w.prizeId === p.id);
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-mono font-bold text-xs flex items-center justify-center">
                        {p.rank}º
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-sm">{p.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          {p.estimatedValue && <span className="text-emerald-400">{p.estimatedValue}</span>}
                          {p.description && <span>• {p.description}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {won ? (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          Sorteado: {won.participantName}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemovePrize(p.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Remover prêmio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: REGRAS & VALIDAÇÃO ================= */}
      {adminTab === 'rules' && (
        <form onSubmit={handleSaveFullConfig} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
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
                    const won = raffle.winners.find((w) => w.ticketNumber === p.ticketNumber);
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
