// Génère la BIBLE D'ARC d'une campagne en appelant l'edge function "mj"
// (même canal que la narration, clé Anthropic protégée côté serveur).
// Sortie : un objet JSON structuré, parsé et normalisé, prêt à stocker dans campaigns.arc.

import { supabase } from '../lib/supabase'

// Clés de premier niveau attendues (pour la normalisation défensive).
const CLES_ARC = [
  'objectif_long_terme', 'enjeu_personnel', 'information_privilegiee',
  'antagoniste', 'accroche_ouverture', 'lieux_cles', 'pnj_cles',
  'factions', 'jalons', 'graines', 'ton', 'themes',
]

// Nombre de jalons visé selon l'envergure choisie.
const ENVERGURE_JALONS = {
  one_shot: '2 à 3',
  court:    '3 à 4',
  standard: '5 à 6',
  long:     '7 à 9',
}

/**
 * Génère l'arc directeur d'une campagne pour un personnage donné.
 * @param {object} character  Ligne personnage complète (identité + historique généré).
 * @param {object} options    Paramètres de la page « Nouvelle campagne » (ton, type, envergure…).
 * @returns {Promise<object>} L'arc normalisé (toutes les clés présentes).
 */
export async function genererArcCampagne(character = {}, options = {}) {
  const opts = contexteOptions(options)

  const system = `Tu es le concepteur-narrateur d'une partie de D&D 5e solo en français (dark-fantasy, Royaumes Oubliés par défaut).
On te demande de bâtir la BIBLE D'ARC d'une nouvelle campagne, taillée sur mesure pour CE personnage.

Tu réponds UNIQUEMENT par un objet JSON valide, sans aucun texte autour, sans balise Markdown, et SANS commentaire (jamais de // ni de /* */ dans le JSON).

Structure attendue (renvoie EXACTEMENT ces clés et ces types) :
{
  "objectif_long_terme": "",
  "enjeu_personnel": "",
  "information_privilegiee": "",
  "antagoniste": { "nom": "", "motivation": "", "secret": "", "tension_locale": "" },
  "accroche_ouverture": "",
  "lieux_cles": [ { "nom": "", "description": "", "role": "" } ],
  "pnj_cles": [ { "nom": "", "role": "", "motivation": "", "secret": "" } ],
  "factions": [ { "nom": "", "agenda": "" } ],
  "jalons": [ { "titre": "", "declencheur": "", "description": "" } ],
  "graines": [ "" ],
  "ton": "",
  "themes": [ "" ]
}

Rôle de chaque champ :
- objectif_long_terme : menace ou mystère structurant, formulé OUVERT (pas une quête fermée). Reste en toile de fond, PAS évident dès l'ouverture.
- enjeu_personnel : pourquoi CE perso, pourquoi MAINTENANT, ce qu'il risque — ANCRÉ dans son historique fourni (prolonge-le, ne l'invente pas à côté).
- information_privilegiee : un savoir que le perso détient seul, qui valorise sa classe / son background.
- antagoniste : concret, motivation + secret, et une tension_locale palpable DÈS la première scène.
- accroche_ouverture : découle des trois points ci-dessus, met le perso EN MOUVEMENT sans tout dévoiler.
- jalons : paliers de progression NARRATIVE (milestones), jamais des récompenses d'XP.
- graines : détails de foreshadowing / fusils de Tchekhov à ressortir plus tard.

Limites de taille (à respecter pour rester concis ET valide) :
- lieux_cles : 2 à 4  |  pnj_cles : 3 à 5  |  factions : 2 à 3
- jalons : ${opts.nb_jalons_cible}  |  graines : 3 à 5  |  themes : 3 à 5
- Chaque valeur texte : 1 à 3 phrases maximum.

Cohérence : respecte espèce, classe, historique, alignement et TOUS les champs d'histoire déjà générés fournis.
Priorise les options (ton, type d'aventure, envergure, région, centralité de l'historique, létalité).
Si "region" vaut null ou « surprends-moi », choisis toi-même un point de départ crédible des Royaumes Oubliés.
EXCLUS strictement les thèmes listés dans "lignes_et_voiles".`

  const contexte = {
    personnage: contextePersonnage(character),
    options: opts,
  }

  const messages = [{
    role: 'user',
    content: `Génère la bible d'arc en JSON pour cette campagne :\n${JSON.stringify(contexte, null, 2)}`,
  }]

  const { data, error } = await supabase.functions.invoke('mj', {
    body: { messages, system, max_tokens: 4096 },
  })

  if (error) {
    let detail = error.message
    try { detail = JSON.stringify(await error.context.json()) } catch { /* noop */ }
    throw new Error(detail)
  }
  if (data?.error) throw new Error(JSON.stringify(data.error))

  return normaliserArc(extraireJSON(data.texte))
}

/* ── Helpers ─────────────────────────────────────────────── */

// Ne transmet que les champs utiles du personnage (l'historique généré est conservé
// quels que soient ses noms de clés) ; retire les champs techniques et le vide.
function contextePersonnage(character = {}) {
  const EXCLURE = new Set([
    'id', 'user_id', 'campaign_id', 'created_at', 'updated_at',
    'pv_actuels', 'pv_max', 'embedding',
  ])
  const out = {}
  Object.entries(character).forEach(([cle, val]) => {
    if (EXCLURE.has(cle)) return
    if (val === null || val === undefined || val === '') return
    out[cle] = val
  })
  return out
}

// Normalise les options de la page « Nouvelle campagne » avec des valeurs par défaut sûres.
function contexteOptions(options = {}) {
  const envergure = options.envergure || 'standard'
  return {
    ton: options.ton || 'sombre et rude',
    type_aventure: options.type_aventure || null,
    envergure,
    nb_jalons_cible: ENVERGURE_JALONS[envergure] || ENVERGURE_JALONS.standard,
    region: options.region || null,                         // null / « surprends-moi » → au MJ de choisir
    centralite_historique: options.centralite_historique ?? null,
    letalite: options.letalite || null,
    lignes_et_voiles: Array.isArray(options.lignes_et_voiles) ? options.lignes_et_voiles : [],
  }
}

// Extraction JSON robuste : retire les backticks, isole du premier { au dernier },
// puis en secours retire les virgules traînantes (,] ou ,}) qui font échouer JSON.parse.
function extraireJSON(texte = '') {
  const nettoye = texte.replace(/```json|```/g, '').trim()
  const debut = nettoye.indexOf('{')
  const fin = nettoye.lastIndexOf('}')
  if (debut === -1 || fin === -1) throw new Error('Réponse de l’IA illisible (JSON de l’arc introuvable).')
  const brut = nettoye.slice(debut, fin + 1)
  try {
    return JSON.parse(brut)
  } catch {
    const repare = brut.replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(repare) // laisse remonter l'erreur si le JSON reste cassé (ex. tronqué)
  }
}

// Garantit la présence de toutes les clés → aucun crash en aval (buildBlocArc, affichage).
function normaliserArc(o = {}) {
  const arr = (v) => (Array.isArray(v) ? v : [])
  const str = (v) => (typeof v === 'string' ? v : '')
  const a = (o.antagoniste && typeof o.antagoniste === 'object') ? o.antagoniste : {}
  return {
    objectif_long_terme:     str(o.objectif_long_terme),
    enjeu_personnel:         str(o.enjeu_personnel),
    information_privilegiee: str(o.information_privilegiee),
    antagoniste: {
      nom:            str(a.nom),
      motivation:     str(a.motivation),
      secret:         str(a.secret),
      tension_locale: str(a.tension_locale),
    },
    accroche_ouverture: str(o.accroche_ouverture),
    lieux_cles: arr(o.lieux_cles),
    pnj_cles:   arr(o.pnj_cles),
    factions:   arr(o.factions),
    jalons:     arr(o.jalons),
    graines:    arr(o.graines),
    ton:        str(o.ton),
    themes:     arr(o.themes),
  }
}

export { CLES_ARC }