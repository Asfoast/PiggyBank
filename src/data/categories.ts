export interface CategoryConfig {
  name: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  type: 'expense' | 'income' | 'both';
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { name: 'Alimentation', color: '#10b981', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200', badgeText: 'text-emerald-700', iconName: 'ShoppingBag', type: 'expense' },
  { name: 'Logement', color: '#3b82f6', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200', badgeText: 'text-blue-700', iconName: 'Home', type: 'expense' },
  { name: 'Transports', color: '#f59e0b', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200', badgeText: 'text-amber-700', iconName: 'Car', type: 'expense' },
  { name: 'Loisirs & Sorties', color: '#8b5cf6', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200', badgeText: 'text-purple-700', iconName: 'Film', type: 'expense' },
  { name: 'Salaire & Revenus', color: '#059669', badgeBg: 'bg-green-50 text-green-700 border-green-200', badgeText: 'text-green-700', iconName: 'TrendingUp', type: 'income' },
  { name: 'Abonnements', color: '#ec4899', badgeBg: 'bg-pink-50 text-pink-700 border-pink-200', badgeText: 'text-pink-700', iconName: 'Tv', type: 'expense' },
  { name: 'Santé', color: '#ef4444', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200', badgeText: 'text-rose-700', iconName: 'HeartPulse', type: 'expense' },
  { name: 'Shopping & Maison', color: '#06b6d4', badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200', badgeText: 'text-cyan-700', iconName: 'Sparkles', type: 'expense' },
  { name: 'Épargne & Invest.', color: '#6366f1', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200', badgeText: 'text-indigo-700', iconName: 'PiggyBank', type: 'both' },
  { name: 'Factures & Charges', color: '#64748b', badgeBg: 'bg-slate-50 text-slate-700 border-slate-200', badgeText: 'text-slate-700', iconName: 'Receipt', type: 'expense' },
  { name: 'Autre', color: '#94a3b8', badgeBg: 'bg-gray-50 text-gray-700 border-gray-200', badgeText: 'text-gray-700', iconName: 'Tag', type: 'both' },
];

export const DEFAULT_ACCOUNTS = [
  'Compte Courant',
  'Livret A',
  'Carte Bancaire',
  'Compte Joint',
  'Espèces',
];
