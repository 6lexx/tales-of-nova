// Extension du système de tags du MJ.
// S'aligne sur les tags existants [JET: ...] et [RESULTAT_JET: brut|total].
// À appeler depuis claudeService.parseResponse() : on extrait les effets
// mécaniques, on renvoie le texte nettoyé + une liste d'actions à exécuter
// côté front (via statusService / progressionService / codexService).
//
// Nouveaux tags reconnus :
//   [CONDITION: ajoute|retire | cle:empoisonne | source:"..." | duree:"3 rounds"]
//   [REPOS: court|long]
//   [PALIER: niveau:4 | raison:"Fin de l'acte I"]
//   [CODEX: cat:pnj | cle:"padhrane" | titre:"Padhrane" | resume:"..." | detail:1]
//   [RECAP] (signale au front de déclencher generateRecap à la clôture)
//   [FIN:mort|raison] / [FIN:reussie|raison]  (clôt la campagne — campaigns.statut)
//   [COMBAT:fin|victoire|victoire_majeure|fuite|defaite]  (l'issue pilote l'écran de fin)
//   [QUETE:creer|type|titre|description]  (type: immediate|principale|secondaire)
//   [QUETE:indice|titre|texte]
//   [QUETE:accomplir|titre]
//   [QUETE:echouer|titre]
//   [OBJET:nom|quantite|description]  (quantite/description optionnels)
//   [OR:po|pa|pc]  (deltas signés, pa/pc optionnels ; ex. [OR:50] ou [OR:-10|5])
//   (QUETE = grammaire positionnelle, séparateur "|", identification par titre)

import { estFormule } from './diceService'

const TAG_RE = /\[(CONDITION|REPOS|PALIER|CODEX|RECAP|QUETE|OBJET|OR|PV|SORT|RESSOURCE|COMBAT|FIN)(?::([^\]]*))?\]/gi

// "cle:empoisonne | source:\"piège\" | duree:3 rounds" -> {cle, source, duree}
function parseFields(raw) {
  const out = {}
  if (!raw) return out
  for (const part of raw.split('|')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim().replace(/^"|"$/g, '')
    out[key] = val
  }
  return out
}

export function parseMjTags(text) {
  const actions = []
  const cleaned = text.replace(TAG_RE, (_, type, body) => {
    type = (type || '').toUpperCase()
    const f = parseFields(body)
    switch (type) {
      case 'CONDITION':
        actions.push({
          kind: 'condition',
          op: f.ajoute !== undefined ? 'add' : f.retire !== undefined ? 'remove'
              : (f.op || 'add'),
          conditionKey: f.cle || f.ajoute || f.retire,
          source: f.source ?? null,
          duree: f.duree ?? null,
        })
        break
      case 'REPOS':
        actions.push({ kind: 'rest', type: (body || 'long').trim() })
        break
      case 'PALIER':
        actions.push({
          kind: 'milestone',
          toLevel: Number(f.niveau),
          raison: f.raison ?? null,
        })
        break
      case 'CODEX':
        actions.push({
          kind: 'codex',
          categorie: f.cat,
          cle: f.cle,
          titre: f.titre,
          resume: f.resume ?? null,
          detail: Number(f.detail || 1),
        })
        break
      case 'RECAP':
        actions.push({ kind: 'recap' })
        break
      case 'QUETE': {
        // Grammaire positionnelle : verbe|arg1|arg2… (séparateur "|")
        const seg = (body || '').split('|').map((s) => s.trim().replace(/^"|"$/g, ''))
        const verbe = (seg[0] || '').toLowerCase()
        if (verbe === 'creer' && seg[2]) {
          actions.push({ kind: 'quest', op: 'creer', type: seg[1] || 'secondaire', titre: seg[2], description: seg[3] || '' })
        } else if (verbe === 'indice' && seg[1] && seg[2]) {
          actions.push({ kind: 'quest', op: 'indice', titre: seg[1], texte: seg[2] })
        } else if (verbe === 'accomplir' && seg[1]) {
          actions.push({ kind: 'quest', op: 'accomplir', titre: seg[1] })
        } else if (verbe === 'echouer' && seg[1]) {
          actions.push({ kind: 'quest', op: 'echouer', titre: seg[1] })
        }
        break
      }
      case 'OBJET': {
        const seg = (body || '').split('|').map((s) => s.trim().replace(/^"|"$/g, ''))
        const verbe = (seg[0] || '').toLowerCase()
        if (verbe === 'retirer' && seg[1]) {
          actions.push({ kind: 'objet', op: 'retirer', nom: seg[1], quantite: parseInt(seg[2], 10) || 1 })
        } else {
          const d = verbe === 'ajouter' ? 1 : 0
          if (seg[d]) actions.push({ kind: 'objet', op: 'ajouter', nom: seg[d], quantite: parseInt(seg[d + 1], 10) || 1, description: seg[d + 2] || null })
        }
        break
      }
      case 'OR': {
        const seg = (body || '').split('|').map((s) => parseInt(s.trim(), 10) || 0)
        if (seg.some((n) => n !== 0)) actions.push({ kind: 'or', po: seg[0] || 0, pa: seg[1] || 0, pc: seg[2] || 0 })
        break
      }
      case 'SORT': {
        const niv = parseInt((body || '').trim(), 10)
        if (!Number.isNaN(niv) && niv >= 1) actions.push({ kind: 'sort', niveau: niv })
        break
      }
      case 'RESSOURCE': {
        const seg = (body || '').split('|').map((s) => s.trim())
        if (seg[0]) actions.push({ kind: 'ressource', cle: seg[0], montant: parseInt(seg[1], 10) || 1 })
        break
      }
      case 'COMBAT': {
        const seg = (body || '').split('|').map((s) => s.trim().replace(/^"|"$/g, ''))
        const op = (seg[0] || '').toLowerCase()
        if (op === 'debut') actions.push({ kind: 'combat', op: 'debut' })
        else if (op === 'ennemi' && seg[1]) actions.push({ kind: 'combat', op: 'ennemi', nom: seg[1], pv: parseInt(seg[2], 10) || 1, ca: parseInt(seg[3], 10) || 10, init: seg[4] ? parseInt(seg[4], 10) : undefined })
        else if (op === 'degats' && seg[1]) {
          // Le MJ donne une FORMULE (1d6+3) ou un entier. parseInt("1d6+3") vaut 1 :
          // on teste donc la formule AVANT. Le lancer est fait par Game.traiterTagsMj.
          const brut = (seg[2] || '').trim()
          actions.push({ kind: 'combat', op: 'degats', cible: seg[1],
            formule: estFormule(brut) ? brut : null,
            n: estFormule(brut) ? 0 : (parseInt(brut, 10) || 0) })
        }
        else if (op === 'soin' && seg[1]) actions.push({ kind: 'combat', op: 'soin', cible: seg[1], n: parseInt(seg[2], 10) || 0 })
        else if (op === 'tour') actions.push({ kind: 'combat', op: 'tour' })
        else if (op === 'mort' && seg[1]) actions.push({ kind: 'combat', op: 'mort', nom: seg[1] })
        else if (op === 'retirer' && seg[1]) actions.push({ kind: 'combat', op: 'retirer', nom: seg[1] })
        // L'issue est optionnelle : [COMBAT:fin] nu = clôture silencieuse, aucun écran.
        else if (op === 'fin') actions.push({ kind: 'combat', op: 'fin', issue: (seg[1] || '').toLowerCase() || null })
        break
      }
      case 'FIN': {
        // Fin de campagne. Le personnage n'est PAS touché : il reste réutilisable.
        const seg = (body || '').split('|').map((s) => s.trim().replace(/^"|"$/g, ''))
        const issue = (seg[0] || '').toLowerCase()
        if (issue === 'mort' || issue === 'reussie') {
          actions.push({ kind: 'fin', issue, raison: seg[1] || null })
        }
        break
      }
      case 'PV': {
        const n = parseInt((body || '').trim(), 10)
        if (!Number.isNaN(n) && n !== 0) actions.push({ kind: 'pv', delta: n })
        break
      }
    }
    return '' // retire le tag du texte affiché
  })

  return { texte: cleaned.replace(/\n{3,}/g, '\n\n').trim(), actions }
}

// Exécute les actions extraites. Branche-le dans le composant Game,
// après réception de la réponse MJ.
export async function applyMjActions(actions, ctx, services) {
  const { characterId, campaignId, sessionId, invokeClaude } = ctx
  const { statusService, progressionService, codexService, questService, inventaireService, ressourceService, combatService, campaignService } = services

  for (const a of actions) {
    try {
      if (a.kind === 'condition') {
        if (a.op === 'add') {
          await statusService.addCondition(characterId, a.conditionKey, {
            campaignId, source: a.source,
          })
        } else {
          await statusService.removeCondition(characterId, a.conditionKey)
        }
      } else if (a.kind === 'rest') {
        await ressourceService?.repos(characterId, a.type)
      } else if (a.kind === 'sort') {
        await ressourceService?.consommerEmplacement(characterId, a.niveau)
      } else if (a.kind === 'ressource') {
        await ressourceService?.consommerRessource(characterId, a.cle, a.montant)
      } else if (a.kind === 'combat') {
        if (a.op === 'debut') await combatService?.demarrer(sessionId, characterId)
        else if (a.op === 'ennemi') await combatService?.ajouterEnnemi(sessionId, { nom: a.nom, pv: a.pv, ca: a.ca, init: a.init })
        else if (a.op === 'degats') await combatService?.degats(sessionId, a.cible, a.n)
        else if (a.op === 'soin') await combatService?.soin(sessionId, a.cible, a.n)
        else if (a.op === 'tour') await combatService?.tourSuivant(sessionId)
        else if (a.op === 'mort') await combatService?.marquerMort(sessionId, a.nom)
        else if (a.op === 'retirer') await combatService?.retirer(sessionId, a.nom)
        else if (a.op === 'fin') await combatService?.terminer(sessionId)
      } else if (a.kind === 'milestone') {
        await progressionService.proposeMilestone(
          characterId, a.toLevel, a.raison, campaignId
        )
      } else if (a.kind === 'codex') {
        await codexService.unlockEntry({
          campaignId, categorie: a.categorie, cle: a.cle,
          titre: a.titre, resume: a.resume, detail: a.detail,
        })
      } else if (a.kind === 'recap') {
        await progressionService.generateRecap({ campaignId, sessionId, invokeClaude })
      } else if (a.kind === 'quest') {
        // Identification par titre, quêtes scopées à la campagne.
        if (a.op === 'creer') {
          await questService.creerQuete(campaignId, { type: a.type, titre: a.titre, description: a.description })
        } else if (a.op === 'indice') {
          await questService.ajouterIndice(campaignId, a.titre, a.texte)
        } else if (a.op === 'accomplir') {
          await questService.cloreQuete(campaignId, a.titre, 'accomplie')
        } else if (a.op === 'echouer') {
          await questService.cloreQuete(campaignId, a.titre, 'echouee')
        }
      } else if (a.kind === 'objet') {
        if (a.op === 'retirer') await inventaireService?.retirerParNom(characterId, a.nom, a.quantite)
        else await inventaireService?.ajouter(characterId, { categorie: 'commun', nom: a.nom, quantite: a.quantite, description: a.description })
      } else if (a.kind === 'or') {
        await inventaireService?.crediterBourse(characterId, { po: a.po, pa: a.pa, pc: a.pc })
      } else if (a.kind === 'pv') {
        await statusService?.ajusterPV(characterId, a.delta)
      } else if (a.kind === 'fin') {
        await campaignService?.terminerCampagne(campaignId, a.issue, a.raison)
      }
    } catch (err) {
      console.error('applyMjActions —', a.kind, err)
    }
  }
}