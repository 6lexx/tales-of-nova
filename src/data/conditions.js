// Table de référence des conditions D&D 5e (SRD 5.1 FR).
// Statique : aucune raison de la mettre en base. Sert à l'affichage
// (drawer d'info, tooltip) et à la logique avantage/désavantage des jets.

export const CONDITIONS = {
  a_terre: {
    label: 'À terre',
    icone: 'arrow-down',
    effets: [
      'Seule option de déplacement : ramper (sauf se relever).',
      'Désavantage aux jets d’attaque.',
      'Les attaques au corps à corps contre la créature ont l’avantage ; à distance, désavantage.',
    ],
  },
  agrippe: {
    label: 'Agrippé',
    icone: 'hand-stop',
    effets: [
      'Vitesse réduite à 0, pas de bonus de vitesse.',
      'Prend fin si l’agrippeur est neutralisé ou écarté de force.',
    ],
  },
  assourdi: {
    label: 'Assourdi',
    icone: 'ear-off',
    effets: ['N’entend rien.', 'Échec automatique aux jets nécessitant l’ouïe.'],
  },
  aveugle: {
    label: 'Aveuglé',
    icone: 'eye-off',
    effets: [
      'Ne voit rien ; échec auto aux jets nécessitant la vue.',
      'Désavantage aux attaques ; les attaques contre la créature ont l’avantage.',
    ],
  },
  charme: {
    label: 'Charmé',
    icone: 'heart',
    effets: [
      'Ne peut attaquer le charmeur ni le cibler par un effet néfaste.',
      'Le charmeur a l’avantage aux interactions sociales.',
    ],
  },
  effraye: {
    label: 'Effrayé',
    icone: 'ghost',
    effets: [
      'Désavantage aux jets de caractéristique et d’attaque tant que la source est en vue.',
      'Ne peut volontairement se rapprocher de la source.',
    ],
  },
  empoisonne: {
    label: 'Empoisonné',
    icone: 'flask',
    effets: ['Désavantage aux jets d’attaque et de caractéristique.'],
  },
  entrave: {
    label: 'Entravé',
    icone: 'chains',
    effets: [
      'Vitesse à 0.',
      'Désavantage aux attaques et aux jets de sauvegarde de Dextérité.',
      'Les attaques contre la créature ont l’avantage.',
    ],
  },
  etourdi: {
    label: 'Étourdi',
    icone: 'stars',
    effets: [
      'Incapable d’agir, ne peut parler que de façon hésitante.',
      'Échec auto aux sauvegardes de Force et Dextérité.',
      'Les attaques contre la créature ont l’avantage.',
    ],
  },
  inconscient: {
    label: 'Inconscient',
    icone: 'zzz',
    effets: [
      'Neutralisé, lâche ce qu’il tient, tombe à terre.',
      'Échec auto aux sauvegardes de Force et Dextérité.',
      'Les attaques ont l’avantage ; tout coup au corps à corps est un critique.',
    ],
  },
  invisible: {
    label: 'Invisible',
    icone: 'eye-closed',
    effets: [
      'Impossible à voir sans aide ; considéré comme lourdement masqué.',
      'Avantage aux attaques ; les attaques contre la créature ont le désavantage.',
    ],
  },
  neutralise: {
    label: 'Neutralisé',
    icone: 'ban',
    effets: ['Aucune action, action bonus ni réaction.'],
  },
  paralyse: {
    label: 'Paralysé',
    icone: 'snowflake',
    effets: [
      'Neutralisé, ne peut ni bouger ni parler.',
      'Échec auto aux sauvegardes de Force et Dextérité.',
      'Attaques avantagées ; coup au corps à corps = critique.',
    ],
  },
  petrifie: {
    label: 'Pétrifié',
    icone: 'wall',
    effets: [
      'Transformé en matière inerte, neutralisé.',
      'Résistance à tous les dégâts, immunité poison et maladie.',
      'Échec auto aux sauvegardes de Force et Dextérité.',
    ],
  },
  // épuisement : géré à part (6 niveaux cumulatifs)
};

export const EPUISEMENT = {
  label: 'Épuisement',
  icone: 'battery-1',
  niveaux: [
    'Désavantage aux jets de caractéristique.',
    'Vitesse réduite de moitié.',
    'Désavantage aux attaques et aux sauvegardes.',
    'Maximum de points de vie réduit de moitié.',
    'Vitesse réduite à 0.',
    'Mort.',
  ],
};

export const listConditions = () =>
  Object.entries(CONDITIONS).map(([key, v]) => ({ key, ...v }));
