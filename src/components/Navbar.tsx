import React from 'react';
import { Wallet, RefreshCw, Settings, Plus, ExternalLink, CloudCheck, CloudOff, FileSpreadsheet } from 'lucide-react';
import { SyncSettings } from '../types';

interface NavbarProps {
  settings: SyncSettings;
  isSyncing: boolean;
  onOpenNewTransaction: () => void;
  onOpenSettings: () => void;
  onManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  isSyncing,
  onOpenNewTransaction,
  onOpenSettings,
  onManualSync,
}) => {
  const isConnected = Boolean(settings.webAppUrl && settings.webAppUrl.trim());

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
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
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Sync status indicator & button */}
            <button
              id="sync-sheet-btn"
              onClick={onManualSync}
              disabled={isSyncing}
              title={isConnected ? 'Synchroniser avec votre Google Sheet' : 'Configurer Google Sheet'}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isConnected
                  ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? 'Synchronisation...' : isConnected ? 'Synchroniser Sheet' : 'Lier Sheet'}
              </span>
            </button>

            {/* Config modal button */}
            <button
              id="open-settings-btn"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200/80"
              title="Configurer Google Sheet & Netlify"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Google Sheet & Netlify</span>
            </button>

            {/* Add transaction button */}
            <button
              id="add-transaction-btn"
              onClick={onOpenNewTransaction}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/25 transition-all cursor-pointer"
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
