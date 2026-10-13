import React, { useState } from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Users,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Mail,
  AlertTriangle,
  QrCode,
  Plus,
  Trash2,
} from 'lucide-react';
import { Prize, Raffle } from '../types.ts';

interface AdminPanelProps {
  raffle: Raffle;
  participants: Array<{ id: string; ticketNumber: string; name: string; emailMasked: string; city: string; registeredAt: string }>;
  onViewTicket: (ticketNum: string) => void;
  onRefreshState: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  raffle,
  participants,
  onViewTicket,
  onRefreshState,
}) => {
  const [search, setSearch] = useState('');
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(
    raffle.prizes.find((p) => !raffle.winners.some((w) => w.prizeId === p.id))?.id || raffle.prizes[0]?.id || ''
  );
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Toggle registrations
  const handleToggleRegistration = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/toggle-registration', { method: 'POST' });
      if (res.ok) {
        onRefreshState();
        setActionMessage('Status de inscrições alterado!');
      }
    } catch {
      setActionMessage('Erro ao alternar status.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Start suspense animation and pick winner
  const handleDrawPrize = async (prizeIdToDraw: string) => {
    if (!prizeIdToDraw) return;
    setLoadingAction(true);
    setActionMessage('Iniciando sorteio ao vivo...');

    try {
      // 1. Broadcast animation start to all viewers
      await fetch('/api/admin/start-draw-animation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizeId: prizeIdToDraw }),
      });

      // 2. Wait 4.5 seconds for dramatic roulette suspense
      setTimeout(async () => {
        try {
          const res = await fetch('/api/admin/draw-winner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prizeId: prizeIdToDraw }),
          });
          const data = await res.json();
          if (res.ok) {
            setActionMessage(`🎉 Parabéns! ${data.winner.participantName} ganhou o ${data.winner.prizeTitle}!`);
            onRefreshState();
          } else {
            setActionMessage(`Erro: ${data.error}`);
          }
        } catch {
          setActionMessage('Erro ao selecionar ganhador no servidor.');
        } finally {
          setLoadingAction(false);
        }
      }, 4000);
    } catch {
      setActionMessage('Falha ao comunicar com o servidor.');
      setLoadingAction(false);
    }
  };

  // Reset winners
  const handleResetWinners = async () => {
    if (!confirm('Deseja realmente reiniciar todos os ganhadores deste sorteio?')) return;
    setLoadingAction(true);
    try {
      const res = await fetch('/api/admin/reset-winners', { method: 'POST' });
      if (res.ok) {
        setActionMessage('Ganhadores reiniciados!');
        onRefreshState();
      }
    } catch {
      setActionMessage('Erro ao reiniciar.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Bilhete', 'Nome', 'Email', 'Cidade', 'Data Inscrição'];
    const rows = participants.map((p) => [
      p.ticketNumber,
      `"${p.name.replace(/"/g, '""')}"`,
      p.emailMasked,
      `"${(p.city || '').replace(/"/g, '""')}"`,
      p.registeredAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `participantes-sorteio-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter participants
  const filteredParticipants = participants.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.ticketNumber.toLowerCase().includes(q) ||
      p.emailMasked.toLowerCase().includes(q)
    );
  });

  const availablePrizes = raffle.prizes.filter((p) => !raffle.winners.some((w) => w.prizeId === p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Controle do Organizador
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Painel Administrativo do Sorteio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie inscrições, realize sorteios ao vivo e visualize a base de participantes.
          </p>
        </div>

        {/* Global toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleRegistration}
            disabled={loadingAction}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
              raffle.allowRegistrations
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
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
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* DRAW CONTROL CENTER */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Central de Sorteio ao Vivo</h2>
            <p className="text-xs text-slate-400">
              Dispara a roleta animada sincronizada em todas as telas dos participantes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Select prize to draw */}
          <div className="md:col-span-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Selecione o Prêmio para Sortear Agora:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedPrizeId}
                onChange={(e) => setSelectedPrizeId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                {availablePrizes.length === 0 ? (
                  <option value="">Todos os prêmios já foram sorteados!</option>
                ) : (
                  availablePrizes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.rank}º Lugar - {p.title}
                    </option>
                  ))
                )}
              </select>

              <button
                onClick={() => handleDrawPrize(selectedPrizeId)}
                disabled={loadingAction || availablePrizes.length === 0 || participants.length === 0}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-white" />
                {loadingAction ? 'Sorteando...' : 'Sortear Prêmio Selecionado!'}
              </button>
            </div>
            {participants.length === 0 && (
              <p className="text-xs text-rose-400 mt-2">
                Aviso: É necessário ter pelo menos 1 participante para realizar o sorteio.
              </p>
            )}
          </div>

          {/* Quick reset button */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Reiniciar Apuração</p>
              <p className="text-xs text-slate-400 mt-1">Limpa os ganhadores e reabre todos os prêmios para novo sorteio.</p>
            </div>
            <button
              onClick={handleResetWinners}
              disabled={loadingAction || raffle.winners.length === 0}
              className="mt-3 py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar Ganhadores
            </button>
          </div>
        </div>
      </div>

      {/* PARTICIPANTS DATABASE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Base de Participantes ({participants.length})
              </h2>
              <p className="text-xs text-slate-400">Todos os e-mails validados com chave única de bilhete</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome, bilhete ou e-mail..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Bilhete</th>
                <th className="py-3 px-4">Nome do Participante</th>
                <th className="py-3 px-4">E-mail (Validado)</th>
                <th className="py-3 px-4">Cidade</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Nenhum participante encontrado com o filtro aplicado.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => {
                  const won = raffle.winners.find((w) => w.ticketNumber === p.ticketNumber);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{p.ticketNumber}</td>
                      <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{p.emailMasked}</td>
                      <td className="py-3 px-4 text-slate-400">{p.city || '-'}</td>
                      <td className="py-3 px-4">
                        {won ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            🏆 Premiado ({won.prizeTitle})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Concorrendo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onViewTicket(p.ticketNumber)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Ver QR
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
    </div>
  );
};
