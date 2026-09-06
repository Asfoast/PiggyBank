import React from 'react';
import { RefreshCw, Plus, FileSpreadsheet, Check, Repeat, Download } from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncSettings } from '../types';

interface NavbarProps {
  settings: SyncSettings;
  user: User | null;
  isSyncing: boolean;
  activeRecurringCount: number;
  onOpenNewTransaction: () => void;
  onOpenSettings: () => void;
  onOpenGoogleDriveModal: () => void;
  onOpenRecurringModal: () => void;
  onOpenInstallModal: () => void;
  onManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  user,
  isSyncing,
  activeRecurringCount,
  onOpenNewTransaction,
  onOpenSettings,
  onOpenGoogleDriveModal,
  onOpenRecurringModal,
  onOpenInstallModal,
  onManualSync,
}) => {
  const isOauthConnected = Boolean(user && settings.spreadsheetId);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="/icon.png"
                alt="PiggyBank Logo"
                className="w-10 h-10 rounded-xl shadow-xs border border-pink-200 bg-pink-50 p-0.5 object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center">
                  PiggyBank
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-50 text-pink-700 border border-pink-200">
                  Budget & Abos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Synchronisé avec Google Sheets • Installable sur mobile
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Install PWA Button (Mobile & Desktop) */}
            <button
              id="install-pwa-btn"
              onClick={onOpenInstallModal}
              title="Installer PiggyBank sur smartphone"
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Installer l'app</span>
            </button>

            {/* Recurring Subscriptions Button */}
            <button
              id="recurring-subscriptions-btn"
              onClick={onOpenRecurringModal}
              title="Gérer les abonnements & récurrences"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-pink-800 bg-pink-50 hover:bg-pink-100 border border-pink-200 transition-colors cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5 text-pink-600" />
              <span className="hidden md:inline">Abonnements</span>
              {activeRecurringCount > 0 && (
                <span className="px-1.5 py-0.2 bg-pink-600 text-white rounded-full text-[10px] font-bold">
                  {activeRecurringCount}
                </span>
              )}
            </button>

            {/* Google Drive / Sheets Link Button */}
            <button
              id="google-drive-nav-btn"
              onClick={onOpenGoogleDriveModal}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isOauthConnected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : user
                  ? 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title={
                isOauthConnected
                  ? `Connecté à : ${settings.spreadsheetName}`
                  : 'Lier mon compte Google et ma feuille Google Drive'
              }
            >
              {isOauthConnected ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline max-w-[120px] truncate font-bold">
                    {settings.spreadsheetName || 'Feuille Sheet'}
                  </span>
                  <span className="sm:hidden">Drive</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span className="hidden sm:inline">Compte Google</span>
                  <span className="sm:hidden">Google</span>
                </>
              )}
            </button>

            {/* Sync button */}
            <button
              id="sync-sheet-btn"
              onClick={onManualSync}
              disabled={isSyncing}
              title="Synchroniser avec Google Sheet"
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden lg:inline">{isSyncing ? 'Sync...' : 'Sync'}</span>
            </button>

            {/* Config & Netlify modal button */}
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80 cursor-pointer"
              title="Paramètres avancés & Déploiement"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Add transaction button */}
            <button
              id="add-transaction-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Transaction</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
