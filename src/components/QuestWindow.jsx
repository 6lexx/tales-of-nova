import { useState } from 'react'
import { X, GripHorizontal, ScrollText } from 'lucide-react'

// Fenêtre flottante draggable affichant une quête en détail (description + indices cumulés).
// Même logique que le bloc-notes / la feuille de perso de Game.jsx.
// Props : { quete, onClose }. Ne rend rien si quete est null.
export default function QuestWindow({ quete, onClose }) {
  const [pos, setPos] = useState({ x: 140, y: 120 })

  if (!quete) return null

  const startDrag = (e) => {
    e.preventDefault()
    const dx = e.clientX - pos.x
    const dy = e.clientY - pos.y
    const onMove = (ev) => setPos({ x: ev.clientX - dx, y: ev.clientY - dy })
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const indices = Array.isArray(quete.indices) ? quete.indices : []

  return (
    <div style={{ ...S.window, left: pos.x, top: pos.y }}>
      <div style={S.titleBar} onMouseDown={startDrag}>
        <span style={S.titleTxt}>
          <GripHorizontal size={13} style={{ marginRight: 6, opacity: 0.5 }} />
          Quête
        </span>
        <button style={S.close} onClick={onClose}><X size={14} /></button>
      </div>

      <div style={S.body}>
        <div style={{ ...S.badge, ...(TYPE_STYLE[quete.type] || {}) }}>{TYPE_LABEL[quete.type] || quete.type}</div>
        <h3 style={S.titre}>{quete.titre}</h3>
        {quete.description && <p style={S.desc}>{quete.description}</p>}

        <div style={S.indicesTitre}>
          <ScrollText size={12} style={{ marginRight: 6 }} />
          Indices ({indices.length})
        </div>
        {indices.length === 0 ? (
          <p style={S.vide}>Aucun indice pour l'instant.</p>
        ) : (
          <ul style={S.indicesList}>
            {indices.map((ind, i) => <li key={i} style={S.indice}>{ind}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}

const TYPE_LABEL = { immediate: 'Immédiate', principale: 'Principale', secondaire: 'Secondaire' }
const TYPE_STYLE = {
  immediate:  { background: '#2a1e0a', border: '1px solid #c9a84c', color: '#e8c96a' },
  principale: { background: '#1a1030', border: '1px solid #7b5ea7', color: '#b79ad6' },
  secondaire: { background: '#12161f', border: '1px solid #3a4358', color: '#8a94ad' },
}

const S = {
  window: {
    position: 'fixed', zIndex: 210, width: 340, maxHeight: '70vh',
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, #14131f 0%, #0a0b0f 100%)',
    border: '1px solid #4a3a6e', borderRadius: 12,
    boxShadow: '0 16px 48px rgba(0,0,0,.7)', overflow: 'hidden',
  },
  titleBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: '#1a1228', borderBottom: '1px solid #252a3a',
    cursor: 'grab', userSelect: 'none', flexShrink: 0,
  },
  titleTxt: {
    display: 'flex', alignItems: 'center', fontSize: 12, color: '#c9a84c',
    fontFamily: "'Cinzel', serif", letterSpacing: 1,
  },
  close: { background: 'none', border: 'none', color: '#8a8aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },
  body: { padding: '14px 16px', overflowY: 'auto', overflowX: 'hidden' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, letterSpacing: 0.5, marginBottom: 10 },
  titre: { margin: '0 0 8px', fontSize: 16, color: '#e8e0f0', fontFamily: "'Cinzel', serif" },
  desc: { margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.6, color: '#c4bcd4' },
  indicesTitre: {
    display: 'flex', alignItems: 'center', fontSize: 11, letterSpacing: 1,
    color: '#c9a84c', fontFamily: "'Cinzel', serif", borderTop: '1px solid #252a3a',
    paddingTop: 12, marginBottom: 8,
  },
  vide: { margin: 0, fontSize: 12.5, color: '#4a4a6a', fontStyle: 'italic' },
  indicesList: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 },
  indice: { fontSize: 13, lineHeight: 1.5, color: '#c4bcd4' },
}