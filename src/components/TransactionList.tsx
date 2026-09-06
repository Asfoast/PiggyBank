import React, { useState, useMemo } from 'react';
import { Search, Filter, Trash2, Download, ArrowDownLeft, ArrowUpRight, Calendar, Tag, CreditCard, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from '../data/categories';
import { formatEuro } from './StatsCards';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  selectedMonth,
  onMonthChange,
  availableMonths,
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
    return Array.from(new Set([...DEFAULT_CATEGORIES.map((c) => c.name), ...fromData]));
  }, [transactions]);

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
    const found = DEFAULT_CATEGORIES.find((c) => c.name === categoryName);
    return found ? found.badgeBg : 'bg-slate-100 text-slate-700 border-slate-200';
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
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Search input */}
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-transactions"
              type="text"
              placeholder="Rechercher libellé..."
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
          <div>
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
      <div className="overflow-x-auto">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">Aucune opération trouvée</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Modifiez vos filtres ou ajoutez une nouvelle transaction ci-dessus.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Compte</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center w-12">Action</th>
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
                    <td className="py-3 px-4 text-slate-900 font-medium max-w-xs truncate">
                      {tx.description}
                    </td>

                    {/* Categorie */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadgeClass(
                          tx.categorie
                        )}`}
                      >
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

                    {/* Delete action */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer l'opération "${tx.description}" ?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        title="Supprimer cette opération"
                        className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
