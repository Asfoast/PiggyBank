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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      {/* Solde Total Global */}
      <div id="stat-solde-total" className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Solde Total
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className={`text-base sm:text-2xl font-extrabold tracking-tight truncate ${soldeTotal >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatEuro(soldeTotal)}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Tous comptes</p>
        </div>
      </div>

      {/* Revenus du mois */}
      <div id="stat-revenus-mois" className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider truncate">
            Revenus
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-extrabold tracking-tight text-emerald-600 truncate">
            +{formatEuro(revenusMois)}
          </div>
          <div className="flex items-center text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-0.5 inline shrink-0" />
            <span className="truncate">Entrées</span>
          </div>
        </div>
      </div>

      {/* Dépenses du mois */}
      <div id="stat-depenses-mois" className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-rose-700 uppercase tracking-wider truncate">
            Dépenses
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-2xl font-extrabold tracking-tight text-rose-600 truncate">
            {formatEuro(Math.abs(depensesMois))}
          </div>
          <div className="flex items-center text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            <ArrowDownRight className="w-3 h-3 text-rose-500 mr-0.5 inline shrink-0" />
            <span className="truncate">Sorties</span>
          </div>
        </div>
      </div>

      {/* Épargne / Reste net */}
      <div id="stat-epargne-mois" className="bg-white rounded-2xl p-3 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs font-bold text-indigo-700 uppercase tracking-wider truncate">
            Flux Net
          </span>
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div>
          <div className={`text-base sm:text-2xl font-extrabold tracking-tight truncate ${soldeNetMois >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {soldeNetMois >= 0 ? `+${formatEuro(soldeNetMois)}` : formatEuro(soldeNetMois)}
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
            {revenusMois > 0 ? `Épargne: ${tauxEpargne}%` : 'Net période'}
          </p>
        </div>
      </div>
    </div>
  );
};
