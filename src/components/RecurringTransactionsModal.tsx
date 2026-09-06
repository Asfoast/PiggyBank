import React, { useState } from 'react';
import {
  X,
  Repeat,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Play,
  Sparkles,
  Layers,
} from 'lucide-react';
import { RecurringTransaction, Transaction } from '../types';
import { CategoryConfig, DEFAULT_CATEGORIES } from '../data/categories';

interface RecurringTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringList: RecurringTransaction[];
  onSaveRecurringList: (list: RecurringTransaction[]) => void;
  onTriggerRecurring: (recurringItem: RecurringTransaction) => void;
  customAccounts: string[];
  categories?: CategoryConfig[];
}

export const RecurringTransactionsModal: React.FC<RecurringTransactionsModalProps> = ({
  isOpen,
  onClose,
  recurringList,
  onSaveRecurringList,
  onTriggerRecurring,
  customAccounts,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<'depense' | 'revenu'>('depense');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [categorie, setCategorie] = useState('Abonnements');
  const [compte, setCompte] = useState('Compte Courant');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const totalChargesFixes = recurringList
    .filter((r) => r.active && r.montant < 0)
    .reduce((sum, r) => sum + Math.abs(r.montant), 0);

  const totalRevenusFixes = recurringList
    .filter((r) => r.active && r.montant > 0)
    .reduce((sum, r) => sum + r.montant, 0);

  const handleToggleActive = (id: string) => {
    const updated = recurringList.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    onSaveRecurringList(updated);
  };

  const handleDelete = (id: string) => {
    const updated = recurringList.filter((item) => item.id !== id);
    onSaveRecurringList(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(montant.replace(',', '.'));
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const finalMontant = type === 'depense' ? -parsedAmount : parsedAmount;

    if (editingId) {
      const updated = recurringList.map((item) =>
        item.id === editingId
          ? {
              ...item,
              description: description.trim(),
              montant: finalMontant,
              dayOfMonth: Number(dayOfMonth),
              categorie,
              compte,
              note: note.trim() || undefined,
            }
          : item
      );
      onSaveRecurringList(updated);
      setEditingId(null);
    } else {
      const newItem: RecurringTransaction = {
        id: `rec-${Date.now()}`,
        description: description.trim(),
        montant: finalMontant,
        dayOfMonth: Number(dayOfMonth),
        categorie,
        compte,
        active: true,
        note: note.trim() || undefined,
      };
      onSaveRecurringList([...recurringList, newItem]);
    }

    // Reset form
    setDescription('');
    setMontant('');
    setDayOfMonth(1);
    setNote('');
    setIsAdding(false);
  };

  const startEdit = (item: RecurringTransaction) => {
    setEditingId(item.id);
    setDescription(item.description);
    setMontant(String(Math.abs(item.montant)));
    setType(item.montant < 0 ? 'depense' : 'revenu');
    setDayOfMonth(item.dayOfMonth);
    setCategorie(item.categorie);
    setCompte(item.compte);
    setNote(item.note || '');
    setIsAdding(true);
  };

  const currentYearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4">
      <div
        id="recurring-modal"
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Abonnements & Récurrences
              </h2>
              <p className="text-xs text-slate-500">
                Prélèvements et revenus automatiques chaque mois à date fixe
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="font-semibold text-xs flex items-center">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" />
                  Charges fixes mensuelles
                </span>
              </div>
              <p className="text-base sm:text-lg font-bold text-rose-900">
                -{totalChargesFixes.toFixed(2)} €
                <span className="text-[11px] font-normal text-rose-600 ml-1">/ mois</span>
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5">
                {recurringList.filter((r) => r.active && r.montant < 0).length} abonnement(s) actif(s)
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="font-semibold text-xs flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  Revenus récurrents
                </span>
              </div>
              <p className="text-base sm:text-lg font-bold text-emerald-900">
                +{totalRevenusFixes.toFixed(2)} €
                <span className="text-[11px] font-normal text-emerald-600 ml-1">/ mois</span>
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">
                {recurringList.filter((r) => r.active && r.montant > 0).length} revenu(s) récurrent(s)
              </p>
            </div>
          </div>

          {/* Action button */}
          {!isAdding && (
            <div className="flex items-center justify-between pt-1">
              <h3 className="font-bold text-slate-900 text-xs">
                Mes prélèvements et virements automatiques
              </h3>
              <button
                id="btn-add-recurring"
                onClick={() => {
                  setEditingId(null);
                  setDescription('');
                  setMontant('');
                  setDayOfMonth(1);
                  setIsAdding(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un abonnement / récurrence</span>
              </button>
            </div>
          )}

          {/* Add / Edit Form */}
          {isAdding && (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  {editingId ? "Modifier la récurrence" : "Nouvel abonnement ou récurrence"}
                </h4>
                <div className="flex items-center bg-slate-200 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setType('depense')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      type === 'depense'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Dépense / Abonnement
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('revenu')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      type === 'revenu'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Revenu fixe
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nom / Libellé (ex: Netflix, Loyer, Spotify...)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Netflix, Salle de sport, Salaire..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="ex: 13.49"
                    value={montant}
                    onChange={(e) => setMontant(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Jour du mois (du 1 au 31)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                    <span className="text-[11px] text-slate-500">
                      Chaque mois le {dayOfMonth}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Compte bancaire
                  </label>
                  <select
                    value={compte}
                    onChange={(e) => setCompte(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Compte Courant">Compte Courant</option>
                    <option value="Carte Bancaire">Carte Bancaire</option>
                    <option value="Livret A">Livret A</option>
                    {customAccounts
                      .filter((a) => !['Compte Courant', 'Carte Bancaire', 'Livret A'].includes(a))
                      .map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Note / Précision (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Forfait annuel mensualisé..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs"
                >
                  {editingId ? "Mettre à jour" : "Enregistrer la récurrence"}
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Transactions */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
            {recurringList.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                Aucun abonnement ou récurrence enregistrée pour le moment.
              </div>
            ) : (
              recurringList.map((item) => {
                const isExpense = item.montant < 0;
                const isExecutedThisMonth = item.lastProcessedMonth === currentYearMonth;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      !item.active ? 'opacity-50 bg-slate-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <button
                        onClick={() => handleToggleActive(item.id)}
                        title={item.active ? 'Désactiver' : 'Activer'}
                        className="cursor-pointer text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                      >
                        {item.active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {item.description}
                          </p>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium">
                            Le {item.dayOfMonth} du mois
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{item.categorie}</span>
                          <span>•</span>
                          <span>{item.compte}</span>
                          {isExecutedThisMonth && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                                Enregistré pour {currentYearMonth}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      <span
                        className={`font-bold text-xs sm:text-sm ${
                          isExpense ? 'text-slate-900' : 'text-emerald-600'
                        }`}
                      >
                        {isExpense ? '' : '+'}
                        {item.montant.toFixed(2)} €
                      </span>

                      {/* Immediate manual trigger */}
                      <button
                        onClick={() => onTriggerRecurring(item)}
                        title="Enregistrer manuellement pour ce mois-ci"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => startEdit(item)}
                        className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      >
                        Modifier
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Supprimer la récurrence"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Les récurrences actives sont automatiquement ajoutées chaque mois dès que la date est atteinte.
          </p>
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
