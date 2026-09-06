import React, { useMemo } from 'react';
import { PieChart, Wallet, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';
import { Transaction, CategorySummary, AccountSummary } from '../types';
import { DEFAULT_CATEGORIES, CategoryConfig } from '../data/categories';
import { formatEuro } from './StatsCards';

interface BudgetChartsProps {
  transactions: Transaction[];
  selectedMonth: string;
  categories?: CategoryConfig[];
}

export const BudgetCharts: React.FC<BudgetChartsProps> = ({
  transactions,
  selectedMonth,
  categories = DEFAULT_CATEGORIES,
}) => {
  // Filter for period
  const periodTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter((t) => t.date && t.date.substring(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Expenses by category
  const categorySummaries: CategorySummary[] = useMemo(() => {
    const expenses = periodTransactions.filter((t) => t.montant < 0);
    const totalExpenses = Math.abs(expenses.reduce((acc, t) => acc + t.montant, 0));

    if (totalExpenses === 0) return [];

    const map = new Map<string, { total: number; count: number }>();
    expenses.forEach((t) => {
      const cat = t.categorie || 'Autre';
      const existing = map.get(cat) || { total: 0, count: 0 };
      existing.total += Math.abs(t.montant);
      existing.count += 1;
      map.set(cat, existing);
    });

    const list: CategorySummary[] = [];
    map.forEach((value, key) => {
      const catConfig = categories.find((c) => c.name === key);
      list.push({
        categorie: key,
        total: value.total,
        count: value.count,
        percentage: Math.round((value.total / totalExpenses) * 100),
        color: catConfig?.color || '#94a3b8',
        iconName: catConfig?.iconName || 'Tag',
      });
    });

    // Sort descending by amount
    return list.sort((a, b) => b.total - a.total);
  }, [periodTransactions]);

  // Account balances (calculated from all transactions or filtered)
  const accountSummaries: AccountSummary[] = useMemo(() => {
    const map = new Map<string, { solde: number; entrees: number; sorties: number; count: number }>();

    transactions.forEach((t) => {
      const acc = t.compte || 'Compte Courant';
      const existing = map.get(acc) || { solde: 0, entrees: 0, sorties: 0, count: 0 };
      existing.solde += t.montant;
      if (t.montant >= 0) existing.entrees += t.montant;
      else existing.sorties += Math.abs(t.montant);
      existing.count += 1;
      map.set(acc, existing);
    });

    const list: AccountSummary[] = [];
    map.forEach((val, key) => {
      list.push({
        compte: key,
        solde: val.solde,
        totalEntrees: val.entrees,
        totalSorties: val.sorties,
        count: val.count,
      });
    });

    return list.sort((a, b) => b.solde - a.solde);
  }, [transactions]);

  // Total expenses for the period
  const totalPeriodExpenses = useMemo(() => {
    return periodTransactions
      .filter((t) => t.montant < 0)
      .reduce((sum, t) => sum + Math.abs(t.montant), 0);
  }, [periodTransactions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6 mb-6 sm:mb-8">
      {/* Category Spending Breakdown */}
      <div id="chart-categories" className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-base flex items-center">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 text-emerald-600" />
              Répartition des dépenses
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {categorySummaries.length > 0
                ? `Total : ${formatEuro(totalPeriodExpenses)}`
                : 'Aucune dépense sur cette période'}
            </p>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">
            {selectedMonth === 'ALL' ? 'Tout' : selectedMonth}
          </span>
        </div>

        {categorySummaries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Aucune dépense enregistrée sur cette période.
          </div>
        ) : (
          <div className="space-y-3.5">
            {categorySummaries.slice(0, 6).map((cat) => (
              <div key={cat.categorie} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full mr-2 inline-block"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.categorie}
                    <span className="text-slate-400 font-normal ml-1.5">
                      ({cat.count} op.)
                    </span>
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatEuro(cat.total)}{' '}
                    <span className="text-slate-400 font-normal text-[11px]">
                      ({cat.percentage}%)
                    </span>
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {categorySummaries.length > 6 && (
              <p className="text-[11px] text-slate-400 text-center pt-1">
                + {categorySummaries.length - 6} autre(s) catégorie(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Account Balances (Soldes par compte) */}
      <div id="chart-accounts" className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-indigo-600" />
              Soldes par compte bancaire
            </h3>
            <p className="text-xs text-slate-500">Distribution de vos avoirs actuels</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
            {accountSummaries.length} compte(s)
          </span>
        </div>

        <div className="space-y-3">
          {accountSummaries.map((acc) => {
            const isPositive = acc.solde >= 0;
            return (
              <div
                key={acc.compte}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/70 transition-colors"
              >
                <div>
                  <h4 className="font-semibold text-slate-800 text-xs sm:text-sm">
                    {acc.compte}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    +{formatEuro(acc.totalEntrees)} • -{formatEuro(acc.totalSorties)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold text-sm sm:text-base ${
                      isPositive ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? `+${formatEuro(acc.solde)}` : formatEuro(acc.solde)}
                  </span>
                  <p className="text-[11px] text-slate-400">{acc.count} opération(s)</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
