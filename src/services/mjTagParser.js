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
//   (QUETE = grammaire positionnelle, séparateur "|", identification par titre)

const TAG_RE = /\[(CONDITION|REPOS|PALIER|CODEX|RECAP|QUETE)(?::([^\]]*))?\]/g

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
    }
    return '' // retire le tag du texte affiché
  })

  return { texte: cleaned.replace(/\n{3,}/g, '\n\n').trim(), actions }
}

// Exécute les actions extraites. Branche-le dans le composant Game,
// après réception de la réponse MJ.
export async function applyMjActions(actions, ctx, services) {
  const { characterId, campaignId, sessionId, invokeClaude } = ctx
  const { statusService, progressionService, codexService, questService } = services

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
      }
    } catch (err) {
      console.error('applyMjActions —', a.kind, err)
    }
  }
}