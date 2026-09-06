import { Transaction, SyncSettings, RecurringTransaction } from '../types';

const STORAGE_KEY = 'fintim_transactions_v1';
const SETTINGS_KEY = 'fintim_settings_v1';
const RECURRING_KEY = 'piggybank_recurring_v1';

export const INITIAL_RECURRING: RecurringTransaction[] = [
  {
    id: 'rec-1',
    description: 'Loyer Appartement',
    montant: -780.00,
    categorie: 'Logement',
    compte: 'Compte Courant',
    dayOfMonth: 1,
    active: true,
    note: 'Prélèvement automatique le 1er du mois',
  },
  {
    id: 'rec-2',
    description: 'Abonnement Netflix',
    montant: -13.49,
    categorie: 'Abonnements',
    compte: 'Carte Bancaire',
    dayOfMonth: 5,
    active: true,
    note: 'Forfait Standard',
  },
  {
    id: 'rec-3',
    description: 'Abonnement Spotify Premium',
    montant: -10.99,
    categorie: 'Abonnements',
    compte: 'Carte Bancaire',
    dayOfMonth: 12,
    active: true,
    note: 'Musique en streaming',
  },
  {
    id: 'rec-4',
    description: 'Box Internet Fibre',
    montant: -29.99,
    categorie: 'Logement',
    compte: 'Compte Courant',
    dayOfMonth: 15,
    active: true,
    note: 'Facture mensuelle opérateur',
  },
  {
    id: 'rec-5',
    description: 'Pass Navigo / Transports',
    montant: -86.40,
    categorie: 'Transports',
    compte: 'Compte Courant',
    dayOfMonth: 5,
    active: true,
    note: 'Abonnement mensuel transport',
  },
  {
    id: 'rec-6',
    description: 'Virement Salaire',
    montant: 2650.00,
    categorie: 'Salaire & Revenus',
    compte: 'Compte Courant',
    dayOfMonth: 28,
    active: true,
    note: 'Salaire mensuel employeur',
  },
];

export function getStoredRecurring(): RecurringTransaction[] {
  try {
    const raw = localStorage.getItem(RECURRING_KEY);
    if (!raw) {
      localStorage.setItem(RECURRING_KEY, JSON.stringify(INITIAL_RECURRING));
      return INITIAL_RECURRING;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading recurring transactions:', err);
    return INITIAL_RECURRING;
  }
}

export function saveStoredRecurring(recurring: RecurringTransaction[]): void {
  try {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurring));
  } catch (err) {
    console.error('Error saving recurring transactions:', err);
  }
}

/**
 * Checks active recurring transactions and generates any that are due for the current month
 * (if dayOfMonth <= today's day, and not already generated for current YYYY-MM)
 */
export function checkAndGenerateDueRecurring(
  recurringList: RecurringTransaction[],
  existingTransactions: Transaction[]
): {
  newTransactions: Transaction[];
  updatedRecurring: RecurringTransaction[];
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

  const newTransactions: Transaction[] = [];
  const updatedRecurring = recurringList.map((rec) => {
    if (!rec.active) return rec;

    // Check if already processed this month
    if (rec.lastProcessedMonth === currentMonthStr) {
      return rec;
    }

    // Check if due day has been reached this month
    if (currentDay >= rec.dayOfMonth) {
      const scheduledDate = `${currentMonthStr}-${String(rec.dayOfMonth).padStart(2, '0')}`;

      // Check if duplicate transaction already exists in current list
      const alreadyExists = existingTransactions.some(
        (t) =>
          t.description.toLowerCase().trim() === rec.description.toLowerCase().trim() &&
          t.date.startsWith(currentMonthStr)
      );

      if (!alreadyExists) {
        const newTx: Transaction = {
          id: `rec-auto-${rec.id}-${currentMonthStr}-${Date.now()}`,
          timestamp: `${scheduledDate}T08:00:00.000Z`,
          date: scheduledDate,
          compte: rec.compte,
          description: `${rec.description} (Récurrent)`,
          categorie: rec.categorie,
          montant: rec.montant,
        };
        newTransactions.push(newTx);
      }

      return {
        ...rec,
        lastProcessedMonth: currentMonthStr,
      };
    }

    return rec;
  });

  return { newTransactions, updatedRecurring };
}


export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    timestamp: '2025-05-01T08:30:00.000Z',
    date: '2025-05-01',
    compte: 'Compte Courant',
    description: 'Virement Salaire Entreprise',
    categorie: 'Salaire & Revenus',
    montant: 2650.00,
  },
  {
    id: 'tx-2',
    timestamp: '2025-05-02T10:15:00.000Z',
    date: '2025-05-02',
    compte: 'Compte Courant',
    description: 'Loyer Appartement',
    categorie: 'Logement',
    montant: -780.00,
  },
  {
    id: 'tx-3',
    timestamp: '2025-05-03T18:45:00.000Z',
    date: '2025-05-03',
    compte: 'Carte Bancaire',
    description: 'Courses Carrefour Market',
    categorie: 'Alimentation',
    montant: -86.40,
  },
  {
    id: 'tx-4',
    timestamp: '2025-05-04T12:30:00.000Z',
    date: '2025-05-04',
    compte: 'Carte Bancaire',
    description: 'Restaurant Le Bistro',
    categorie: 'Loisirs & Sorties',
    montant: -38.50,
  },
  {
    id: 'tx-5',
    timestamp: '2025-05-05T09:00:00.000Z',
    date: '2025-05-05',
    compte: 'Compte Courant',
    description: 'Pass Navigo Mensuel',
    categorie: 'Transports',
    montant: -86.40,
  },
  {
    id: 'tx-6',
    timestamp: '2025-05-06T14:20:00.000Z',
    date: '2025-05-06',
    compte: 'Compte Courant',
    description: 'Abonnement Netflix & Spotify',
    categorie: 'Abonnements',
    montant: -24.98,
  },
  {
    id: 'tx-7',
    timestamp: '2025-05-07T11:00:00.000Z',
    date: '2025-05-07',
    compte: 'Compte Courant',
    description: 'Virement vers Livret A',
    categorie: 'Épargne & Invest.',
    montant: -400.00,
  },
  {
    id: 'tx-8',
    timestamp: '2025-05-07T11:00:01.000Z',
    date: '2025-05-07',
    compte: 'Livret A',
    description: 'Épargne mensuelle reçue',
    categorie: 'Épargne & Invest.',
    montant: 400.00,
  },
  {
    id: 'tx-9',
    timestamp: '2025-05-08T16:10:00.000Z',
    date: '2025-05-08',
    compte: 'Carte Bancaire',
    description: 'Pharmacie Centrale',
    categorie: 'Santé',
    montant: -22.30,
  },
  {
    id: 'tx-10',
    timestamp: '2025-05-10T19:30:00.000Z',
    date: '2025-05-10',
    compte: 'Carte Bancaire',
    description: 'Courses Biocoop',
    categorie: 'Alimentation',
    montant: -54.80,
  },
  {
    id: 'tx-11',
    timestamp: '2025-05-12T15:00:00.000Z',
    date: '2025-05-12',
    compte: 'Carte Bancaire',
    description: 'Fnac - Livre et chargeur',
    categorie: 'Shopping & Maison',
    montant: -45.00,
  },
  {
    id: 'tx-12',
    timestamp: '2025-05-14T20:15:00.000Z',
    date: '2025-05-14',
    compte: 'Carte Bancaire',
    description: 'Cinéma UGC + Popcorn',
    categorie: 'Loisirs & Sorties',
    montant: -28.00,
  },
];

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading stored transactions:', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transactions:', err);
  }
}

export function getStoredSettings(): SyncSettings {
  let envUrl = '';
  try {
    envUrl = (import.meta as any).env?.VITE_GOOGLE_SCRIPT_URL || '';
  } catch {}

  // Check URL query parameters (e.g. ?syncUrl=... for easy mobile opening)
  let queryUrl = '';
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('syncUrl') || params.get('scriptUrl');
      if (urlParam) {
        queryUrl = decodeURIComponent(urlParam);
      }
    } catch {}
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (queryUrl) {
        parsed.webAppUrl = queryUrl;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
      } else if (!parsed.webAppUrl && envUrl) {
        parsed.webAppUrl = envUrl;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }

  const initialSettings: SyncSettings = {
    webAppUrl: queryUrl || envUrl || '',
    autoSync: true,
    lastSyncTime: null,
    sheetName: 'Feuille 1',
  };

  if (queryUrl || envUrl) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
    } catch {}
  }

  return initialSettings;
}

export function saveStoredSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
