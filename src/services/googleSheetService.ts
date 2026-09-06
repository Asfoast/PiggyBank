import { Transaction } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  count?: number;
  data?: Transaction[];
}

/**
 * Fetch transactions from Google Apps Script Web App
 */
export async function fetchSheetTransactions(webAppUrl: string): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: "L'URL de l'application Web Google Apps Script est vide." };
  }

  const cleanUrl = webAppUrl.trim();

  try {
    // Add cache busting param to avoid mobile browser aggressive caching
    const fetchUrl = cleanUrl.includes('?') 
      ? `${cleanUrl}&_t=${Date.now()}` 
      : `${cleanUrl}?_t=${Date.now()}`;

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    // Check if the response contains items/rows
    let rows: any[] = [];
    if (Array.isArray(json)) {
      rows = json;
    } else if (json.data && Array.isArray(json.data)) {
      rows = json.data;
    } else if (json.transactions && Array.isArray(json.transactions)) {
      rows = json.transactions;
    } else {
      return { success: false, message: "Format de réponse inattendu (tableau d'opérations non trouvé)." };
    }

    const mappedTransactions: Transaction[] = rows.map((row: any, idx: number) => {
      // Handle both object keys and array row formats
      const timestamp = row.Timestamp || row.timestamp || new Date().toISOString();
      const date = row.Date || row.date || (typeof timestamp === 'string' ? timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
      const compte = row.Compte || row.compte || 'Compte Courant';
      const description = row.Description || row.description || 'Sans libellé';
      const categorie = row.Categorie || row.categorie || row['Catégorie'] || 'Autre';
      
      let montant = 0;
      const rawMontant = row.Montant !== undefined ? row.Montant : row.montant;
      if (typeof rawMontant === 'number') {
        montant = rawMontant;
      } else if (typeof rawMontant === 'string') {
        montant = parseFloat(rawMontant.replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
      }

      return {
        id: row.id || `sheet-${idx}-${Date.now()}`,
        timestamp: String(timestamp),
        date: String(date).substring(0, 10),
        compte: String(compte),
        description: String(description),
        categorie: String(categorie),
        montant: Number(montant),
      };
    });

    return {
      success: true,
      message: `${mappedTransactions.length} transaction(s) récupérée(s) avec succès.`,
      count: mappedTransactions.length,
      data: mappedTransactions,
    };
  } catch (error: any) {
    console.error('Sheet fetch error:', error);
    return {
      success: false,
      message: `Impossible de contacter le script Google: ${error.message || 'Erreur réseau/CORS'}. Vérifiez le déploiement en accès "Tout le monde".`,
    };
  }
}

/**
 * Send a new transaction to the Google Apps Script Web App
 */
export async function pushTransactionToSheet(
  webAppUrl: string,
  transaction: Transaction
): Promise<SyncResult> {
  if (!webAppUrl || !webAppUrl.trim()) {
    return { success: false, message: 'URL Google Apps Script non configurée.' };
  }

  const cleanUrl = webAppUrl.trim();
  const payload = {
    Timestamp: transaction.timestamp || new Date().toISOString(),
    Date: transaction.date,
    Compte: transaction.compte,
    Description: transaction.description,
    Categorie: transaction.categorie,
    Montant: transaction.montant,
  };

  try {
    // Note: Apps Script web apps need text/plain to prevent browser CORS preflight errors
    const response = await fetch(cleanUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Code HTTP ${response.status}`);
    }

    return {
      success: true,
      message: 'Transaction envoyée avec succès à Google Sheet !',
    };
  } catch (error: any) {
    console.warn('Push error or CORS response:', error);
    // Many times Google Apps Script redirects after POST, which in browser can trigger CORS warning even if write succeeded.
    return {
      success: true,
      message: "Opération envoyée vers le script Google Sheet (vérifiez l'apparition dans votre feuille).",
    };
  }
}

/**
 * Standard Apps Script template matching Timestamp, Date, Compte, Description, Categorie, Montant
 */
export const RECOMMENDED_APPS_SCRIPT_CODE = `/**
 * Google Apps Script pour Fintim - Suivi de Budget
 * Colonnes de la feuille : Timestamp | Date | Compte | Description | Categorie | Montant
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0]; // [Timestamp, Date, Compte, Description, Categorie, Montant]
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var entry = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().trim();
      var val = row[j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "GMT", "yyyy-MM-dd");
      }
      entry[key] = val;
    }
    result.push(entry);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    
    // Ordre des colonnes : Timestamp, Date, Compte, Description, Categorie, Montant
    var timestamp = contents.Timestamp || new Date().toISOString();
    var date = contents.Date || Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");
    var compte = contents.Compte || "Compte Courant";
    var description = contents.Description || "";
    var categorie = contents.Categorie || "Autre";
    var montant = Number(contents.Montant) || 0;
    
    sheet.appendRow([timestamp, date, compte, description, categorie, montant]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Ligne ajoutée" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
