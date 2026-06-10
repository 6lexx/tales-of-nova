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

const TAG_RE = /\[(CONDITION|REPOS|PALIER|CODEX|RECAP)(?::([^\]]*))?\]/g

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
    }
    return '' // retire le tag du texte affiché
  })

  return { texte: cleaned.replace(/\n{3,}/g, '\n\n').trim(), actions }
}

// Exécute les actions extraites. Branche-le dans le composant Game,
// après réception de la réponse MJ.
export async function applyMjActions(actions, ctx, services) {
  const { characterId, campaignId, sessionId, invokeClaude } = ctx
  const { statusService, progressionService, codexService } = services

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
      }
    } catch (err) {
      console.error('applyMjActions —', a.kind, err)
    }
  }
}
