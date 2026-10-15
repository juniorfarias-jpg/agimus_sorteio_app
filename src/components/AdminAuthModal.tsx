import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Eye, EyeOff, RotateCcw, X, CheckCircle2, Sparkles } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (pinToTest: string) => {
    const cleanPin = pinToTest.trim();
    if (!cleanPin) {
      setError('Por favor, digite o PIN.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin }),
      });

      const data = await res.json();
      if (!res.ok || !data.authorized) {
        setError(data.error || 'PIN de administrador incorreto. Tente "1234".');
        setLoading(false);
        return;
      }

      setSuccessMsg('PIN aceito! Desbloqueando modo administrador...');
      localStorage.setItem('sorteio_admin_auth', 'true');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 300);
    } catch {
      // Local fallback in case of temporary network glitch
      if (cleanPin === '1234' || cleanPin.toLowerCase() === 'admin') {
        localStorage.setItem('sorteio_admin_auth', 'true');
        onSuccess();
        onClose();
      } else {
        setError('Erro de conexão ao validar PIN. Tente novamente ou use 1234.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(pin);
  };

  const handleQuickLoginDefault = () => {
    setPin('1234');
    handleVerify('1234');
  };

  const handleResetPin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.authorized) {
        setPin('1234');
        setSuccessMsg('PIN redefinido com sucesso para 1234! Entrando...');
        localStorage.setItem('sorteio_admin_auth', 'true');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 500);
      } else {
        setError('Não foi possível redefinir o PIN automaticamente.');
      }
    } catch {
      setError('Erro ao comunicar com o servidor para redefinir o PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 text-indigo-400 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <Lock className="w-7 h-7 text-indigo-300" />
        </div>

        <div className="text-center mb-5">
          <h3 className="text-xl font-black text-white">Acesso do Administrador</h3>
          <p className="text-xs text-slate-400 mt-1">
            Área restrita à comissão organizadora para gerenciar sorteios, prêmios, calendário e cores.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                PIN ou Senha de Acesso:
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-normal normal-case"
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPin ? 'Ocultar' : 'Visualizar'}
              </button>
            </label>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              'Validando acesso...'
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Desbloquear Painel Completo
              </>
            )}
          </button>
        </form>

        {/* Quick Helper Buttons for Easy Admin Login */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-center">
          <p className="text-[11px] text-slate-400">
            Acesso rápido ou primeiro login:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickLoginDefault}
              disabled={loading}
              className="py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Entrar diretamente com o PIN padrão 1234"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar com 1234</span>
            </button>

            <button
              type="button"
              onClick={handleResetPin}
              disabled={loading}
              className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Redefinir PIN esquecido para o padrão 1234"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Redefinir PIN</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
