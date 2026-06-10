// Service IA — couche unique entre le front et l'appel à Claude.
// L'appel réseau passe par l'edge function "mj" (clé Anthropic protégée côté serveur).

import { supabase } from '../lib/supabase'

// --- 1. Construit le system prompt (4 blocs : rôle, personnage, contexte, règles) ---
export function buildSystemPrompt(personnage = {}, session = {}) {
  const p = personnage
  const s = session

  const role = `[RÔLE]
Tu es le Maître du Donjon d'une partie de D&D 5e en français.
Tu narres à la 2e personne, de façon immersive ; le ton s'adapte aux enjeux de la scène.
Tu décris le monde et les PNJ ; tu ne décides JAMAIS des actions du joueur à sa place.
Ne propose JAMAIS de pistes d'action ni de choix : termine ta narration sur la situation présente 
et attends librement la décision du joueur.
Quand une action exige un jet de dé, émets un tag SUR SA PROPRE LIGNE au format :
[JET: <caractéristique> (<compétence si pertinent>) DD <valeur si tu la révèles>]
Tu recevras ensuite le résultat sous la forme [RESULTAT_JET: brut:<n> | total:<n>] :
- brut 1 = échec critique, brut 20 = réussite critique (quel que soit le total)
- sinon, compare le total au DD et raconte la conséquence selon la marge.
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

  const perso = `[PERSONNAGE DU JOUEUR]
Nom : ${p.nom ?? '—'}
Espèce : ${p.espece ?? '—'} | Classe : ${p.classe ?? '—'} ${p.sous_classe ?? ''} niv.${p.niveau ?? 1}
Caractéristiques : FOR ${p.force ?? '—'}, DEX ${p.dexterite ?? '—'}, CON ${p.constitution ?? '—'}, INT ${p.intelligence ?? '—'}, SAG ${p.sagesse ?? '—'}, CHA ${p.charisme ?? '—'}
PV : ${p.pv_actuels ?? '?'}/${p.pv_max ?? '?'}
Historique : ${p.historique ?? '—'}`

  const contexte = `[CONTEXTE DE SESSION]
Lieu : ${s.lieu_actuel ?? '—'}
Situation : ${s.resume ?? "Début de l'aventure."}`

  return [role, perso, contexte].join('\n\n')
}

// --- 2. Méthode centrale : envoie à la fonction relais, renvoie le texte de Claude ---
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

// --- 3. Analyse la réponse : extrait le tag [JET: ...] et le masque du texte affiché ---
const JET_RE = /\[JET:\s*([^\]]+)\]/i

import { parseMjTags } from './mjTagParser'

// JET_RE reste tel que tu l'as défini plus haut dans le fichier.

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

  // 2. Extraction des nouveaux tags mécaniques sur le texte déjà débarrassé du JET
  const { texte: texteNettoye, actions } = parseMjTags(texte)

  return {
    texte: texteNettoye.replace(/\n{3,}/g, '\n\n').trim(),
    jet,
    actions, // [] si aucun
  }
}
