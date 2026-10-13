import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Copy, Check, ExternalLink, X, Sparkles, ShieldCheck } from 'lucide-react';

interface MobileJoinQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleTitle: string;
}

export const MobileJoinQRModal: React.FC<MobileJoinQRModalProps> = ({
  isOpen,
  onClose,
  raffleTitle,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=participante`
    : '';

  useEffect(() => {
    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating mobile join QR code:', err));
    }
  }, [targetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <Smartphone className="w-7 h-7 text-white" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Acesso Móvel: Inscrição & Consulta de Ganhadores
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
          Escanear com o Telemóvel
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
          Aponte a câmera do seu telemóvel para abrir diretamente o formulário de inscrição e consultar os ganhadores do prêmio!
        </p>

        {/* QR Code Container */}
        <div className="my-6 p-4 bg-white rounded-3xl inline-block shadow-2xl shadow-indigo-950/60 border-4 border-indigo-500/20">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code de Acesso para Telemóvel"
              className="w-56 h-56 mx-auto rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
              <QrCode className="w-16 h-16 text-slate-400 animate-pulse" />
            </div>
          )}
        </div>

        {/* Direct Link and instructions */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs mb-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Link Direto da Aplicação:</span>
          <p className="font-mono text-slate-300 text-[11px] truncate mb-2 select-all">
            {targetUrl}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </button>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Funciona em qualquer smartphone sem precisar instalar nada</span>
        </div>
      </div>
    </div>
  );
};
