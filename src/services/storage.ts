import { Transaction, SyncSettings } from '../types';

const STORAGE_KEY = 'fintim_transactions_v1';
const SETTINGS_KEY = 'fintim_settings_v1';

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
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return {
    webAppUrl: '',
    autoSync: false,
    lastSyncTime: null,
    sheetName: 'Feuille 1',
  };
}

export function saveStoredSettings(settings: SyncSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}
