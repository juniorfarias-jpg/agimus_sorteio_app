import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Gift,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Raffle } from '../types.ts';

interface PrintableQRPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffle: Raffle;
  serverPublicUrl?: string;
}

export const PrintableQRPosterModal: React.FC<PrintableQRPosterModalProps> = ({
  isOpen,
  onClose,
  raffle,
  serverPublicUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Compute effective registration URL
  const baseDomain = customUrl.trim() || raffle.settings?.customPublicUrl?.trim() || serverPublicUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const cleanBase = baseDomain.replace(/\/$/, '');
  const targetRegistrationUrl = `${cleanBase}/?portal=participante`;

  useEffect(() => {
    if (raffle.settings?.customPublicUrl) {
      setCustomUrl(raffle.settings.customPublicUrl);
    } else if (serverPublicUrl) {
      setCustomUrl(serverPublicUrl);
    }
  }, [raffle.settings?.customPublicUrl, serverPublicUrl]);

  useEffect(() => {
    if (targetRegistrationUrl) {
      QRCode.toDataURL(targetRegistrationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 480,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Erro ao gerar QR Code para impressão:', err));
    }
  }, [targetRegistrationUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetRegistrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QRCode-Inscricao-${raffle.title.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto print:border-none print:shadow-none print:p-4 print:bg-white print:text-black">
        {/* Close Button (Hidden on Print) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Bar (Hidden on Print) */}
        <div className="print:hidden mb-6 pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Printer className="w-3.5 h-3.5" />
            Cartaz Oficial para Impressão em Papel (A4 / Folheto)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            QR Code Oficial de Inscrição
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Imprima este cartaz em papel para afixar no local do evento. Os participantes apontam a câmara do telemóvel para se inscreverem diretamente.
          </p>
        </div>

        {/* PRINTABLE POSTER CONTAINER */}
        <div
          ref={printAreaRef}
          className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-slate-200 shadow-md print:border-none print:shadow-none print:p-0"
        >
          {/* Header of the Poster with Custom Logo */}
          <div className="text-center pb-5 border-b-2 border-dashed border-slate-200">
            {raffle.settings?.logoUrl && (
              <div className="mb-3 flex justify-center">
                <img
                  src={raffle.settings.logoUrl}
                  alt={raffle.settings?.logoText || 'Logo'}
                  className="max-h-16 max-w-[220px] object-contain"
                />
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {raffle.settings?.formBadgeText || 'Inscrição Oficial para o Sorteio'}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {raffle.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
              {raffle.description || 'Aponte a câmara do seu telemóvel para o QR Code abaixo para preencher o formulário e concorrer aos prêmios!'}
            </p>

            {raffle.settings?.organizerName && (
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Organizado por: {raffle.settings.organizerName}
              </p>
            )}
          </div>

          {/* QR Code Highlight Area */}
          <div className="py-6 text-center">
            <div className="inline-block p-4 rounded-3xl bg-slate-50 border-4 border-indigo-600 shadow-xl mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Oficial de Inscrição"
                  className="w-56 h-56 sm:w-64 sm:h-64 mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                  Carregando QR Code...
                </div>
              )}
            </div>

            <div className="max-w-md mx-auto">
              <span className="inline-flex items-center gap-2 text-base sm:text-lg font-black text-slate-900 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-300 shadow-sm">
                <Smartphone className="w-5 h-5 text-indigo-600 animate-pulse" />
                Aponte a câmara do telemóvel aqui
              </span>
            </div>
          </div>

          {/* 3 Step Instruction Banner */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 py-4 border-t-2 border-b-2 border-dashed border-slate-200 text-center">
            <div className="p-2 sm:p-3 rounded-xl bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                1
              </span>
              <p className="text-xs font-bold text-slate-800">Aponte a Câmara</p>
              <p className="text-[10px] text-slate-500 leading-tight">Escaneie o código com seu telemóvel</p>
            </div>

            <div className="p-2 sm:p-3 rounded-xl bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                2
              </span>
              <p className="text-xs font-bold text-slate-800">Preencha os Dados</p>
              <p className="text-[10px] text-slate-500 leading-tight">Inscrição direta sem complicação</p>
            </div>

            <div className="p-2 sm:p-3 rounded-xl bg-slate-50">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs inline-flex items-center justify-center mb-1">
                3
              </span>
              <p className="text-xs font-bold text-slate-800">Guarde seu Bilhete</p>
              <p className="text-[10px] text-slate-500 leading-tight">Acompanhe a apuração ao vivo</p>
            </div>
          </div>

          {/* Footer of the Poster */}
          <div className="mt-4 pt-2 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Inscrição oficial auditada pelo sistema</span>
            </div>
            <div className="font-mono text-[10px] text-slate-600 break-all text-center sm:text-right">
              {targetRegistrationUrl}
            </div>
          </div>
        </div>

        {/* Action Controls (Hidden on Print) */}
        <div className="print:hidden mt-6 pt-4 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir em Papel (A4)
            </button>

            <button
              onClick={handleDownloadImage}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              title="Baixar imagem PNG em alta resolução para usar em panfletos ou Word"
            >
              <Download className="w-4 h-4" />
              Baixar Imagem PNG
            </button>

            <button
              onClick={handleCopy}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link'}
            </button>
          </div>

          {/* URL Configuration Accordion */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                <span>Link do QR Code:</span>
                <span className="font-mono text-indigo-400 select-all">{targetRegistrationUrl}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {isEditingUrl ? 'Fechar' : 'Alterar Domínio/URL'}
              </button>
            </div>

            {isEditingUrl && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">
                  URL base pública para o QR Code (caso use domínio próprio ou proxy externo):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://seu-dominio.com"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingUrl(false)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Atualizar QR Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
