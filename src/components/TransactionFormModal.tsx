import React, { useState } from 'react';
import { X, PlusCircle, Check, ArrowDownLeft, ArrowUpRight, CloudUpload, Calendar, Tag, CreditCard, Plus } from 'lucide-react';
import { Transaction } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS, CategoryConfig, PRESET_COLORS, buildCustomCategoryConfig } from '../data/categories';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Transaction, syncToSheet: boolean) => Promise<void>;
  onEditTransaction?: (tx: Transaction, syncToSheet: boolean) => Promise<void>;
  initialTransaction?: Transaction | null;
  hasSheetSync: boolean;
  customAccounts: string[];
  categories?: CategoryConfig[];
  onAddCategory?: (category: CategoryConfig) => void;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  initialTransaction,
  hasSheetSync,
  customAccounts,
  categories = DEFAULT_CATEGORIES,
  onAddCategory,
}) => {
  const isEditing = Boolean(initialTransaction);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [montant, setMontant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categorie, setCategorie] = useState<string>('Alimentation');
  const [compte, setCompte] = useState<string>('Compte Courant');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [syncToSheet, setSyncToSheet] = useState<boolean>(hasSheetSync);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Synchronize state when opening or when initialTransaction changes
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (initialTransaction) {
        setType(initialTransaction.montant >= 0 ? 'income' : 'expense');
        setMontant(Math.abs(initialTransaction.montant).toString());
        setDescription(initialTransaction.description);
        setCategorie(initialTransaction.categorie);
        setCompte(initialTransaction.compte);
        setDate(initialTransaction.date);
        setSyncToSheet(hasSheetSync);
      } else {
        setType('expense');
        setMontant('');
        setDescription('');
        setCategorie('Alimentation');
        setCompte('Compte Courant');
        setDate(new Date().toISOString().split('T')[0]);
        setSyncToSheet(hasSheetSync);
      }
    }
  }, [isOpen, initialTransaction, hasSheetSync]);

  // Quick category creation state
  const [isCreatingCat, setIsCreatingCat] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatColor, setNewCatColor] = useState<string>('#10b981');

  if (!isOpen) return null;

  const accountsList = Array.from(new Set([...DEFAULT_ACCOUNTS, ...customAccounts]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedMontant = parseFloat(montant.replace(',', '.'));
    if (isNaN(parsedMontant) || parsedMontant <= 0) {
      setErrorMsg('Veuillez saisir un montant supérieur à 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Veuillez renseigner une description (ex: Courses, Loyer, Salaire...).');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalAmount = type === 'expense' ? -Math.abs(parsedMontant) : Math.abs(parsedMontant);

      if (isEditing && initialTransaction && onEditTransaction) {
        const updatedTransaction: Transaction = {
          ...initialTransaction,
          date: date || initialTransaction.date,
          compte: compte.trim() || 'Compte Courant',
          description: description.trim(),
          categorie: categorie.trim() || 'Autre',
          montant: finalAmount,
        };

        await onEditTransaction(updatedTransaction, syncToSheet && hasSheetSync);
      } else {
        const newTransaction: Transaction = {
          id: `tx-${Date.now()}`,
          timestamp: new Date().toISOString(),
          date: date || new Date().toISOString().split('T')[0],
          compte: compte.trim() || 'Compte Courant',
          description: description.trim(),
          categorie: categorie.trim() || 'Autre',
          montant: finalAmount,
        };

        await onAddTransaction(newTransaction, syncToSheet && hasSheetSync);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'opération.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    type === 'expense' ? c.type === 'expense' || c.type === 'both' : c.type === 'income' || c.type === 'both'
  );

  const handleQuickAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setCategorie(trimmed);
      setIsCreatingCat(false);
      setNewCatName('');
      return;
    }
    const newCat = buildCustomCategoryConfig(trimmed, newCatColor, type);
    if (onAddCategory) {
      onAddCategory(newCat);
    }
    setCategorie(trimmed);
    setIsCreatingCat(false);
    setNewCatName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4">
      <div 
        id="transaction-modal"
        className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {isEditing ? "Modifier l'opération" : "Ajouter une opération"}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              {isEditing
                ? "Mise à jour immédiate de vos données"
                : "Ajout immédiat dans le suivi budgétaire"}
            </p>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Type Toggle: Dépense vs Revenu */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              id="type-expense-btn"
              onClick={() => {
                setType('expense');
                if (categorie === 'Salaire & Revenus') setCategorie('Alimentation');
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Dépense (-)</span>
            </button>
            <button
              type="button"
              id="type-income-btn"
              onClick={() => {
                setType('income');
                setCategorie('Salaire & Revenus');
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === 'income'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Revenu (+)</span>
            </button>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Montant en Euros (€) *
            </label>
            <div className="relative">
              <input
                id="input-montant"
                type="text"
                inputMode="decimal"
                required
                autoFocus
                placeholder="0.00"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full text-2xl font-bold px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                €
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Libellé *
            </label>
            <input
              id="input-description"
              type="text"
              required
              placeholder="ex: Courses Supermarché, Loyer, Restaurant..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900"
            />
          </div>

          {/* Categorie & Compte Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Catégorie
                </label>
                {!isCreatingCat && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingCat(true)}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-0.5" />
                    <span>Créer</span>
                  </button>
                )}
              </div>

              {isCreatingCat ? (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nom de la catégorie..."
                      className="flex-1 px-2.5 py-1 text-xs border border-emerald-300 rounded-lg bg-white focus:outline-emerald-600"
                      autoFocus
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-7 h-7 rounded-md border border-emerald-300 cursor-pointer p-0.5 bg-white"
                      title="Couleur de la catégorie"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCat(false);
                        setNewCatName('');
                      }}
                      className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      disabled={!newCatName.trim()}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  id="select-categorie"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Compte bancaire
              </label>
              <select
                id="select-compte"
                value={compte}
                onChange={(e) => setCompte(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                {accountsList.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Date de l'opération
            </label>
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Sync to Sheet Checkbox */}
          {hasSheetSync ? (
            <div className="flex items-center space-x-2 pt-1">
              <input
                id="checkbox-sync-sheet"
                type="checkbox"
                checked={syncToSheet}
                onChange={(e) => setSyncToSheet(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="checkbox-sync-sheet" className="text-xs text-slate-600 cursor-pointer flex items-center">
                <CloudUpload className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {isEditing
                  ? "Mettre à jour également dans ma feuille Google Sheet"
                  : "Ajouter simultanément dans ma feuille Google Sheet"}
              </label>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Google Sheet non lié. L'opération sera enregistrée localement.
            </p>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              id="submit-transaction-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-sm shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{isEditing ? 'Mise à jour...' : 'Enregistrement...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isEditing ? 'Enregistrer les modifications' : "Enregistrer l'opération"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
