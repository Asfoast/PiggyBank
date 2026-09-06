import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  Plus,
  Check,
  Search,
  ExternalLink,
  RefreshCw,
  LogOut,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DriveFile, listDriveSpreadsheets, createBudgetSpreadsheet, loadTransactionsFromSpreadsheet } from '../services/googleDriveSheets';
import { googleSignIn, logout, getAccessToken } from '../services/googleAuth';
import { Transaction, SyncSettings } from '../types';

interface GoogleDriveSheetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogout: () => void;
  settings: SyncSettings;
  onSaveSettings: (settings: SyncSettings) => void;
  onTransactionsLoaded: (transactions: Transaction[]) => void;
}

export const GoogleDriveSheetPickerModal: React.FC<GoogleDriveSheetPickerModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onAuthSuccess,
  onLogout,
  settings,
  onSaveSettings,
  onTransactionsLoaded,
}) => {
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Fetch Drive spreadsheets when modal opens or user logs in
  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveFiles(accessToken);
    }
  }, [isOpen, accessToken]);

  if (!isOpen) return null;

  const loadDriveFiles = async (token: string) => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      const files = await listDriveSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Failed to load drive files:', err);
      setStatusMessage({
        type: 'error',
        text: `Impossible d'accéder à Google Drive : ${err.message || 'Erreur'}`,
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onAuthSuccess(result.user, result.accessToken);
        setStatusMessage({
          type: 'success',
          text: `Connecté en tant que ${result.user.email} !`,
        });
        await loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setStatusMessage({
        type: 'error',
        text: `Erreur de connexion : ${err.message || 'Tentative annulée'}`,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onLogout();
    setDriveFiles([]);
    setStatusMessage({
      type: 'success',
      text: 'Déconnecté avec succès.',
    });
  };

  const handleSelectSheet = async (file: DriveFile) => {
    if (!accessToken) return;
    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const newSettings: SyncSettings = {
        ...settings,
        spreadsheetId: file.id,
        spreadsheetName: file.name,
        syncMethod: 'oauth',
        lastSyncTime: new Date().toLocaleString('fr-FR'),
      };
      onSaveSettings(newSettings);

      // Load data from this sheet
      const loaded = await loadTransactionsFromSpreadsheet(accessToken, file.id);
      onTransactionsLoaded(loaded);

      setStatusMessage({
        type: 'success',
        text: `Feuille "${file.name}" sélectionnée ! ${loaded.length} opération(s) synchronisée(s).`,
      });
    } catch (err: any) {
      console.error('Error selecting sheet:', err);
      setStatusMessage({
        type: 'error',
        text: `Erreur lors de la lecture de la feuille : ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) return;
    setIsCreatingSheet(true);
    setStatusMessage(null);

    try {
      const newSheet = await createBudgetSpreadsheet(accessToken, 'PiggyBank - Suivi de Budget');
      
      const newSettings: SyncSettings = {
        ...settings,
        spreadsheetId: newSheet.id,
        spreadsheetName: newSheet.name,
        syncMethod: 'oauth',
        lastSyncTime: new Date().toLocaleString('fr-FR'),
      };
      onSaveSettings(newSettings);

      // Refresh list
      await loadDriveFiles(accessToken);

      setStatusMessage({
        type: 'success',
        text: `Nouvelle feuille "${newSheet.name}" créée dans votre Google Drive et liée !`,
      });
    } catch (err: any) {
      console.error('Error creating sheet:', err);
      setStatusMessage({
        type: 'error',
        text: `Erreur lors de la création de la feuille : ${err.message}`,
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const filteredFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div 
        id="google-drive-sheet-modal"
        className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Compte Google & Google Sheets
              </h2>
              <p className="text-xs text-slate-500">
                Liaison directe avec votre Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start space-x-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">{statusMessage.text}</div>
            </div>
          )}

          {/* User Auth State */}
          {!user ? (
            <div className="text-center py-6 px-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-emerald-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-900">
                  Connectez votre compte Google
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Connectez-vous pour choisir automatiquement votre feuille de calcul dans votre Google Drive ou en créer une nouvelle en 1 clic.
                </p>
              </div>

              {/* Official Google Sign-In Button */}
              <div className="flex justify-center pt-2">
                <button
                  id="google-signin-btn"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="flex items-center space-x-3 px-5 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-300 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Connexion...' : 'Se connecter avec Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Logged in User Bar */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-8 h-8 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{user.displayName || user.email}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-[11px] font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>

              {/* Active Sheet Card */}
              {settings.spreadsheetId ? (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center">
                      <Check className="w-3 h-3 mr-1 text-emerald-600" />
                      Feuille actuellement connectée
                    </span>
                    <h4 className="font-bold text-emerald-950 text-sm">{settings.spreadsheetName || 'Feuille active'}</h4>
                    <p className="text-[11px] text-emerald-700">
                      Synchronisation automatique bidirectionnelle active
                    </p>
                  </div>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-300 transition-colors shrink-0"
                  >
                    <span>Ouvrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  Aucune feuille sélectionnée pour le moment. Choisissez-en une ci-dessous ou créez-en une automatiquement.
                </div>
              )}

              {/* Action: Create New Budget Sheet */}
              <div className="p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Option 1 : Créer une nouvelle feuille prête à l'emploi
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Génère le fichier avec vos 6 colonnes préconfigurées (<code className="text-emerald-700">Timestamp, Date, Compte...</code>) dans votre Google Drive.
                  </p>
                </div>
                <button
                  id="btn-create-sheet"
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreatingSheet ? 'Création...' : 'Créer dans Google Drive'}</span>
                </button>
              </div>

              {/* Action: Choose Existing Sheet from Drive */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center">
                    <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                    Option 2 : Choisir une feuille existante dans votre Google Drive
                  </h4>
                  {accessToken && (
                    <button
                      onClick={() => loadDriveFiles(accessToken)}
                      disabled={isLoadingFiles}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  )}
                </div>

                {/* Search Drive Sheets */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrer vos feuilles Google Drive..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Drive Sheets List */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto bg-white">
                  {isLoadingFiles ? (
                    <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Recherche de vos feuilles Google Sheets...</span>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Aucune feuille trouvée correspondant à votre recherche.
                    </div>
                  ) : (
                    filteredFiles.map((file) => {
                      const isSelected = settings.spreadsheetId === file.id;
                      return (
                        <div
                          key={file.id}
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                            <FileSpreadsheet
                              className={`w-4 h-4 shrink-0 ${
                                isSelected ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className={`font-semibold text-xs truncate ${isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}>
                                {file.name}
                              </p>
                              {file.modifiedTime && (
                                <p className="text-[10px] text-slate-400 flex items-center mt-0.5">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Modifié le {new Date(file.modifiedTime).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {isSelected ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-[11px] flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelectSheet(file)}
                                disabled={isSyncing}
                                className="px-3 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                              >
                                {isSyncing ? 'Chargement...' : 'Sélectionner'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            PiggyBank • Connexion officielle Google Sheets & Drive
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
