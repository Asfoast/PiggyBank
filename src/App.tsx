import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { TransactionList } from './components/TransactionList';
import { BudgetCharts } from './components/BudgetCharts';
import { TransactionFormModal } from './components/TransactionFormModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { GoogleDriveSheetPickerModal } from './components/GoogleDriveSheetPickerModal';
import { Transaction, SyncSettings } from './types';
import { User } from 'firebase/auth';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredSettings,
  saveStoredSettings,
  INITIAL_TRANSACTIONS,
} from './services/storage';
import { fetchSheetTransactions, pushTransactionToSheet } from './services/googleSheetService';
import { initAuth } from './services/googleAuth';
import {
  loadTransactionsFromSpreadsheet,
  appendTransactionToSpreadsheet,
} from './services/googleDriveSheets';
import { AlertCircle, CheckCircle2, Info, FileSpreadsheet, Check } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [settings, setSettings] = useState<SyncSettings>(getStoredSettings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Google Auth user & token
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Month selection
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Sync state to LocalStorage
  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Listen to Google Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        // Not authenticated or token expired
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-sync with Google Drive Sheets if OAuth token and spreadsheetId are present
  useEffect(() => {
    if (accessToken && settings.spreadsheetId) {
      setIsSyncing(true);
      loadTransactionsFromSpreadsheet(accessToken, settings.spreadsheetId)
        .then((loaded) => {
          if (loaded.length > 0) {
            setTransactions(loaded);
            showToast(`${loaded.length} transactions chargées depuis Google Drive !`, 'success');
          }
        })
        .catch((err) => {
          console.warn('OAuth auto-sync error:', err);
        })
        .finally(() => setIsSyncing(false));
    }
  }, [accessToken, settings.spreadsheetId]);

  // Fallback: Auto-sync on startup if Web App URL is present (script mode)
  useEffect(() => {
    if (!settings.spreadsheetId && settings.webAppUrl && settings.webAppUrl.trim()) {
      setIsSyncing(true);
      fetchSheetTransactions(settings.webAppUrl.trim())
        .then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setTransactions(res.data);
            showToast(`${res.count} transactions synchronisées depuis Google Sheet !`, 'success');
          } else if (!res.success) {
            console.warn('Auto-sync error:', res.message);
          }
        })
        .catch((err) => console.error('Auto-sync failed:', err))
        .finally(() => setIsSyncing(false));
    }
  }, [settings.webAppUrl, settings.spreadsheetId]);

  // Derive unique months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Default to latest month
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonth === 'ALL') {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths]);

  // Period transactions
  const periodTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((t) => t.date && t.date.substring(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  // KPI Calculations
  const soldeTotal = useMemo(() => {
    return transactions.reduce((acc, t) => acc + t.montant, 0);
  }, [transactions]);

  const revenusMois = useMemo(() => {
    return periodTransactions
      .filter((t) => t.montant > 0)
      .reduce((acc, t) => acc + t.montant, 0);
  }, [periodTransactions]);

  const depensesMois = useMemo(() => {
    return periodTransactions
      .filter((t) => t.montant < 0)
      .reduce((acc, t) => acc + t.montant, 0);
  }, [periodTransactions]);

  const soldeNetMois = revenusMois + depensesMois;
  const tauxEpargne = revenusMois > 0 ? Math.max(0, Math.round((soldeNetMois / revenusMois) * 100)) : 0;

  // Formatted month name
  const selectedMonthName = useMemo(() => {
    if (selectedMonth === 'ALL') return 'Toutes périodes';
    try {
      const [year, month] = selectedMonth.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const name = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  // Add transaction
  const handleAddTransaction = async (newTx: Transaction, syncToSheet: boolean) => {
    // Save locally
    setTransactions((prev) => [newTx, ...prev]);

    if (syncToSheet) {
      if (accessToken && settings.spreadsheetId) {
        showToast("Envoi vers Google Drive...", 'info');
        try {
          await appendTransactionToSpreadsheet(accessToken, settings.spreadsheetId, newTx);
          showToast("Opération enregistrée dans votre Google Sheet !", 'success');
        } catch (err: any) {
          showToast(`Erreur Google Sheet : ${err.message}`, 'error');
        }
      } else if (settings.webAppUrl) {
        showToast("Envoi vers Google Sheet via Script...", 'info');
        try {
          const res = await pushTransactionToSheet(settings.webAppUrl, newTx);
          showToast(res.message, res.success ? 'success' : 'error');
        } catch (err: any) {
          showToast("Erreur lors de l'envoi vers Google Sheet", 'error');
        }
      } else {
        showToast("Opération enregistrée localement !", 'success');
      }
    } else {
      showToast("Opération enregistrée avec succès !", 'success');
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast("Opération supprimée.", 'info');
  };

  // Manual Sync
  const handleManualSync = async () => {
    // 1. Direct Google Drive API
    if (accessToken && settings.spreadsheetId) {
      setIsSyncing(true);
      showToast("Synchronisation depuis Google Drive...", 'info');
      try {
        const loaded = await loadTransactionsFromSpreadsheet(accessToken, settings.spreadsheetId);
        setTransactions(loaded);
        showToast(`${loaded.length} transactions importées de votre Google Sheet !`, 'success');
        setSettings((prev) => ({
          ...prev,
          lastSyncTime: new Date().toLocaleString('fr-FR'),
        }));
      } catch (err: any) {
        showToast(`Erreur de synchronisation : ${err.message}`, 'error');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // 2. Apps Script Web App
    if (settings.webAppUrl && settings.webAppUrl.trim()) {
      setIsSyncing(true);
      showToast("Synchronisation avec Google Sheet...", 'info');
      const res = await fetchSheetTransactions(settings.webAppUrl);
      setIsSyncing(false);

      if (res.success && res.data) {
        if (res.data.length > 0) {
          setTransactions(res.data);
          showToast(`${res.count} transactions importées de votre Google Sheet !`, 'success');
        } else {
          showToast("Feuille Google Sheet vide ou aucune donnée trouvée.", 'info');
        }
        setSettings((prev) => ({
          ...prev,
          lastSyncTime: new Date().toLocaleString('fr-FR'),
        }));
      } else {
        showToast(res.message, 'error');
      }
      return;
    }

    // 3. Neither configured: Open Google Drive setup modal
    setIsGoogleDriveModalOpen(true);
  };

  // Custom Accounts list
  const customAccounts = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.compte).filter(Boolean)));
  }, [transactions]);

  const hasAnySheetSync = Boolean((accessToken && settings.spreadsheetId) || settings.webAppUrl);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        user={user}
        isSyncing={isSyncing}
        onOpenNewTransaction={() => setIsModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
        onManualSync={handleManualSync}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner notification depending on connection state */}
        {!settings.spreadsheetId && !settings.webAppUrl && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Connectez votre compte Google & pointez vers votre feuille Google Sheet
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Une fois connecté, choisissez directement votre feuille de calcul dans votre Google Drive ou laissez l'application en créer une automatiquement.
                </p>
              </div>
            </div>
            <button
              id="banner-connect-google-btn"
              onClick={() => setIsGoogleDriveModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Connecter mon Google Sheet</span>
            </button>
          </div>
        )}

        {/* If connected via Google Drive */}
        {settings.spreadsheetId && (
          <div className="mb-6 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Feuille Google Drive connectée : <strong>{settings.spreadsheetName || 'Feuille Fintim'}</strong>
              </span>
            </div>
            <button
              onClick={() => setIsGoogleDriveModalOpen(true)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
            >
              Changer ou gérer
            </button>
          </div>
        )}

        {/* Top KPI Stats Cards */}
        <StatsCards
          soldeTotal={soldeTotal}
          revenusMois={revenusMois}
          depensesMois={depensesMois}
          soldeNetMois={soldeNetMois}
          tauxEpargne={tauxEpargne}
          selectedMonthName={selectedMonthName}
        />

        {/* Visual Charts & Category Analytics */}
        <BudgetCharts transactions={transactions} selectedMonth={selectedMonth} />

        {/* Transaction History & Search/Filters */}
        <TransactionList
          transactions={transactions}
          onDeleteTransaction={handleDeleteTransaction}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          availableMonths={availableMonths}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>
          Fintim Suivi de Budget • Google Sheets & Google Drive
          {settings.lastSyncTime && (
            <span className="ml-2 text-slate-400">
              (Dernière synchronisation : {settings.lastSyncTime})
            </span>
          )}
        </p>
      </footer>

      {/* Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        hasSheetSync={hasAnySheetSync}
        customAccounts={customAccounts}
      />

      {/* Google Drive Sheet Picker Modal */}
      <GoogleDriveSheetPickerModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onAuthSuccess={(u, token) => {
          setUser(u);
          setAccessToken(token);
        }}
        onLogout={() => {
          setUser(null);
          setAccessToken(null);
          setSettings((prev) => ({
            ...prev,
            spreadsheetId: undefined,
            spreadsheetName: undefined,
          }));
        }}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
        }}
        onTransactionsLoaded={(loaded) => {
          if (loaded.length > 0) {
            setTransactions(loaded);
          }
        }}
      />

      {/* Google Apps Script & Netlify Settings Modal */}
      <GoogleSheetModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          showToast("Paramètres enregistrés.", 'success');
        }}
        onImportTransactions={(imported) => {
          setTransactions(imported);
          showToast(`${imported.length} transactions importées avec succès !`, 'success');
        }}
        onResetDemoData={() => {
          setTransactions(INITIAL_TRANSACTIONS);
          showToast("Données de démonstration rétablies.", 'info');
        }}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
