// Rend la narration du MJ : dialogues « … », voix de PNJ, couleurs sémantiques,
// gras/italique. Le MJ émet des balises, ce composant les transforme en style.

// Voix de PNJ (archétypes, nombre borné de polices)
const VOIX = {
  commun: { fontFamily: "'EB Garamond', serif", fontStyle: 'italic', fontSize: 16, color: '#d8cdb0' },
  noble:  { fontFamily: "'Cinzel', serif", fontSize: 14.5, letterSpacing: 0.5, color: '#e0d6b8' },
  divin:  { fontFamily: "'Cinzel Decorative', serif", color: '#c9a84c', letterSpacing: 0.5 },
  sombre: { fontFamily: "'Grenze Gotisch', serif", fontSize: 17, color: '#c46b6b', letterSpacing: 0.5 },
}

// Couleurs / styles sémantiques
const TAG = {
  danger:  { color: '#d35c5c', fontWeight: 500 },
  'sacré': { color: '#c9a84c', fontWeight: 500 },
  sacre:   { color: '#c9a84c', fontWeight: 500 },
  arcane:  { color: '#9a82c4' },
  lieu:    { color: '#5fb0b0' },
  murmure: { color: '#6a6a8a', fontStyle: 'italic', fontSize: 13 },
  cri:     { color: '#e24b4a', fontWeight: 500, letterSpacing: 2 },
  ancien:  { fontFamily: "'Cinzel Decorative', serif", color: '#c9a84c', letterSpacing: 1 },
}

const GUILL_OUVRANT = '\u00AB\u00A0'
const GUILL_FERMANT = '\u00A0\u00BB'

function parseInline(text, inVoix, kp) {
  const nodes = []
  const re = /\[voix=(commun|noble|divin|sombre)\]([\s\S]*?)\[\/voix\]|\[(danger|sacré|sacre|arcane|lieu|murmure|cri|ancien)\]([\s\S]*?)\[\/\3\]|«([\s\S]*?)»|\*\*([\s\S]*?)\*\*|\*([\s\S]*?)\*/g
  let last = 0
  let m
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const key = `${kp}-${i++}`

    if (m[1] != null) {
      nodes.push(<span key={key} style={VOIX[m[1]] || VOIX.commun}>{parseInline(m[2], true, key)}</span>)
    } else if (m[3] != null) {
      nodes.push(<span key={key} style={TAG[m[3]] || undefined}>{parseInline(m[4], inVoix, key)}</span>)
    } else if (m[5] != null) {
      const inner = parseInline(m[5].trim(), inVoix, key)
      nodes.push(
        <span key={key} style={inVoix ? undefined : VOIX.commun}>{GUILL_OUVRANT}{inner}{GUILL_FERMANT}</span>
      )
    } else if (m[6] != null) {
      nodes.push(<strong key={key} style={{ fontWeight: 600 }}>{parseInline(m[6], inVoix, key)}</strong>)
    } else if (m[7] != null) {
      nodes.push(<em key={key}>{parseInline(m[7], inVoix, key)}</em>)
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export default function Narration({ text }) {
  return <>{parseInline(text || '', false, 'n')}</>
}