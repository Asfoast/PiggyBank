import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Download,
  Tag,
  Plus,
  Edit2,
  Trash2,
  GitMerge,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  Save,
  ArrowRight,
  Database,
  Layers,
  Code,
  Share2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Transaction, SyncSettings, RecurringTransaction } from '../types';
import { CategoryConfig, PRESET_COLORS, buildCustomCategoryConfig } from '../data/categories';
import { logout } from '../services/googleAuth';
import { fetchSheetTransactions, RECOMMENDED_APPS_SCRIPT_CODE } from '../services/googleSheetService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryConfig[];
  onSaveCategories: (categories: CategoryConfig[]) => void;
  transactions: Transaction[];
  onUpdateTransactions: (transactions: Transaction[]) => void;
  recurringList: RecurringTransaction[];
  onUpdateRecurringList: (recurring: RecurringTransaction[]) => void;
  settings: SyncSettings;
  onSaveSettings: (settings: SyncSettings) => void;
  user: User | null;
  onOpenGoogleDriveModal: () => void;
  onOpenSheetDirectly: () => void;
  onResetDemoData: () => void;
  initialTab?: 'install' | 'categories' | 'google' | 'advanced';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategories,
  transactions,
  onUpdateTransactions,
  recurringList,
  onUpdateRecurringList,
  settings,
  onSaveSettings,
  user,
  onOpenGoogleDriveModal,
  onOpenSheetDirectly,
  onResetDemoData,
  initialTab = 'categories',
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'categories' | 'google' | 'advanced'>(initialTab);

  // Category management states
  const [categorySubMode, setCategorySubMode] = useState<'list' | 'create' | 'edit' | 'merge'>('list');
  const [editingCategory, setEditingCategory] = useState<CategoryConfig | null>(null);

  // Form: Create/Edit category
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#10b981');
  const [catType, setCatType] = useState<'expense' | 'income' | 'both'>('expense');

  // Form: Merge categories
  const [mergeSource, setMergeSource] = useState<string>('');
  const [mergeTarget, setMergeTarget] = useState<string>('');

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Script & Netlify states
  const [webAppUrl, setWebAppUrl] = useState<string>(settings.webAppUrl || '');
  const [isTestingScript, setIsTestingScript] = useState<boolean>(false);
  const [scriptTestResult, setScriptTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const isRunningStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Category Actions ---
  const handleOpenCreateCategory = () => {
    setCatName('');
    setCatColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setCatType('expense');
    setCategorySubMode('create');
  };

  const handleOpenEditCategory = (cat: CategoryConfig) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatColor(cat.color);
    setCatType(cat.type);
    setCategorySubMode('edit');
  };

  const handleSaveNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = catName.trim();
    if (!trimmed) {
      showFeedback('Veuillez saisir un nom de catégorie.', 'error');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showFeedback(`La catégorie "${trimmed}" existe déjà.`, 'error');
      return;
    }

    const newCat = buildCustomCategoryConfig(trimmed, catColor, catType);
    const updated = [...categories, newCat];
    onSaveCategories(updated);
    showFeedback(`Catégorie "${trimmed}" créée avec succès !`, 'success');
    setCategorySubMode('list');
  };

  const handleSaveEditedCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const oldName = editingCategory.name;
    const newName = catName.trim();
    if (!newName) {
      showFeedback('Le nom de la catégorie ne peut pas être vide.', 'error');
      return;
    }

    if (
      newName.toLowerCase() !== oldName.toLowerCase() &&
      categories.some((c) => c.name.toLowerCase() === newName.toLowerCase())
    ) {
      showFeedback(`Une catégorie nommée "${newName}" existe déjà.`, 'error');
      return;
    }

    // 1. Update categories array
    const updatedCategories = categories.map((c) =>
      c.name === oldName
        ? {
            ...c,
            name: newName,
            color: catColor,
            type: catType,
          }
        : c
    );
    onSaveCategories(updatedCategories);

    // 2. If name changed, rename in existing transactions
    let txCount = 0;
    if (oldName !== newName) {
      const updatedTx = transactions.map((t) => {
        if (t.categorie === oldName) {
          txCount++;
          return { ...t, categorie: newName };
        }
        return t;
      });
      if (txCount > 0) {
        onUpdateTransactions(updatedTx);
      }

      // 3. Rename in recurring list
      const updatedRec = recurringList.map((r) => {
        if (r.categorie === oldName) {
          return { ...r, categorie: newName };
        }
        return r;
      });
      onUpdateRecurringList(updatedRec);
    }

    showFeedback(
      `Catégorie "${newName}" mise à jour (${txCount} transaction(s) renommée(s)) !`,
      'success'
    );
    setCategorySubMode('list');
    setEditingCategory(null);
  };

  const handleOpenMerge = () => {
    if (categories.length < 2) {
      showFeedback('Il faut au moins 2 catégories pour effectuer une fusion.', 'error');
      return;
    }
    setMergeSource(categories[0].name);
    setMergeTarget(categories[1].name);
    setCategorySubMode('merge');
  };

  const handleConfirmMerge = () => {
    if (!mergeSource || !mergeTarget) {
      showFeedback('Veuillez sélectionner la catégorie source et la catégorie cible.', 'error');
      return;
    }
    if (mergeSource === mergeTarget) {
      showFeedback('Veuillez choisir deux catégories distinctes.', 'error');
      return;
    }

    // 1. Update transactions
    let countTx = 0;
    const updatedTx = transactions.map((t) => {
      if (t.categorie === mergeSource) {
        countTx++;
        return { ...t, categorie: mergeTarget };
      }
      return t;
    });
    onUpdateTransactions(updatedTx);

    // 2. Update recurring list
    let countRec = 0;
    const updatedRec = recurringList.map((r) => {
      if (r.categorie === mergeSource) {
        countRec++;
        return { ...r, categorie: mergeTarget };
      }
      return r;
    });
    onUpdateRecurringList(updatedRec);

    // 3. Remove source category from list
    const updatedCategories = categories.filter((c) => c.name !== mergeSource);
    onSaveCategories(updatedCategories);

    showFeedback(
      `Fusion réussie ! ${countTx} opération(s) et ${countRec} abonnement(s) ont été transférés de "${mergeSource}" vers "${mergeTarget}".`,
      'success'
    );
    setCategorySubMode('list');
  };

  const handleDeleteCategory = (catToDelete: CategoryConfig) => {
    const txCount = transactions.filter((t) => t.categorie === catToDelete.name).length;
    const recCount = recurringList.filter((r) => r.categorie === catToDelete.name).length;

    const confirmed = window.confirm(
      txCount > 0 || recCount > 0
        ? `La catégorie "${catToDelete.name}" est utilisée par ${txCount} transaction(s) et ${recCount} abonnement(s).\nSi vous la supprimez, ces éléments seront réassignés à la catégorie "Autre".\n\nConfirmer la suppression ?`
        : `Supprimer définitivement la catégorie "${catToDelete.name}" ?`
    );

    if (!confirmed) return;

    // Reassign to 'Autre' if necessary
    if (txCount > 0) {
      const updatedTx = transactions.map((t) =>
        t.categorie === catToDelete.name ? { ...t, categorie: 'Autre' } : t
      );
      onUpdateTransactions(updatedTx);
    }
    if (recCount > 0) {
      const updatedRec = recurringList.map((r) =>
        r.categorie === catToDelete.name ? { ...r, categorie: 'Autre' } : r
      );
      onUpdateRecurringList(updatedRec);
    }

    const updatedCategories = categories.filter((c) => c.name !== catToDelete.name);
    onSaveCategories(updatedCategories);
    showFeedback(`Catégorie "${catToDelete.name}" supprimée.`, 'info');
  };

  // --- PWA Install Trigger ---
  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showFeedback('PiggyBank a été installée sur votre appareil !', 'success');
      }
      setDeferredPrompt(null);
    } else {
      showFeedback(
        "Pour installer sur mobile : appuyez sur le menu de votre navigateur (⋮ ou Partager) puis 'Ajouter à l'écran d'accueil'.",
        'info'
      );
    }
  };

  // --- Google & Apps Script Actions ---
  const handleTestScript = async () => {
    if (!webAppUrl.trim()) {
      setScriptTestResult({
        success: false,
        message: "Veuillez d'abord saisir l'URL Web App Google Apps Script.",
      });
      return;
    }
    setIsTestingScript(true);
    setScriptTestResult(null);

    const res = await fetchSheetTransactions(webAppUrl.trim());
    setIsTestingScript(false);
    setScriptTestResult({
      success: res.success,
      message: res.message,
    });

    if (res.success) {
      onSaveSettings({
        ...settings,
        webAppUrl: webAppUrl.trim(),
        lastSyncTime: new Date().toLocaleString('fr-FR'),
      });
    }
  };

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(RECOMMENDED_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyCurrentDomain = () => {
    if (currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4">
      <div
        id="app-settings-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                Paramètres & Configuration
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Catégories, application mobile, Google Sheets & déploiement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-3 sm:px-6 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => {
              setActiveTab('categories');
              setCategorySubMode('list');
            }}
            className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Catégories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('install')}
            className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Télécharger l'Appli</span>
            {isStandalone && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Déjà installée" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'google'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Connexion Google</span>
            {settings.spreadsheetId && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Feuille liée" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('advanced')}
            className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'advanced'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Avancé & Netlify</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mx-4 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shrink-0 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-sky-50 text-sky-800 border border-sky-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: CATEGORIES                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              {/* Top Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center">
                    <Tag className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Gestion de vos catégories
                  </h3>
                  <p className="text-xs text-slate-500">
                    Créez, renommez ou fusionnez vos postes de dépenses et revenus
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleOpenCreateCategory}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouvelle catégorie</span>
                  </button>
                  <button
                    onClick={handleOpenMerge}
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Fusionner</span>
                  </button>
                </div>
              </div>

              {/* Submode: Create or Edit Category Form */}
              {(categorySubMode === 'create' || categorySubMode === 'edit') && (
                <form
                  onSubmit={categorySubMode === 'create' ? handleSaveNewCategory : handleSaveEditedCategory}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center">
                      {categorySubMode === 'create' ? (
                        <>
                          <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Créer une nouvelle catégorie
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          Modifier "{editingCategory?.name}"
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCategorySubMode('list')}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nom de la catégorie
                      </label>
                      <input
                        type="text"
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        placeholder="Ex: Animaux, Cadeaux, Impôts..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 font-medium"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nature de l'opération
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCatType('expense')}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            catType === 'expense'
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Dépense
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatType('income')}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            catType === 'income'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Revenu
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatType('both')}
                          className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                            catType === 'both'
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Les deux
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Color Picker Palette */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                      Couleur de l'étiquette
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setCatColor(color)}
                          className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative ${
                            catColor === color ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Couleur ${color}`}
                        >
                          {catColor === color && (
                            <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto" />
                          )}
                        </button>
                      ))}
                      <div className="flex items-center space-x-1.5 ml-2">
                        <input
                          type="color"
                          value={catColor}
                          onChange={(e) => setCatColor(e.target.value)}
                          className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{catColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCategorySubMode('list')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{categorySubMode === 'create' ? 'Créer la catégorie' : 'Enregistrer les modifications'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Submode: Merge Categories Form */}
              {categorySubMode === 'merge' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center">
                      <GitMerge className="w-4 h-4 mr-1.5 text-indigo-700" />
                      Fusionner deux catégories
                    </span>
                    <button
                      onClick={() => setCategorySubMode('list')}
                      className="text-xs text-indigo-700 hover:text-indigo-950 font-medium cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>

                  <p className="text-xs text-indigo-800/90 leading-relaxed">
                    Toutes les opérations associées à la catégorie source seront immédiatement réassignées à la catégorie cible, puis la catégorie source sera retirée.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                        1. Catégorie source (à absorber et supprimer)
                      </label>
                      <select
                        value={mergeSource}
                        onChange={(e) => setMergeSource(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-medium focus:outline-indigo-600 cursor-pointer"
                      >
                        {categories.map((c) => (
                          <option key={`src-${c.name}`} value={c.name}>
                            {c.name} ({transactions.filter((t) => t.categorie === c.name).length} tx)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-indigo-950 mb-1">
                        2. Catégorie cible (qui recevra les opérations)
                      </label>
                      <select
                        value={mergeTarget}
                        onChange={(e) => setMergeTarget(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-xl bg-white font-medium focus:outline-indigo-600 cursor-pointer"
                      >
                        {categories
                          .filter((c) => c.name !== mergeSource)
                          .map((c) => (
                            <option key={`tgt-${c.name}`} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {mergeSource && mergeTarget && (
                    <div className="p-3 bg-white rounded-xl border border-indigo-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-800">{mergeSource}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-emerald-700">{mergeTarget}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {transactions.filter((t) => t.categorie === mergeSource).length} transaction(s) déplacée(s)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setCategorySubMode('list')}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmMerge}
                      disabled={!mergeSource || !mergeTarget || mergeSource === mergeTarget}
                      className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white shadow-2xs cursor-pointer"
                    >
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Confirmer la fusion</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                {categories.map((cat) => {
                  const txCount = transactions.filter((t) => t.categorie === cat.name).length;
                  const recCount = recurringList.filter((r) => r.categorie === cat.name).length;

                  return (
                    <div
                      key={cat.name}
                      className="p-2.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-white flex items-center justify-between transition-colors shadow-2xs group"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                            {cat.name}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                            <span>{cat.type === 'expense' ? 'Dépense' : cat.type === 'income' ? 'Revenu' : 'Mixte'}</span>
                            <span>•</span>
                            <span>{txCount} tx</span>
                            {recCount > 0 && <span>• {recCount} abo</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditCategory(cat)}
                          title="Modifier ou renommer cette catégorie"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {cat.name !== 'Autre' && (
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            title="Supprimer cette catégorie"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TELECHARGER L'APPLI (PWA)                                           */}
          {/* ========================================================================= */}
          {activeTab === 'install' && (
            <div className="space-y-5">
              {/* Install Hero Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold text-emerald-100">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Application Web Progressive (PWA)</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold">
                    Installer PiggyBank sur votre mobile
                  </h3>
                  <p className="text-xs text-emerald-100 leading-relaxed max-w-md">
                    Accédez à votre budget en 1 clic sans passer par le navigateur, avec icône dédiée et fonctionnement ultra-rapide.
                  </p>
                </div>

                <button
                  onClick={handleTriggerInstall}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 text-xs font-bold shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Installer sur cet appareil</span>
                </button>
              </div>

              {/* Step by step guides */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Comment installer manuellement selon votre appareil
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Android / Samsung */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px]">
                        1
                      </span>
                      <span>Android / Samsung (Chrome / Samsung Internet)</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Ouvrez <strong>fintim.netlify.app</strong> sur votre mobile.</li>
                      <li>Appuyez sur les <strong>trois points (⋮)</strong> en haut ou bas à droite.</li>
                      <li>Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.</li>
                      <li>Validez : l'icône PiggyBank s'ajoute à vos applications !</li>
                    </ol>
                  </div>

                  {/* iPhone / iPad */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
                      <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center text-[11px]">
                        2
                      </span>
                      <span>iPhone & iPad (Safari)</span>
                    </div>
                    <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Ouvrez l'application dans <strong>Safari</strong>.</li>
                      <li>Appuyez sur le bouton <strong>Partager</strong> (<Share2 className="w-3 h-3 inline" />).</li>
                      <li>Faites défiler vers le bas et choisissez <strong>"Sur l'écran d'accueil"</strong>.</li>
                      <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CONNEXION GOOGLE & GOOGLE SHEETS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {/* Account Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      {user?.displayName ? user.displayName[0] : 'G'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {user ? user.displayName || user.email : 'Non connecté à Google'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {user ? user.email : 'Connectez votre compte pour synchroniser directement votre Google Drive'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {user ? (
                    <button
                      onClick={async () => {
                        await logout();
                        showFeedback('Déconnexion Google effectuée.', 'info');
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGoogleDriveModal();
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                    >
                      <span>Se connecter</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Linked Sheet Status & Direct Open Button */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-950">
                      Feuille Google Sheet choisie pour vos données
                    </h4>
                  </div>
                  {settings.spreadsheetId ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">
                      Liée & Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Aucune feuille sélectionnée
                    </span>
                  )}
                </div>

                {settings.spreadsheetId ? (
                  <div className="space-y-2">
                    <p className="text-xs text-emerald-900 font-semibold">
                      Nom : <span className="font-bold">{settings.spreadsheetName || 'PiggyBank - Budget & Abonnements'}</span>
                    </p>
                    <p className="text-[11px] text-emerald-800 font-mono truncate">
                      ID : {settings.spreadsheetId}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Direct Open Button */}
                      <button
                        onClick={onOpenSheetDirectly}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ouvrir la feuille Google Sheet ↗</span>
                      </button>

                      {/* Change Sheet */}
                      <button
                        onClick={() => {
                          onClose();
                          onOpenGoogleDriveModal();
                        }}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Changer de feuille ou en créer une</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Liez une feuille Google Sheet stockée dans votre Google Drive pour sauvegarder chaque dépense en direct.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGoogleDriveModal();
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sélectionner ou créer une feuille Google Sheet</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Domain Authorization helper for Netlify */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-slate-600" />
                    Domaine web actuel :
                  </span>
                  <button
                    onClick={handleCopyCurrentDomain}
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-[11px] text-slate-700 cursor-pointer font-medium"
                  >
                    {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDomain ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <code className="block p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px]">
                  {currentDomain}
                </code>
                <p className="text-[11px] text-slate-500">
                  Si la connexion Google signale un domaine non autorisé, ajoutez ce domaine dans votre{' '}
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0746286348/authentication/settings"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-semibold underline"
                  >
                    console Firebase (Domaines autorisés)
                  </a>.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: AVANCÉ & NETLIFY                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'advanced' && (
            <div className="space-y-5">
              {/* Google Apps Script Option */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-slate-900 flex items-center">
                  <Code className="w-3.5 h-3.5 mr-1.5 text-slate-700" />
                  Mode alternatif : Google Apps Script Web App
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permet la synchronisation sans restriction de domaine OAuth, via un simple script déployé sur votre Google Sheet.
                </p>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    URL de l'application Web Google Apps Script
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={webAppUrl}
                      onChange={(e) => setWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                    />
                    <button
                      onClick={handleTestScript}
                      disabled={isTestingScript}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingScript ? 'animate-spin' : ''}`} />
                      <span>{isTestingScript ? 'Test...' : 'Tester & Sauvegarder'}</span>
                    </button>
                  </div>
                </div>

                {scriptTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
                      scriptTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {scriptTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{scriptTestResult.message}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-[11px] text-slate-500">
                    Code du script Google à copier dans Extensions &gt; Apps Script :
                  </span>
                  <button
                    onClick={handleCopyScriptCode}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copié !' : 'Copier le script'}</span>
                  </button>
                </div>
              </div>

              {/* Netlify Deployment Info */}
              <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-2 text-xs">
                <h4 className="font-bold text-sky-950 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-sky-700" />
                  Configuration Netlify prête
                </h4>
                <p className="text-sky-900 leading-relaxed">
                  Le fichier <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-mono text-[11px]">netlify.toml</code> et les redirections SPA sont en place. Dès que vous poussez sur GitHub, Netlify compile directement le dossier <code className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-mono text-[11px]">dist</code> sans page blanche.
                </p>
              </div>

              {/* Danger Zone: Reset Demo Data */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-rose-900 flex items-center">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-700" />
                  Réinitialisation des données
                </h4>
                <p className="text-xs text-rose-800 leading-relaxed">
                  Permet de recharger le jeu de transactions d'exemple si vous souhaitez repartir à zéro.
                </p>
                <button
                  onClick={() => {
                    const ok = window.confirm('Attention : toutes les transactions actuelles seront réinitialisées aux données de démo. Continuer ?');
                    if (ok) {
                      onResetDemoData();
                      showFeedback('Données de démo réinitialisées.', 'info');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 transition-colors cursor-pointer"
                >
                  Réinitialiser les données de démo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            PiggyBank v2.0 • Gestion de Budget & Abonnements
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
