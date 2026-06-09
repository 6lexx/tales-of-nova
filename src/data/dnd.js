// Données de référence D&D 5e (2024), en français.

export const ESPECES = [
  'Aasimar', 'Drakéide', 'Nain', 'Elfe', 'Gnome',
  'Goliath', 'Halfelin', 'Humain', 'Orc', 'Tieffelin',
]

// classe -> dé de vie (valeur max du dé)
export const CLASSES = {
  Barbare: 12,
  Barde: 8,
  Clerc: 8,
  Druide: 8,
  Ensorceleur: 6,
  Guerrier: 10,
  Magicien: 6,
  Moine: 8,
  Paladin: 10,
  Rôdeur: 10,
  Roublard: 8,
  Occultiste: 8,
}

export const HISTORIQUES = [
  'Acolyte', 'Artisan', 'Artiste', 'Charlatan', 'Criminel', 'Ermite',
  'Fermier', 'Garde', 'Guide', 'Marchand', 'Marin', 'Noble', 'Sage', 'Soldat',
]

export const CARACTERISTIQUES = [
  { cle: 'force', label: 'FOR' },
  { cle: 'dexterite', label: 'DEX' },
  { cle: 'constitution', label: 'CON' },
  { cle: 'intelligence', label: 'INT' },
  { cle: 'sagesse', label: 'SAG' },
  { cle: 'charisme', label: 'CHA' },
]

export const modificateur = (valeur) => Math.floor((valeur - 10) / 2)

// PV suggérés : max du dé au niv.1 + mod CON, puis moyenne du dé + mod CON par niveau
export function pvSuggeres(classe, constitution, niveau) {
  const de = CLASSES[classe]
  if (!de) return ''
  const modCon = modificateur(constitution)
  const moyenne = Math.floor(de / 2) + 1
  return de + modCon + (niveau - 1) * (moyenne + modCon)
}