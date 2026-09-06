import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { TransactionList } from './components/TransactionList';
import { BudgetCharts } from './components/BudgetCharts';
import { TransactionFormModal } from './components/TransactionFormModal';
import { GoogleSheetModal } from './components/GoogleSheetModal';
import { Transaction, SyncSettings } from './types';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredSettings,
  saveStoredSettings,
  INITIAL_TRANSACTIONS,
} from './services/storage';
import { fetchSheetTransactions, pushTransactionToSheet } from './services/googleSheetService';
import { AlertCircle, CheckCircle2, Info, ArrowUpRight, Cloud, Sparkles } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [settings, setSettings] = useState<SyncSettings>(getStoredSettings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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

  // Default to the latest month if available and currently 'ALL' on initial load
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
    // Add locally
    setTransactions((prev) => [newTx, ...prev]);

    if (syncToSheet && settings.webAppUrl) {
      showToast("Envoi vers Google Sheet...", 'info');
      try {
        const res = await pushTransactionToSheet(settings.webAppUrl, newTx);
        showToast(res.message, res.success ? 'success' : 'error');
      } catch (err: any) {
        showToast("Erreur lors de l'envoi vers Google Sheet", 'error');
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

  // Manual Sync with Google Sheet
  const handleManualSync = async () => {
    if (!settings.webAppUrl || !settings.webAppUrl.trim()) {
      setIsSettingsOpen(true);
      return;
    }

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
  };

  // Custom Accounts list
  const customAccounts = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.compte).filter(Boolean)));
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        isSyncing={isSyncing}
        onOpenNewTransaction={() => setIsModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onManualSync={handleManualSync}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner notification if Google Sheet is not yet connected */}
        {!settings.webAppUrl && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Connectez votre feuille Google Sheet & Script Fintim
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Synchronisez vos 6 colonnes : <code className="font-semibold text-emerald-800">Timestamp, Date, Compte, Description, Categorie, Montant</code> directement avec votre application Netlify.
                </p>
              </div>
            </div>
            <button
              id="banner-config-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-xs transition-colors cursor-pointer"
            >
              Lier mon script & Netlify
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
          Fintim Suivi de Budget • Compatible Google Apps Script & Netlify
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
        hasSheetSync={Boolean(settings.webAppUrl)}
        customAccounts={customAccounts}
      />

      {/* Google Sheet & Netlify Settings Modal */}
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
