import { useEffect } from 'react'
import { Swords } from 'lucide-react'

// Alerte de début de combat. Affichée sur transition combat.actif false → true
// (état dérivé, aucun champ ajouté en base). Se referme seule ou au clic.

const CSS = `
  @keyframes alerteVoile { from { opacity: 0 } to { opacity: 1 } }
  @keyframes alerteSurgit {
    0%   { opacity: 0; transform: scale(1.6); letter-spacing: 22px; filter: blur(6px) }
    45%  { opacity: 1; transform: scale(1);   letter-spacing: 8px;  filter: blur(0) }
    100% { opacity: 1; transform: scale(1);   letter-spacing: 8px;  filter: blur(0) }
  }
  @keyframes alerteTrait {
    from { transform: scaleX(0); opacity: 0 }
    to   { transform: scaleX(1); opacity: 1 }
  }
  @keyframes alerteLame { 0%, 100% { transform: rotate(-8deg) } 50% { transform: rotate(8deg) } }
`

export default function AlerteCombat({ onFermer, duree = 2000 }) {
  useEffect(() => {
    const t = setTimeout(onFermer, duree)
    return () => clearTimeout(t)
  }, [onFermer, duree])

  return (
    <div style={S.voile} onClick={onFermer}>
      <style>{CSS}</style>
      <div style={S.bloc}>
        <div style={S.trait} />
        <div style={S.lame}><Swords size={30} color="#b84040" /></div>
        <div style={S.titre}>COMBAT</div>
        <div style={S.sous}>Lance ton initiative</div>
        <div style={{ ...S.trait, animationDelay: '.1s' }} />
      </div>
    </div>
  )
}

const S = {
  voile: {
    position: 'fixed', inset: 0, zIndex: 90,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at center, rgba(184,64,64,.16) 0%, rgba(10,11,15,.86) 70%)',
    animation: 'alerteVoile .25s ease both', cursor: 'pointer',
  },
  bloc: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  trait: {
    width: 300, height: 1, background: 'linear-gradient(90deg, transparent, #b84040, transparent)',
    animation: 'alerteTrait .5s ease both',
  },
  lame: { animation: 'alerteLame 1s ease-in-out infinite' },
  titre: {
    fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: 52, fontWeight: 700,
    color: '#e8e0f0', textShadow: '0 0 26px rgba(184,64,64,.7)',
    animation: 'alerteSurgit .6s cubic-bezier(.2,.9,.3,1) both',
  },
  sous: {
    fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 3, color: '#c9a84c',
    animation: 'alerteVoile .4s .45s ease both',
  },
}