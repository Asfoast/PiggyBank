import React from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardsProps {
  soldeTotal: number;
  revenusMois: number;
  depensesMois: number;
  soldeNetMois: number;
  tauxEpargne: number;
  selectedMonthName: string;
}

export const formatEuro = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const StatsCards: React.FC<StatsCardsProps> = ({
  soldeTotal,
  revenusMois,
  depensesMois,
  soldeNetMois,
  tauxEpargne,
  selectedMonthName,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Solde Total Global */}
      <div id="stat-solde-total" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Solde Total Cumulé
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${soldeTotal >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          {formatEuro(soldeTotal)}
        </div>
        <p className="text-xs text-slate-500 mt-1">Tous comptes confondus</p>
      </div>

      {/* Revenus du mois */}
      <div id="stat-revenus-mois" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Revenus ({selectedMonthName})
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-emerald-600">
          +{formatEuro(revenusMois)}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-1">
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mr-1 inline" />
          <span>Entrées d'argent</span>
        </div>
      </div>

      {/* Dépenses du mois */}
      <div id="stat-depenses-mois" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Dépenses ({selectedMonthName})
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-rose-600">
          {formatEuro(Math.abs(depensesMois))}
        </div>
        <div className="flex items-center text-xs text-slate-500 mt-1">
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 mr-1 inline" />
          <span>Sorties d'argent</span>
        </div>
      </div>

      {/* Épargne / Reste net */}
      <div id="stat-epargne-mois" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Flux Net ({selectedMonthName})
          </span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${soldeNetMois >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
          {soldeNetMois >= 0 ? `+${formatEuro(soldeNetMois)}` : formatEuro(soldeNetMois)}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {revenusMois > 0 ? `Taux d'épargne: ${tauxEpargne}%` : 'Aucun revenu ce mois'}
        </p>
      </div>
    </div>
  );
};
