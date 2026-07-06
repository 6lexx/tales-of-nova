import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react'

// Liste des quêtes dans la colonne de droite (monobloc, compact pour ~220px).
// Clic sur une quête active → onOuvrir(quete) (fenêtre flottante de détail).
// Props : { actives, archivees, onOuvrir }
export default function QuestPanel({ actives = [], archivees = [], onOuvrir }) {
  const [archivesOuvertes, setArchivesOuvertes] = useState(false)

  if (!actives.length && !archivees.length) {
    return <p style={S.vide}>Aucune quête active.</p>
  }

  return (
    <div style={S.wrap}>
      {actives.map((q) => {
        const nbIndices = Array.isArray(q.indices) ? q.indices.length : 0
        return (
          <button key={q.id ?? q.titre} style={S.carte} onClick={() => onOuvrir?.(q)}>
            <div style={{ ...S.badge, ...(TYPE_STYLE[q.type] || {}) }}>{TYPE_LABEL[q.type] || q.type}</div>
            <div style={S.titre}>{q.titre}</div>
            {q.description && <div style={S.desc}>{q.description}</div>}
            {nbIndices > 0 && <div style={S.indices}>{nbIndices} indice{nbIndices > 1 ? 's' : ''}</div>}
          </button>
        )
      })}

      {archivees.length > 0 && (
        <div style={S.archivesBloc}>
          <button style={S.archivesToggle} onClick={() => setArchivesOuvertes((v) => !v)}>
            {archivesOuvertes ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Archivées ({archivees.length})
          </button>
          {archivesOuvertes && archivees.map((q) => {
            const echouee = q.statut === 'echouee'
            return (
              <button key={q.id ?? q.titre} style={S.archiveItem} onClick={() => onOuvrir?.(q)}>
                {echouee
                  ? <X size={12} style={{ color: '#b84040', flexShrink: 0 }} />
                  : <Check size={12} style={{ color: '#3a8a8a', flexShrink: 0 }} />}
                <span style={{ ...S.archiveTitre, textDecoration: echouee ? 'line-through' : 'none' }}>{q.titre}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const TYPE_LABEL = { immediate: 'Immédiate', principale: 'Principale', secondaire: 'Secondaire' }
const TYPE_STYLE = {
  immediate:  { background: '#2a1e0a', border: '1px solid #6b5520', color: '#c9a84c' },
  principale: { background: '#1a1030', border: '1px solid #4a3a6e', color: '#b79ad6' },
  secondaire: { background: '#12161f', border: '1px solid #252a3a', color: '#8a94ad' },
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  vide: { margin: 0, fontSize: 12.5, color: '#4a4a6a', fontStyle: 'italic' },
  carte: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5,
    width: '100%', textAlign: 'left', padding: '10px 11px', cursor: 'pointer',
    background: '#13161f', border: '1px solid #252a3a', borderRadius: 9,
  },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 9.5, letterSpacing: 0.5 },
  titre: { fontSize: 13, color: '#e8e0f0', fontFamily: "'Cinzel', serif", lineHeight: 1.3 },
  desc: {
    fontSize: 11.5, color: '#8a8aaa', lineHeight: 1.45,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  indices: { fontSize: 10, color: '#c9a84c', letterSpacing: 0.5 },
  archivesBloc: { marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 },
  archivesToggle: {
    display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '4px 2px',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#4a4a6a', fontSize: 11, letterSpacing: 0.5, fontFamily: "'Inter', sans-serif",
  },
  archiveItem: {
    display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left',
    padding: '5px 6px', background: 'none', border: 'none', cursor: 'pointer',
  },
  archiveTitre: { fontSize: 12, color: '#6a6a8a', lineHeight: 1.3 },
}