import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, Code, Globe, FileSpreadsheet, Upload } from 'lucide-react';
import { SyncSettings, Transaction } from '../types';
import { RECOMMENDED_APPS_SCRIPT_CODE, fetchSheetTransactions } from '../services/googleSheetService';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SyncSettings;
  onSaveSettings: (newSettings: SyncSettings) => void;
  onImportTransactions: (transactions: Transaction[]) => void;
  onResetDemoData: () => void;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onImportTransactions,
  onResetDemoData,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'script' | 'netlify'>('config');
  const [webAppUrl, setWebAppUrl] = useState<string>(settings.webAppUrl || '');
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      webAppUrl: webAppUrl.trim(),
    });
    setTestResult({
      success: true,
      message: 'Paramètres sauvegardés avec succès !',
    });
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        success: false,
        message: "Veuillez d'abord saisir l'URL de votre application Web Google Apps Script.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await fetchSheetTransactions(webAppUrl.trim());
    setIsTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });

    if (res.success && res.data && res.data.length > 0) {
      onImportTransactions(res.data);
      onSaveSettings({
        ...settings,
        webAppUrl: webAppUrl.trim(),
        lastSyncTime: new Date().toLocaleString('fr-FR'),
      });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div 
        id="settings-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Connexion Google Sheet & Déploiement Netlify
              </h2>
              <p className="text-xs text-slate-500">
                Liaison directe avec votre script Google et mise à jour de Fintim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Liaison Google Sheet</span>
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'script'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Code Apps Script (6 colonnes)</span>
          </button>
          <button
            onClick={() => setActiveTab('netlify')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'netlify'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Guide Netlify (fintim)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <h4 className="font-bold text-emerald-900 text-xs mb-1 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Colonnes détectées de votre feuille Google Sheet :
                </h4>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Timestamp', 'Date', 'Compte', 'Description', 'Categorie', 'Montant'].map(
                    (col) => (
                      <span
                        key={col}
                        className="px-2 py-0.5 rounded bg-white text-emerald-800 font-mono text-[11px] border border-emerald-200 font-semibold"
                      >
                        {col}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Web App URL Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  URL de l'application Web Google Apps Script
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-webapp-url"
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
                  />
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shrink-0"
                  >
                    Enregistrer
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  L'URL se termine par <code className="text-slate-700">/exec</code>. Obtenue via le menu{' '}
                  <strong>Déployer &gt; Nouveau déploiement</strong> dans votre projet Google Apps Script.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  id="btn-test-sheet"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Test en cours...' : 'Tester & Importer depuis la feuille'}</span>
                </button>

                <a
                  href="https://script.google.com/u/0/home/projects/1-V1yfYMxtTtYGccMHRf2M51OoFD1sHnyIesHxPsSXXrJ5kRGVL_EXaJh/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir votre Apps Script</span>
                </a>
              </div>

              {/* Status message */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start space-x-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">{testResult.message}</div>
                </div>
              )}

              {/* Demo Data Reset */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-slate-800">Données de démonstration</h5>
                  <p className="text-[11px] text-slate-400">
                    Rétablir les transactions d'exemple pour tester les graphiques et filtres.
                  </p>
                </div>
                <button
                  onClick={onResetDemoData}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                >
                  Réinitialiser démo
                </button>
              </div>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Collez ce script dans votre projet Google Apps Script (
                  <a
                    href="https://script.google.com/u/0/home/projects/1-V1yfYMxtTtYGccMHRf2M51OoFD1sHnyIesHxPsSXXrJ5kRGVL_EXaJh/edit"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 underline font-medium"
                  >
                    ouvrir le script
                  </a>
                  ) pour activer la lecture (<code className="text-emerald-700">doGet</code>) et l'écriture (
                  <code className="text-emerald-700">doPost</code>) instantanées avec vos 6 colonnes :
                </p>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copié !' : 'Copier le code'}</span>
                </button>
              </div>

              {/* Code display */}
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] max-h-64 overflow-y-auto border border-slate-800">
                <pre>{RECOMMENDED_APPS_SCRIPT_CODE}</pre>
              </div>

              {/* Instructions steps */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                <h5 className="font-bold text-slate-800">Étapes de publication sur Google :</h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-600">
                  <li>Ouvrez votre projet Google Apps Script.</li>
                  <li>Remplacez ou complétez le code avec le code ci-dessus, puis enregistrez (Ctrl+S).</li>
                  <li>
                    Cliquez sur <strong>Déployer &gt; Nouveau déploiement</strong>.
                  </li>
                  <li>
                    Sélectionnez le type <strong>Application Web</strong>.
                  </li>
                  <li>
                    Définissez <strong>Qui a accès : Tout le monde (Anyone)</strong>.
                  </li>
                  <li>Copiez l'URL d'application Web fournie et collez-la dans l'onglet Liaison.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'netlify' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                <h4 className="font-bold text-blue-900 text-xs mb-1">
                  Mettre à jour votre projet Netlify :{' '}
                  <a
                    href="https://app.netlify.com/projects/fintim/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-700 hover:text-blue-900 font-mono"
                  >
                    fintim
                  </a>
                </h4>
                <p className="text-xs text-blue-800">
                  Vous avez deux manières simples de modifier et déployer l'application sur Netlify :
                </p>
              </div>

              {/* Method 1: Git repository */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs">
                    Méthode recommandée : Via GitHub (Déploiement automatique)
                  </h5>
                </div>
                <p className="text-[11px] text-slate-600">
                  Exportez ce projet vers votre dépôt GitHub relié à Netlify (via le menu en haut à droite &gt;
                  Export / GitHub). Netlify détectera automatiquement le commit et reconstruira le site en quelques secondes !
                </p>
                <div className="p-2.5 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-700 border border-slate-100">
                  <div><strong>Build command :</strong> npm run build</div>
                  <div><strong>Publish directory :</strong> dist</div>
                </div>
              </div>

              {/* Method 2: Drag and drop */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[11px]">
                    2
                  </span>
                  <h5 className="font-bold text-slate-900 text-xs">
                    Méthode directe : Drag & Drop du dossier dist
                  </h5>
                </div>
                <p className="text-[11px] text-slate-600">
                  Téléchargez le projet (Download ZIP), lancez la commande de build, puis déposez le dossier{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">dist</code> directement dans l'onglet Déploiements de votre site Netlify :{' '}
                  <a
                    href="https://app.netlify.com/projects/fintim/deploys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 underline font-medium"
                  >
                    app.netlify.com/projects/fintim/deploys
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Fintim • Suivi de budget personnel
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
