import { Transaction } from '../types';

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * List all Google Sheets files from the user's Google Drive
 */
export async function listDriveSpreadsheets(accessToken: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id, name, modifiedTime, webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur Drive API (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Create a new Google Spreadsheet with predefined Fintim columns:
 * Timestamp, Date, Compte, Description, Categorie, Montant
 */
export async function createBudgetSpreadsheet(
  accessToken: string,
  title: string = 'Fintim - Suivi de Budget'
): Promise<DriveFile> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Feuille 1',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'Date' } },
                  { userEnteredValue: { stringValue: 'Compte' } },
                  { userEnteredValue: { stringValue: 'Description' } },
                  { userEnteredValue: { stringValue: 'Categorie' } },
                  { userEnteredValue: { stringValue: 'Montant' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur création Google Sheet (${response.status}): ${errText}`);
  }

  const result = await response.json();
  return {
    id: result.spreadsheetId,
    name: result.properties?.title || title,
    webViewLink: result.spreadsheetUrl,
  };
}

/**
 * Load transactions from a specific spreadsheet ID
 * Reads range 'A:F'
 */
export async function loadTransactionsFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<Transaction[]> {
  const range = encodeURIComponent('A:F');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur lecture Google Sheet (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  const headerRow = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
  
  // Find column indexes
  const colTimestamp = headerRow.findIndex((h) => h === 'timestamp');
  const colDate = headerRow.findIndex((h) => h === 'date');
  const colCompte = headerRow.findIndex((h) => h === 'compte');
  const colDescription = headerRow.findIndex((h) => h === 'description');
  const colCategorie = headerRow.findIndex((h) => h === 'categorie' || h === 'catégorie');
  const colMontant = headerRow.findIndex((h) => h === 'montant');

  const transactions: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const timestamp = colTimestamp !== -1 && row[colTimestamp] ? String(row[colTimestamp]) : new Date().toISOString();
    const date = colDate !== -1 && row[colDate] ? String(row[colDate]).substring(0, 10) : new Date().toISOString().split('T')[0];
    const compte = colCompte !== -1 && row[colCompte] ? String(row[colCompte]) : 'Compte Courant';
    const description = colDescription !== -1 && row[colDescription] ? String(row[colDescription]) : 'Sans libellé';
    const categorie = colCategorie !== -1 && row[colCategorie] ? String(row[colCategorie]) : 'Autre';
    
    let montant = 0;
    const rawMontant = colMontant !== -1 ? row[colMontant] : 0;
    if (typeof rawMontant === 'number') {
      montant = rawMontant;
    } else if (typeof rawMontant === 'string') {
      montant = parseFloat(rawMontant.replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
    }

    transactions.push({
      id: `gsheet-${i}-${Date.now()}`,
      timestamp,
      date,
      compte,
      description,
      categorie,
      montant,
    });
  }

  return transactions;
}

/**
 * Append a transaction to the spreadsheet (range 'A:F')
 */
export async function appendTransactionToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  tx: Transaction
): Promise<void> {
  const range = encodeURIComponent('A:F');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const body = {
    values: [
      [
        tx.timestamp || new Date().toISOString(),
        tx.date,
        tx.compte,
        tx.description,
        tx.categorie,
        tx.montant,
      ],
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur ajout opération Google Sheet (${response.status}): ${errText}`);
  }
}
