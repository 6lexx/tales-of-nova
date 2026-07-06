// Service IA — couche unique entre le front et l'appel à Claude.
// L'appel réseau passe par l'edge function "mj" (clé Anthropic protégée côté serveur).

import { supabase } from '../lib/supabase'
import { parseMjTags } from './mjTagParser'
import { etatMecanique, modCarac, signe } from "./guerrierService.js";

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
- Dialogues : encadre TOUTE parole de PNJ par des guillemets « … » et reviens a la ligne pour les mettre en valeur.
- Utilise des police d'écriture différente selon les PNJ, les situations. Cela a pour but de donner de l'impact 
  et de la vie au texte
- Pour un PNJ marquant, précise une voix autour du dialogue : [voix=noble]« … »[/voix].
  Voix disponibles : commun (défaut, inutile de le marquer), noble (rois, nobles, commandants),
  divin (dieux, célestes, voix sacrées), sombre (démons, morts-vivants, fiélons).
- Couleurs sémantiques : [danger]…[/danger] (menace, arme, péril), [sacré]…[/sacré] (divin, serment, relique),
  [arcane]…[/arcane] (magie, sortilège), [lieu]…[/lieu] (nom de lieu), [murmure]…[/murmure] (chuchotement),
  [cri]…[/cri] (hurlement, ordre), [ancien]…[/ancien] (inscription, prophétie, langue oubliée).
- Emphase : **gras** pour un mot fort, *italique* pour une nuance.

[JOURNAL DE QUÊTES — tag [QUETE]]
Consigne au journal UNIQUEMENT les objectifs réellement poursuivis, avec un enjeu clair.
Une simple piste évoquée n'est PAS une quête. Parcimonie : mieux vaut une quête juste que trois superflues.
- [QUETE:creer|type|titre|description] — ouvre une quête. type ∈ immediate | principale | secondaire.
  Le titre est l'identifiant : garde-le court et stable.
- [QUETE:indice|titre|texte] — ajoute un indice à une quête existante (par titre).
- [QUETE:accomplir|titre] — clôt une quête réussie.
- [QUETE:echouer|titre] — clôt une quête échouée.
Réfère-toi aux quêtes de [QUÊTES ACTIVES] et n'en duplique aucune.
Émets ces tags en fin de réponse ; ils sont retirés du texte affiché.`

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
  const p = personnage;
  const estGuerrier = (p.classe ?? "").toLowerCase().includes("guerrier");
  const cap = (n) => n.charAt(0).toUpperCase() + n.slice(1);
  const carac = (v) => (v == null ? "—" : `${v} (${signe(modCarac(v))})`);

  let bloc = `[PERSONNAGE DU JOUEUR]
Nom : ${p.nom ?? "—"}
Espèce : ${p.espece ?? "—"} | Classe : ${p.classe ?? "—"} ${p.sous_classe ?? ""} niv.${p.niveau ?? 1}
Caractéristiques : FOR ${carac(p.force)}, DEX ${carac(p.dexterite)}, CON ${carac(p.constitution)}, INT ${carac(p.intelligence)}, SAG ${carac(p.sagesse)}, CHA ${carac(p.charisme)}
PV : ${p.pv_actuels ?? "?"}/${p.pv_max ?? "?"}`;

  if (estGuerrier) {
    const e = etatMecanique(p);
    const sauv = Object.entries(e.sauvegardes).filter(([, s]) => s.maitrise)
      .map(([c, s]) => `${c.slice(0, 3).toUpperCase()} ${signe(s.bonus)}`).join(", ");
    const comps = Object.entries(e.competences).filter(([, c]) => c.maitrise)
      .map(([n, c]) => `${cap(n)} ${signe(c.bonus)}`).join(", ");
    const styles = e.styles.map((s) => s.nom).join(", ") || "—";
    const attaques = e.attaques.map((a) =>
      `  - ${a.nom} : ${signe(a.bonusAttaque)} pour toucher, ${a.degats}${a.notes.length ? ` (${a.notes.join(" ; ")})` : ""}`).join("\n");
    const caps = e.capacites.map((c) =>
      c.ressource ? `${c.nom} (${c.ressource.actuel}/${c.ressource.max})` : c.nom).join(", ");

    bloc += `
CA ${e.ca.valeur} | Init ${signe(e.initiative)} | Maîtrise ${signe(e.bonusMaitrise)}
Sauvegardes maîtrisées : ${sauv || "—"}
Compétences maîtrisées : ${comps || "—"}
Style(s) de combat : ${styles}
Attaques (${e.nombreAttaques} par action Attaquer, critique sur ${e.attaques[0]?.critique ?? "20"}) :
${attaques}
Capacités : ${caps}`;
  }

  bloc += `
Historique : ${p.historique ?? "—"}`;
  return bloc;
}

// --- Bloc (3) : contexte de la session ---
export function buildBlocSession(session = {}) {
  const s = session
  return `[CONTEXTE DE SESSION]
Lieu : ${s.lieu_actuel ?? '—'}
Situation : ${s.resume ?? "Début de l'aventure."}`
}

// Bloc dynamique : quêtes actives déjà consignées au journal.
// Injecté dans le contexte de session à chaque tour → le MJ voit ce qui existe,
// ne duplique pas, et référence une quête par son titre exact.
export function buildBlocQuetes(quetesActives = []) {
  if (!quetesActives.length) {
    return `## Quêtes actives
Aucune quête active pour l'instant.`
  }
  const lignes = quetesActives
    .map((q) => `- « ${q.titre} » (${q.type})`)
    .join('\n')
  return `## Quêtes actives (déjà au journal — ne pas recréer)
${lignes}

Pour faire avancer l'une d'elles, référence-la par son titre EXACT :
[QUETE:indice|titre|texte], [QUETE:accomplir|titre] ou [QUETE:echouer|titre].`
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
export function buildSystemPrompt(personnage = {}, session = {}, quetesActives = []) {
  return [
    buildBlocRole(),
    buildBlocJets(),
    buildBlocPerso(personnage),
    buildBlocSession(session),
    buildBlocQuetes(quetesActives),
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