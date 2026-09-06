import React from 'react';
import { Wallet, RefreshCw, Plus, FileSpreadsheet, Check, Cloud } from 'lucide-react';
import { User } from 'firebase/auth';
import { SyncSettings } from '../types';

interface NavbarProps {
  settings: SyncSettings;
  user: User | null;
  isSyncing: boolean;
  onOpenNewTransaction: () => void;
  onOpenSettings: () => void;
  onOpenGoogleDriveModal: () => void;
  onManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  user,
  isSyncing,
  onOpenNewTransaction,
  onOpenSettings,
  onOpenGoogleDriveModal,
  onManualSync,
}) => {
  const isOauthConnected = Boolean(user && settings.spreadsheetId);
  const isScriptConnected = Boolean(settings.webAppUrl && settings.webAppUrl.trim());
  const isAnyConnected = isOauthConnected || isScriptConnected;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Fintim</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Suivi de Budget
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Synchronisé avec Google Sheets • Hébergé sur Netlify
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Google Drive / Sheets Link Button */}
            <button
              id="google-drive-nav-btn"
              onClick={onOpenGoogleDriveModal}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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
                  <span className="hidden sm:inline max-w-[130px] truncate font-bold">
                    {settings.spreadsheetName || 'Feuille Sheet'}
                  </span>
                  <span className="sm:hidden">Drive</span>
                </>
              ) : user ? (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                  <span>Choisir ma feuille</span>
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
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden md:inline">{isSyncing ? 'Synchronisation...' : 'Synchroniser'}</span>
            </button>

            {/* Config & Netlify modal button */}
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200/80 cursor-pointer"
              title="Paramètres & Déploiement Netlify"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>

            {/* Add transaction button */}
            <button
              id="add-transaction-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle transaction</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
