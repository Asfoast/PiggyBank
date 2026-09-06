export interface Transaction {
  id: string;
  timestamp: string; // e.g. "2025-05-14T14:30:00.000Z" or formatted
  date: string;      // YYYY-MM-DD
  compte: string;    // e.g. "Compte Courant", "Livret A", "Carte"
  description: string;
  categorie: string;
  montant: number;   // Negative for expenses (e.g. -45.50), positive for income (+2400)
  sheetRow?: number; // Optional 1-based index in the Google Sheet (row 2, 3, etc.)
}

export interface SyncSettings {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncTime: string | null;
  sheetName?: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
  syncMethod?: 'oauth' | 'script';
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

export interface RecurringTransaction {
  id: string;
  description: string;
  montant: number; // Negative for expense (e.g. -12.99), positive for income (+2400)
  categorie: string;
  compte: string;
  dayOfMonth: number; // 1 to 31
  active: boolean;
  lastProcessedMonth?: string; // YYYY-MM
  note?: string;
}

