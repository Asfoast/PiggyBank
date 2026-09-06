export interface Transaction {
  id: string;
  timestamp: string; // e.g. "2025-05-14T14:30:00.000Z" or formatted
  date: string;      // YYYY-MM-DD
  compte: string;    // e.g. "Compte Courant", "Livret A", "Carte"
  description: string;
  categorie: string;
  montant: number;   // Negative for expenses (e.g. -45.50), positive for income (+2400)
}

export interface SyncSettings {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncTime: string | null;
  sheetName?: string;
}

export interface CategorySummary {
  categorie: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
  iconName: string;
}

export interface AccountSummary {
  compte: string;
  solde: number;
  totalEntrees: number;
  totalSorties: number;
  count: number;
}
