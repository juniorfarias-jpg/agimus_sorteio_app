import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, ArrowRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setError(data.error || 'PIN de administrador inválido.');
        setLoading(false);
        return;
      }

      localStorage.setItem('sorteio_admin_auth', 'true');
      onSuccess();
      onClose();
    } catch {
      setError('Erro de conexão ao validar PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <Lock className="w-7 h-7" />
        </div>

        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-white">Acesso do Administrador</h3>
          <p className="text-xs text-slate-400 mt-1">
            Área restrita à comissão organizadora. Insira o PIN de segurança para gerenciar o sorteio, ver participantes e realizar apurações.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              PIN de Administrador:
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Digite o PIN (Padrão: 1234)"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:text-xs placeholder:tracking-normal"
            />
            <p className="text-[11px] text-slate-500 text-center mt-1.5">
              PIN padrão inicial: <span className="text-amber-400 font-mono font-bold">1234</span> (alterável nas configurações)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              'Validando...'
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Desbloquear Painel Completo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
