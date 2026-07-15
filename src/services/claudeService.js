// Service IA — couche unique entre le front et l'appel à Claude.
// L'appel réseau passe par l'edge function "mj" (clé Anthropic protégée côté serveur).

import { supabase } from '../lib/supabase'
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
Puis ARRÊTE ta réponse : n'enchaîne PAS la conséquence dans le même message, attends le résultat du système.
Tu recevras le résultat UNIQUEMENT par ce canal, sous la forme [RESULTAT_JET: brut:<n> | total:<n>] :
- N'écris JAMAIS [RESULTAT_JET] toi-même et n'invente JAMAIS de valeur de dé (brut/total). Les jets viennent exclusivement du joueur.
- brut 1 = échec critique, brut 20 = réussite critique (quel que soit le total).
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
export function buildBlocInventaire(inventaire = [], bourse = {}) {
  const b = bourse || {}
  const pieces = `${b.po ?? 0} po, ${b.pa ?? 0} pa, ${b.pc ?? 0} pc`
  if (!inventaire.length) return `[INVENTAIRE]\nBourse : ${pieces}\nSac vide.`
  const fmt = (i) => `- ${i.nom}${i.quantite > 1 ? ` ×${i.quantite}` : ''}${i.equipe ? ` (équipé${i.emplacement ? ` : ${i.emplacement}` : ''})` : ''}`
  const eq = inventaire.filter((i) => i.equipe)
  const sac = inventaire.filter((i) => !i.equipe)
  const lignes = []
  if (eq.length) { lignes.push('Équipé :'); eq.forEach((i) => lignes.push(fmt(i))) }
  lignes.push('Sac :')
  ;(sac.length ? sac : [{ nom: '(rien)' }]).forEach((i) => lignes.push(fmt(i)))
  return `[INVENTAIRE]\nBourse : ${pieces}\n${lignes.join('\n')}\n\nLe personnage possède réellement ces objets : autorise leur usage. S'il tente d'utiliser un objet absent de cette liste, signale-le au lieu de l'autoriser. Quand un objet est consommé, lancé, donné ou perdu, émets [OBJET:retirer|nom|quantite]. Pour un gain de butin, émets [OBJET:ajouter|nom|quantite|description] et pour des pièces [OR:po|pa|pc].`
}

// --- Bloc combat : etat courant + consigne de declenchement ---
// Lit game_sessions.etat.combat (charge par Game.jsx). Le MJ y voit les noms EXACTS
// des ennemis : trouverCible() matche par nom, un ecart et le tag part dans le vide.
// Les PV des ennemis lui sont donnes (il les a fixes lui-meme) ; c'est l'interface,
// pas le prompt, qui les masque au joueur.
export function buildBlocCombat(combat = {}) {
  const DECLENCHEMENT = `Dès qu'un affrontement s'engage — un PNJ attaque, une créature charge, une embuscade se referme,
le joueur dégaine le premier —, tu émets [COMBAT:debut] puis un [COMBAT:ennemi|nom|pv|ca] par adversaire,
dans le MÊME message que la narration de l'attaque. Pas d'exception : aucune échauffourée narrée à la main.
Donne à chaque ennemi un nom court et STABLE (« Gobelin éclaireur »), que tu réutiliseras à l'identique
dans tous les tags suivants. Deux créatures identiques reçoivent deux noms distincts (« Gobelin A », « Gobelin B »).
N'annonce pas l'initiative du joueur et ne la lance pas : il la lance lui-même dans l'interface.`

  if (!combat?.actif || !combat?.ordre?.length) {
    return `[COMBAT]
Aucun combat en cours.

${DECLENCHEMENT}`
  }

  const ordre = combat.ordre
  const courant = ordre[combat.tour] ?? ordre[0]
  const lignes = ordre.map((c, i) => {
    const fleche = i === combat.tour ? '→' : ' '
    const init = c.init === null ? '(jet en cours)' : c.init
    if (c.type === 'perso') return `${fleche} ${init} — ${c.nom} (JOUEUR, CA ${c.ca})`
    const etat = c.statut === 'mort' ? 'hors de combat' : `${c.pv}/${c.pvMax} PV`
    return `${fleche} ${init} — ${c.nom} (CA ${c.ca}) — ${etat}`
  }).join('\n')
  const noms = ordre.filter((c) => c.type === 'ennemi').map((c) => `« ${c.nom} »`).join(', ')

  return `[COMBAT — EN COURS]
Round ${combat.round}. C'est au tour de : ${courant?.nom ?? '—'}.
Ordre d'initiative (→ = combattant courant) :
${lignes}

N'émets PAS [COMBAT:debut] : le combat est déjà lancé, tu écraserais l'initiative.
Noms EXACTS à réutiliser dans les tags : ${noms || '—'}.
- [COMBAT:degats|nom|FORMULE] dès qu'un ennemi encaisse (ex. [COMBAT:degats|${ordre.find((c) => c.type === 'ennemi')?.nom ?? 'Gobelin'}|1d8+3]).
- [COMBAT:tour] chaque fois que le combattant courant a fini d'agir — c'est toi qui fais avancer l'ordre.
- [COMBAT:retirer|nom] dès qu'un ennemi meurt ou fuit ; [COMBAT:fin] quand il n'en reste aucun.
Les PV ci-dessus sont pour TOI : ne les cite jamais. Décris l'état (il chancelle, il saigne, il tient encore).`
}

export function buildBlocTags() {
  return `[TAGS MÉCANIQUES]
À la fin de ta réponse, quand la fiction le justifie, émets les tags suivants (retirés du texte affiché) pour synchroniser l'état du jeu. N'ANNONCE PAS de changement chiffré (PV, or, objet) sans émettre le tag correspondant.
- [PV:-3] ou [PV:9] : perte ou gain de points de vie (delta signé). OBLIGATOIRE dès qu'un PV change. Ne donne PAS le total « X/Y » dans le texte — l'interface l'affiche ; décris la blessure ou le soulagement, pas les chiffres.
- [OBJET:retirer|nom|quantite] : OBLIGATOIRE dès qu'un objet quitte le sac — consommé, lancé, jeté, brisé, donné, vendu ou perdu. Utilise le nom EXACT tel qu'affiché dans [INVENTAIRE].
- [OBJET:ajouter|nom|quantite|description] : butin gagné.
- [OR:po|pa|pc] : gain/perte de pièces (deltas signés, ex. [OR:50] ou [OR:-10]).
- [SORT:niveau] : le personnage lance un sort → consomme un emplacement de ce niveau (ex. [SORT:1]). Pour un occultiste, n'importe quel niveau consomme un emplacement de pacte.
- [RESSOURCE:cle|n] : dépense une ressource de classe (ex. [RESSOURCE:ki|2], [RESSOURCE:rage|1], [RESSOURCE:second_souffle|1]).
- [CONDITION:add|cle] / [CONDITION:remove|cle] : état (empoisonné, à terre, etc.).
- [REPOS:court] / [REPOS:long] : récupération.
- [QUETE:creer|type|titre|description], [QUETE:indice|titre|texte], [QUETE:accomplir|titre], [QUETE:echouer|titre].
- [PALIER: niveau:X | raison:"..."] : montée de niveau, aux moments clés cohérents avec l'histoire.
- [COMBAT:debut] puis [COMBAT:ennemi|nom|pv|ca|init] pour chaque adversaire : démarre un combat suivi. L'initiative du joueur est lancée par LUI dans l'interface — ne la lance pas, ne l'invente pas, ne la commente pas. En combat : [COMBAT:degats|nom|FORMULE] quand un ennemi subit des dégâts — donne la FORMULE (ex. [COMBAT:degats|Gobelin|1d6+3]), c'est le système qui lance les dés et applique le résultat. Sur un critique, écris la formule déjà doublée (2d6+3). N'annonce JAMAIS un chiffre de dégâts toi-même et ne décris pas les PV restants de l'ennemi : décris son état (il chancelle, il saigne, il tient encore). Aussi : [COMBAT:soin|nom|n], [COMBAT:tour] pour passer au combattant suivant, [COMBAT:retirer|nom] si un ennemi fuit/meurt, [COMBAT:fin] à la fin. Les dégâts subis PAR le joueur passent par [PV:-n] (pas [COMBAT]). Une attaque se résout via [JET] (DD = CA de la cible).
- [CODEX:...], [RECAP] : enrichissement et récapitulatif.`
}

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
export function buildSystemPrompt(personnage = {}, session = {}, quetesActives = [], inventaire = [], bourse = {}, combat = {}) {
  return [
    buildBlocRole(),
    buildBlocJets(),
    buildBlocPerso(personnage),
    buildBlocSession(session),
    buildBlocQuetes(quetesActives),
    buildBlocInventaire(inventaire, bourse),
    buildBlocCombat(combat),
    buildBlocTags(),
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
// Les tags mecaniques ([COMBAT], [QUETE], [OBJET], [PV]...) sont emis EN FIN de reponse :
// une generation coupee par max_tokens les perd tous. L'edge function plafonne a 1024 par
// defaut — trop court pour 3-5 paragraphes en francais. On impose donc la valeur ici.
const MAX_TOKENS = 2048

export async function sendMessage(messages, systemPrompt, options = {}) {
  const { data, error } = await supabase.functions.invoke('mj', {
    body: { messages, system: systemPrompt, max_tokens: options.max_tokens ?? MAX_TOKENS },
  })
  if (error) {
    let detail = error.message
    try { detail = JSON.stringify(await error.context.json()) } catch {}
    throw new Error(detail)
  }
  if (data?.error) throw new Error(JSON.stringify(data.error))
  // Filet de securite : si ca tronque encore, on le voit au lieu de le subir en silence.
  if (data?.raw?.stop_reason === 'max_tokens') {
    console.warn('[mj] Reponse TRONQUEE (stop_reason: max_tokens) — les tags de fin de reponse sont perdus.', data.raw.usage)
  }
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

// N'extrait QUE le [JET]. Les tags mécaniques ([COMBAT], [QUETE], [OBJET], [PV]...)
// sont volontairement LAISSÉS dans le texte : c'est Game.traiterTagsMj() qui les parse,
// les exécute, puis les retire de l'affichage.
// /!\ Ne jamais rappeler parseMjTags() ici : le texte renvoyé arriverait à traiterTagsMj
// déjà vidé de ses tags, et plus aucune action ne s'exécuterait (les tags seraient
// silencieusement perdus entre les deux passes).
export function parseResponse(rawText = '') {
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

  return {
    texte: texte.replace(/\n{3,}/g, '\n\n').trim(),
    jet,
  }
}