import React from 'react';
import { Gift } from 'lucide-react';
import { AppSettings } from '../types.ts';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  style: 'solid' | 'linear-to-b' | 'linear-to-br' | 'radial';
  isLight?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'dark-slate',
    name: 'Preto & Ardósia (Padrão)',
    primary: '#020617',
    secondary: '#0f172a',
    style: 'linear-to-b',
  },
  {
    id: 'midnight-blue',
    name: 'Azul Meia-Noite Profundo',
    primary: '#030712',
    secondary: '#0b1b3d',
    style: 'linear-to-br',
  },
  {
    id: 'royal-purple',
    name: 'Roxo Imperial & Índigo',
    primary: '#0b041a',
    secondary: '#200c42',
    style: 'linear-to-br',
  },
  {
    id: 'emerald-luxury',
    name: 'Verde Esmeralda Nobre',
    primary: '#021810',
    secondary: '#064e3b',
    style: 'linear-to-br',
  },
  {
    id: 'crimson-ruby',
    name: 'Rubi & Vinho Elegante',
    primary: '#1c0309',
    secondary: '#420814',
    style: 'linear-to-br',
  },
  {
    id: 'sunset-amber',
    name: 'Âmbar Dourado & Bronze',
    primary: '#170c02',
    secondary: '#361c06',
    style: 'linear-to-br',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Roxo Escuro',
    primary: '#050212',
    secondary: '#1c0338',
    style: 'radial',
  },
  {
    id: 'pure-charcoal',
    name: 'Carvão / Dark Minimal',
    primary: '#0f0f10',
    secondary: '#1a1a1c',
    style: 'linear-to-b',
  },
  {
    id: 'clean-light',
    name: 'Branco Prata (Tema Claro)',
    primary: '#f8fafc',
    secondary: '#e2e8f0',
    style: 'linear-to-b',
    isLight: true,
  },
];

export function getThemeStyles(settings?: AppSettings) {
  const primary = settings?.themeBgColorPrimary || '#020617';
  const secondary = settings?.themeBgColorSecondary || '#0f172a';
  const styleType = settings?.themeBgStyle || 'linear-to-b';
  const isLight = settings?.themePreset === 'clean-light' || settings?.themeTextColor === 'dark';

  let backgroundCss = `linear-gradient(180deg, ${primary} 0%, ${secondary} 100%)`;

  if (styleType === 'solid') {
    backgroundCss = primary;
  } else if (styleType === 'linear-to-br') {
    backgroundCss = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
  } else if (styleType === 'radial') {
    backgroundCss = `radial-gradient(circle at top center, ${secondary} 0%, ${primary} 85%)`;
  }

  return {
    style: {
      background: backgroundCss,
      minHeight: '100vh',
    } as React.CSSProperties,
    primary,
    secondary,
    isLight,
    textColorClass: isLight ? 'text-slate-900' : 'text-slate-100',
    cardBgClass: isLight
      ? 'bg-white/95 text-slate-900 border-slate-200 shadow-xl'
      : 'bg-slate-900/90 text-slate-100 border-slate-800 shadow-2xl backdrop-blur-md',
    headerBgClass: isLight
      ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900'
      : 'bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white',
  };
}

interface AppLogoProps {
  logoUrl?: string;
  logoText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subtitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  logoUrl,
  logoText,
  size = 'md',
  showText = true,
  className = '',
  subtitle,
}) => {
  const brandName = logoText?.trim() || 'Sorteio';

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
  };

  const imgSizeClasses = {
    sm: 'h-7 max-w-[120px]',
    md: 'h-10 max-w-[170px]',
    lg: 'h-14 max-w-[220px]',
    xl: 'h-20 max-w-[280px]',
  };

  const textClasses = {
    sm: 'text-sm font-black',
    md: 'text-lg font-extrabold',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  };

  if (logoUrl && logoUrl.trim()) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src={logoUrl}
          alt={brandName}
          className={`${imgSizeClasses[size]} object-contain rounded-xl shadow-md border border-white/10`}
        />
        {showText && (
          <div>
            <span className={`${textClasses[size]} tracking-tight block bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent`}>
              {brandName}
            </span>
            {subtitle && <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0`}
      >
        <Gift className="w-1/2 h-1/2 text-white animate-pulse" />
      </div>
      {showText && (
        <div>
          <div className="flex items-center gap-2">
            <span className={`${textClasses[size]} tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent`}>
              {brandName}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              OFICIAL
            </span>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};
