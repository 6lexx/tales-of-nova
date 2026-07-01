// Service IA — couche unique entre le front et l'appel à Claude.
// L'appel réseau passe par l'edge function "mj" (clé Anthropic protégée côté serveur).

import { supabase } from '../lib/supabase'
import { parseMjTags } from './mjTagParser'

/* ════════════════════════════════════════════════════════════
   BLOCS DYNAMIQUES DU SYSTEM PROMPT
   Chaque bloc est une fonction réutilisable. La narration les
   assemble tous ; le mode admin réutilise (2) et (3), remplace (1),
   et retire (4).
   ════════════════════════════════════════════════════════════ */

// --- Bloc (1) : rôle / ton + mise en forme ---
export function buildBlocRole() {
  return `[RÔLE]
Tu es le Maître du Donjon d'une partie de D&D 5e en français.
Tu narres à la 2e personne, de façon immersive ; le ton s'adapte aux enjeux de la scène.
Tu décris le monde et les PNJ ; tu ne décides JAMAIS des actions du joueur à sa place.
Ne propose JAMAIS de pistes d'action ni de choix : termine ta narration sur la situation présente
et attends librement la décision du joueur.
Longueur : 3 à 5 paragraphes maximum.

MISE EN FORME (avec parcimonie, pour l'impact — une touche ici et là, jamais à chaque phrase) :
- Dialogues : encadre TOUTE parole de PNJ par des guillemets « … ».
- Pour un PNJ marquant, précise une voix autour du dialogue : [voix=noble]« … »[/voix].
  Voix disponibles : commun (défaut, inutile de le marquer), noble (rois, nobles, commandants),
  divin (dieux, célestes, voix sacrées), sombre (démons, morts-vivants, fiélons).
- Couleurs sémantiques : [danger]…[/danger] (menace, arme, péril), [sacré]…[/sacré] (divin, serment, relique),
  [arcane]…[/arcane] (magie, sortilège), [lieu]…[/lieu] (nom de lieu), [murmure]…[/murmure] (chuchotement),
  [cri]…[/cri] (hurlement, ordre), [ancien]…[/ancien] (inscription, prophétie, langue oubliée).
- Emphase : **gras** pour un mot fort, *italique* pour une nuance.`
}

// --- Bloc (4) : logique des jets de dé ---
export function buildBlocJets() {
  return `[LOGIQUE DES JETS]
Quand une action exige un jet de dé, émets un tag SUR SA PROPRE LIGNE au format :
[JET: <caractéristique> (<compétence si pertinent>) DD <valeur si tu la révèles>]
Tu recevras ensuite le résultat sous la forme [RESULTAT_JET: brut:<n> | total:<n>] :
- brut 1 = échec critique, brut 20 = réussite critique (quel que soit le total)
- sinon, compare le total au DD et raconte la conséquence selon la marge.`
}

// --- Bloc (2) : données du personnage joueur ---
export function buildBlocPerso(personnage = {}) {
  const p = personnage
  return `[PERSONNAGE DU JOUEUR]
Nom : ${p.nom ?? '—'}
Espèce : ${p.espece ?? '—'} | Classe : ${p.classe ?? '—'} ${p.sous_classe ?? ''} niv.${p.niveau ?? 1}
Caractéristiques : FOR ${p.force ?? '—'}, DEX ${p.dexterite ?? '—'}, CON ${p.constitution ?? '—'}, INT ${p.intelligence ?? '—'}, SAG ${p.sagesse ?? '—'}, CHA ${p.charisme ?? '—'}
PV : ${p.pv_actuels ?? '?'}/${p.pv_max ?? '?'}
Historique : ${p.historique ?? '—'}`
}

// --- Bloc (3) : contexte de la session ---
export function buildBlocSession(session = {}) {
  const s = session
  return `[CONTEXTE DE SESSION]
Lieu : ${s.lieu_actuel ?? '—'}
Situation : ${s.resume ?? "Début de l'aventure."}`
}

// --- Bloc (1 bis) : rôle admin (remplace le rôle + retire les jets) ---
export function buildBlocRoleAdmin() {
  return `[MODE ADMIN — INSPECTION]
Tu sors de ton rôle de narrateur. Tu es en mode introspection game-design, destiné au
concepteur de la partie (et à lui seul). Tu N'AVANCES PAS l'histoire et tu ne narres pas la scène.

Tu exposes franchement, à la 1re personne (« voici ce que j'avais prévu… »), ce que tu avais
en tête en tant que MJ pour la situation courante :
- les scénarios et embranchements envisagés, les amorces (hooks) en place ;
- les intentions cachées des PNJ présents, leurs objectifs et leurs secrets ;
- le DD que tu appliquerais à une action donnée, et le raisonnement derrière ;
- comment tu interprètes les consignes et le contexte fournis (personnage, session) ;
- ce qui te semble manquer, ambigu ou contradictoire dans le paramétrage.

Reste analytique et concis.

LECTURE SEULE — tu n'émets AUCUNE balise, ni mécanique ni de style : pas de [JET] ni
[RESULTAT_JET], pas de CONDITION / REPOS / PALIER / CODEX / RECAP, pas de [danger] / [voix=…] /
« … ». Texte brut uniquement. Aucune de tes réponses ici ne doit modifier l'état du jeu.`
}

/* ════════════════════════════════════════════════════════════
   ASSEMBLAGE DES PROMPTS
   ════════════════════════════════════════════════════════════ */

// --- System prompt de narration (4 blocs) ---
export function buildSystemPrompt(personnage = {}, session = {}) {
  return [
    buildBlocRole(),
    buildBlocJets(),
    buildBlocPerso(personnage),
    buildBlocSession(session),
  ].join('\n\n')
}

// --- System prompt admin : réutilise perso (2) + session (3), remplace le rôle, retire les jets ---
export function buildAdminPrompt(personnage = {}, session = {}) {
  return [
    buildBlocRoleAdmin(),
    buildBlocPerso(personnage),
    buildBlocSession(session),
  ].join('\n\n')
}

/* ════════════════════════════════════════════════════════════
   ENVOI À L'EDGE FUNCTION
   ════════════════════════════════════════════════════════════ */

// --- Méthode centrale : envoie à la fonction relais, renvoie le texte de Claude ---
export async function sendMessage(messages, systemPrompt) {
  const { data, error } = await supabase.functions.invoke('mj', {
    body: { messages, system: systemPrompt },
  })
  if (error) {
    let detail = error.message
    try { detail = JSON.stringify(await error.context.json()) } catch {}
    throw new Error(detail)
  }
  if (data?.error) throw new Error(JSON.stringify(data.error))
  return data.texte
}

// --- Envoi en mode admin : même relais, texte brut renvoyé tel quel.
//     NE PAS passer par parseResponse / parseMjTags → aucune mutation d'état possible. ---
export async function sendAdminMessage(messages, systemPrompt) {
  return sendMessage(messages, systemPrompt)
}

/* ════════════════════════════════════════════════════════════
   ANALYSE DE LA RÉPONSE (narration uniquement)
   ════════════════════════════════════════════════════════════ */

// Extrait le tag [JET: ...] et le masque du texte affiché
const JET_RE = /\[JET:\s*([^\]]+)\]/i

export function parseResponse(rawText = '') {
  // 1. Extraction du JET (logique existante, inchangée)
  const match = rawText.match(JET_RE)
  let texte = rawText
  let jet = null

  if (match) {
    const contenu = match[1].trim()
    const ddMatch = contenu.match(/DD\s*(\d+)/i)
    const dd = ddMatch ? parseInt(ddMatch[1], 10) : null
    const label = contenu.replace(/DD\s*\d+/i, '').trim()
    jet = { label, dd }
    texte = rawText.replace(JET_RE, '')
  }

  // 2. Extraction des tags mécaniques sur le texte déjà débarrassé du JET
  const { texte: texteNettoye, actions } = parseMjTags(texte)

  return {
    texte: texteNettoye.replace(/\n{3,}/g, '\n\n').trim(),
    jet,
    actions, // [] si aucun
  }
}