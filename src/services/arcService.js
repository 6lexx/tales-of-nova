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

Tu réponds UNIQUEMENT par un objet JSON valide, sans aucun texte autour, sans balise Markdown, sans commentaire.

Schéma EXACT à respecter (toutes les clés présentes) :
{
  "objectif_long_terme": "",         // menace ou mystère structurant, formulé OUVERT (pas une quête fermée à cocher)
  "enjeu_personnel": "",             // pourquoi CE perso, pourquoi MAINTENANT, ce qu'il risque de perdre ou gagner
  "information_privilegiee": "",     // ce que le perso sait et que les autres ignorent — valorise sa classe / son historique
  "antagoniste": {
    "nom": "", "motivation": "", "secret": "",
    "tension_locale": ""             // pression concrète et palpable DÈS la première scène, même si le grand objectif reste lointain
  },
  "accroche_ouverture": "",          // le crochet de départ, dérivé de tout ce qui précède, qui met le perso EN MOUVEMENT
  "lieux_cles": [ { "nom": "", "description": "", "role": "" } ],
  "pnj_cles":   [ { "nom": "", "role": "", "motivation": "", "secret": "" } ],
  "factions":   [ { "nom": "", "agenda": "" } ],
  "jalons":     [ { "titre": "", "declencheur": "", "description": "" } ],
  "graines":    [ "" ],              // foreshadowing / fusils de Tchekhov à ressortir plus tard
  "ton": "",
  "themes": [ "" ]
}

Exigences NON négociables :
1. enjeu_personnel : clair, immédiat, ANCRÉ dans l'historique du personnage fourni — prolonge-le, ne l'invente pas à côté.
2. antagoniste : concret, avec une motivation ET un secret, plus une tension_locale qui met la pression dès la scène 1.
3. information_privilegiee : un savoir que le perso détient seul, qui met en valeur sa classe et/ou son background.
4. accroche_ouverture : découle des points 1 à 3, oriente vers l'action sans tout dévoiler.
5. jalons : des paliers de progression NARRATIVE (milestones), jamais des récompenses d'XP. Adapte leur nombre à l'envergure (cible : ${opts.nb_jalons_cible} jalons).
6. objectif_long_terme : reste en toile de fond ; il ne doit PAS être évident dès l'ouverture.

Cohérence : respecte espèce, classe, historique, alignement et TOUS les champs d'histoire déjà générés fournis.
Priorise les options (ton, type d'aventure, envergure, région, centralité de l'historique, létalité).
Si la région vaut null ou « surprends-moi », choisis toi-même un point de départ crédible des Royaumes Oubliés.
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
    body: { messages, system, max_tokens: 3000 },
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

// Extraction JSON robuste : retire les backticks, isole du premier { au dernier }.
function extraireJSON(texte = '') {
  const nettoye = texte.replace(/```json|```/g, '').trim()
  const debut = nettoye.indexOf('{')
  const fin = nettoye.lastIndexOf('}')
  if (debut === -1 || fin === -1) throw new Error('Réponse de l’IA illisible (JSON de l’arc introuvable).')
  return JSON.parse(nettoye.slice(debut, fin + 1))
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