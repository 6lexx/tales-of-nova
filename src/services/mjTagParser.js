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
//   [QUETE:creer|type|titre|description]  (type: immediate|principale|secondaire)
//   [QUETE:indice|titre|texte]
//   [QUETE:accomplir|titre]
//   [QUETE:echouer|titre]
//   [OBJET:nom|quantite|description]  (quantite/description optionnels)
//   [OR:po|pa|pc]  (deltas signés, pa/pc optionnels ; ex. [OR:50] ou [OR:-10|5])
//   (QUETE = grammaire positionnelle, séparateur "|", identification par titre)

const TAG_RE = /\[(CONDITION|REPOS|PALIER|CODEX|RECAP|QUETE|OBJET|OR|PV)(?::([^\]]*))?\]/gi

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
  const { statusService, progressionService, codexService, questService, inventaireService } = services

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
        await statusService.applyRest(characterId, a.type)
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
      }
    } catch (err) {
      console.error('applyMjActions —', a.kind, err)
    }
  }
}