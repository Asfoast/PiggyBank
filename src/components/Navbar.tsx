import React from 'react';
import { RefreshCw, Plus, FileSpreadsheet, Check, Repeat, Settings, ExternalLink } from 'lucide-react';
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
  onOpenSheetDirectly: () => void;
  onOpenRecurringModal: () => void;
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
  onOpenSheetDirectly,
  onOpenRecurringModal,
  onManualSync,
}) => {
  const isSheetConfigured = Boolean(settings.spreadsheetId);

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

            {/* Google Sheets Tab Button: opens the sheet directly if configured */}
            <button
              id="google-sheet-tab-btn"
              onClick={onOpenSheetDirectly}
              className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSheetConfigured
                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs'
              }`}
              title={
                isSheetConfigured
                  ? `Ouvrir la feuille Google Sheet : ${settings.spreadsheetName || 'Base de transactions'}`
                  : 'Lier ou choisir une feuille Google Sheet'
              }
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline font-bold max-w-[130px] truncate">
                {settings.spreadsheetName || 'Feuille Sheet'}
              </span>
              <span className="sm:hidden font-semibold">Sheets</span>
              {isSheetConfigured ? (
                <ExternalLink className="w-3 h-3 text-emerald-700 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
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

            {/* Paramètres Tab Button (Replaces "Appli" / Config) */}
            <button
              id="nav-settings-btn"
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
              title="Paramètres : Télécharger l'app, Catégories, Google et Déploiement"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Paramètres</span>
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
