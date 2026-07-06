// Bourse de départ (po) selon classe + historique. Valeurs indicatives.
const OR_CLASSE = { Guerrier: 60, Magicien: 40, Roublard: 50, Clerc: 50 };
const OR_HISTORIQUE = {
  Noble: 25, Criminel: 15, Soldat: 10, Sage: 10,
  Acolyte: 15, Artisan: 15, Ermite: 5, Vagabond: 10,
};
export function bourseDepart(classe, historique) {
  const po = (OR_CLASSE[classe] ?? 40) + (OR_HISTORIQUE[historique] ?? 10);
  return { po, pa: 0, pc: 0 };
}