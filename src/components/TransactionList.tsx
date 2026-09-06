import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Pencil, Download, ArrowDownLeft, ArrowUpRight, Calendar, Tag, CreditCard, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Transaction } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, CategoryConfig } from '../data/categories';
import { formatEuro } from './StatsCards';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
  categories?: CategoryConfig[];
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  selectedMonth,
  onMonthChange,
  availableMonths,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompte, setSelectedCompte] = useState('ALL');
  const [selectedCategorie, setSelectedCategorie] = useState('ALL');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const txMonth = tx.date ? tx.date.substring(0, 7) : '';
        if (txMonth !== selectedMonth) return false;
      }

      // Compte filter
      if (selectedCompte !== 'ALL' && tx.compte !== selectedCompte) {
        return false;
      }

      // Categorie filter
      if (selectedCategorie !== 'ALL' && tx.categorie !== selectedCategorie) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = tx.categorie.toLowerCase().includes(q);
        const matchCompte = tx.compte.toLowerCase().includes(q);
        const matchAmount = tx.montant.toString().includes(q);
        if (!matchDesc && !matchCat && !matchCompte && !matchAmount) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedCompte, selectedCategorie, searchQuery]);

  // Distinct accounts and categories from data
  const accountsList = useMemo(() => {
    const fromData = Array.from(new Set(transactions.map((t) => t.compte).filter(Boolean)));
    return Array.from(new Set([...DEFAULT_ACCOUNTS, ...fromData]));
  }, [transactions]);

  const categoriesList = useMemo(() => {
    const fromData = Array.from(new Set(transactions.map((t) => t.categorie).filter(Boolean)));
    return Array.from(new Set([...categories.map((c) => c.name), ...fromData]));
  }, [transactions, categories]);

  // Export CSV matching: Timestamp,Date,Compte,Description,Categorie,Montant
  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Compte', 'Description', 'Categorie', 'Montant'];
    const rows = filteredTransactions.map((tx) => [
      `"${tx.timestamp || ''}"`,
      `"${tx.date || ''}"`,
      `"${(tx.compte || '').replace(/"/g, '""')}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${(tx.categorie || '').replace(/"/g, '""')}"`,
      tx.montant,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fintim_budget_${selectedMonth === 'ALL' ? 'complet' : selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for category badge color
  const getCategoryBadgeClass = (categoryName: string) => {
    const found = categories.find((c) => c.name === categoryName);
    return found ? found.badgeBg : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getCategoryColor = (categoryName: string) => {
    const found = categories.find((c) => c.name === categoryName);
    return found ? found.color : '#94a3b8';
  };

  // Total visible amount
  const totalVisible = useMemo(() => {
    return filteredTransactions.reduce((sum, tx) => sum + tx.montant, 0);
  }, [filteredTransactions]);

  return (
    <div id="transactions-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Historique des opérations</h3>
            <p className="text-xs text-slate-500">
              {filteredTransactions.length} opération(s) affichée(s) • Total filtré :{' '}
              <span className={`font-semibold ${totalVisible >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalVisible >= 0 ? `+${formatEuro(totalVisible)}` : formatEuro(totalVisible)}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* CSV export matching Google Sheet format */}
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Exporter au format Google Sheet (CSV)"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Search input */}
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-transactions"
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Month selector */}
          <div>
            <select
              id="filter-month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">Toutes les périodes</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Compte filter */}
          <div>
            <select
              id="filter-compte"
              value={selectedCompte}
              onChange={(e) => setSelectedCompte(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">Tous les comptes</option>
              {accountsList.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>

          {/* Categorie filter */}
          <div className="col-span-2 sm:col-span-1">
            <select
              id="filter-categorie"
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">Toutes catégories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Aucune opération trouvée</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Modifiez vos filtres ou ajoutez une nouvelle transaction ci-dessus.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Native Card List (< 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.montant >= 0;
                return (
                  <div
                    key={tx.id}
                    id={`tx-mob-${tx.id}`}
                    className="p-3.5 flex items-center justify-between gap-3 active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <p 
                            onClick={() => onEditTransaction && onEditTransaction(tx)}
                            className="text-xs font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                            title="Modifier cette opération"
                          >
                            {tx.description}
                          </p>
                          {tx.sheetRow && (
                            <span 
                              className="inline-flex items-center text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 rounded font-medium shrink-0" 
                              title={`Synchronisée avec la feuille (Ligne ${tx.sheetRow})`}
                            >
                              <FileSpreadsheet className="w-2.5 h-2.5 mr-0.5" />
                              L{tx.sheetRow}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{tx.date}</span>
                          <span>•</span>
                          <span className="truncate max-w-[90px]">{tx.compte}</span>
                          <span>•</span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded-md font-medium border text-[9px] ${getCategoryBadgeClass(
                              tx.categorie
                            )}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full mr-1 shrink-0"
                              style={{ backgroundColor: getCategoryColor(tx.categorie) }}
                            />
                            {tx.categorie}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`text-xs font-extrabold tracking-tight mr-1 ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isPositive ? `+${formatEuro(tx.montant)}` : formatEuro(tx.montant)}
                      </span>
                      {onEditTransaction && (
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 rounded-lg transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                          title="Modifier l'opération"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer l'opération "${tx.description}" ?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 active:text-rose-700 rounded-lg transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Catégorie</th>
                    <th className="py-3 px-4">Compte</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.montant >= 0;
                    return (
                      <tr
                        key={tx.id}
                        id={`tx-row-${tx.id}`}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {tx.date}
                        </td>

                        {/* Description */}
                        <td className="py-3 px-4 text-slate-900 font-medium max-w-xs">
                          <div className="flex items-center space-x-2">
                            <span 
                              onClick={() => onEditTransaction && onEditTransaction(tx)}
                              className="truncate hover:text-emerald-700 cursor-pointer font-medium"
                              title="Cliquer pour modifier"
                            >
                              {tx.description}
                            </span>
                            {tx.sheetRow && (
                              <span 
                                className="inline-flex items-center text-[10px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded font-medium shrink-0" 
                                title={`Synchronisée avec la feuille Google Sheet (Ligne ${tx.sheetRow})`}
                              >
                                <FileSpreadsheet className="w-3 h-3 mr-0.5" />
                                L{tx.sheetRow}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categorie */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadgeClass(
                              tx.categorie
                            )}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
                              style={{ backgroundColor: getCategoryColor(tx.categorie) }}
                            />
                            {tx.categorie}
                          </span>
                        </td>

                        {/* Compte */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <CreditCard className="w-3 h-3 mr-1 text-slate-400" />
                            {tx.compte}
                          </span>
                        </td>

                        {/* Montant */}
                        <td className="py-3 px-4 text-right whitespace-nowrap font-semibold">
                          <span className={isPositive ? 'text-emerald-600' : 'text-slate-900'}>
                            {isPositive ? `+${formatEuro(tx.montant)}` : formatEuro(tx.montant)}
                          </span>
                        </td>

                        {/* Edit & Delete actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            {onEditTransaction && (
                              <button
                                onClick={() => onEditTransaction(tx)}
                                title="Modifier cette opération"
                                className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm(`Supprimer l'opération "${tx.description}" ?`)) {
                                  onDeleteTransaction(tx.id);
                                }
                              }}
                              title="Supprimer cette opération"
                              className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
