import { Skull, Crown, Swords } from 'lucide-react'

// Fin de combat gagné. S'affiche DANS l'arène (plus de voile par-dessus le chat :
// c'était illisible). Deux intensités, mêmes données, deux traitements :
//   victoire         → sobre
//   victoire_majeure → grandiose
// Dans les deux cas, c'est « Reprendre l'aventure » qui referme l'arène et rend
// le fil de narration : l'écran ne disparaît jamais tout seul.
//
// `ordre` est le SNAPSHOT pris AVANT combatService.terminer() (qui vide l'ordre).

const CSS = `
  @keyframes vicMonte { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes vicTrait { from { transform: scaleX(0); opacity: 0 } to { transform: scaleX(1); opacity: 1 } }
  @keyframes vicLigne { from { opacity: 0; transform: translateX(-10px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes vicTitre {
    0%   { opacity: 0; letter-spacing: 24px; filter: blur(6px) }
    100% { opacity: 1; letter-spacing: 8px;  filter: blur(0) }
  }
  @keyframes vicLueur {
    0%, 100% { text-shadow: 0 0 16px rgba(201,168,76,.45) }
    50%      { text-shadow: 0 0 34px rgba(201,168,76,.85) }
  }
`

export default function VictoireCombat({ issue, ordre = [], round = 1, onReprendre }) {
  const majeure = issue === 'victoire_majeure'
  const ennemis = ordre.filter((c) => c.type === 'ennemi')
  const vaincus = ennemis.filter((c) => c.statut === 'mort')
  const degats = ennemis.reduce((n, c) => n + Math.max(0, (c.pvMax ?? 0) - (c.pv ?? 0)), 0)

  return (
    <div style={S.zone}>
      <style>{CSS}</style>
      <div style={{ ...S.halo, background: majeure ? HALO.maj : HALO.min }} />

      <div style={S.bloc}>
        <div style={S.trait} />
        {majeure
          ? <Crown size={38} color="#c9a84c" style={{ animation: 'vicMonte .5s ease both' }} />
          : <Swords size={24} color="#c9a84c" style={{ animation: 'vicMonte .5s ease both' }} />}

        <div style={{ ...S.titre, fontSize: majeure ? 46 : 28, animation: majeure
          ? 'vicTitre .8s cubic-bezier(.2,.9,.3,1) both, vicLueur 2.6s .8s ease-in-out infinite'
          : 'vicMonte .5s .1s ease both' }}>
          VICTOIRE
        </div>
        <div style={S.sous}>
          {majeure ? "L'affrontement restera dans les mémoires" : 'Le calme retombe'}
        </div>
        <div style={{ ...S.trait, animationDelay: '.1s' }} />

        {vaincus.length > 0 && (
          <div style={S.liste}>
            {vaincus.map((c, i) => (
              <div key={c.id} style={{ ...S.ligne, animationDelay: `${0.3 + i * 0.08}s` }}>
                <Skull size={14} color="#8a8aaa" />
                <span style={S.ligneNom}>{c.nom}</span>
                <span style={S.ligneVal}>{c.pvMax} PV</span>
              </div>
            ))}
          </div>
        )}

        <div style={S.stats}>
          <div style={S.stat}><span style={S.statVal}>{round}</span><span style={S.statLbl}>{round > 1 ? 'ROUNDS' : 'ROUND'}</span></div>
          <div style={S.stat}><span style={S.statVal}>{vaincus.length}</span><span style={S.statLbl}>VAINCUS</span></div>
          <div style={S.stat}><span style={S.statVal}>{degats}</span><span style={S.statLbl}>DÉGÂTS</span></div>
        </div>

        <button style={S.btn} onClick={onReprendre}>Reprendre l'aventure</button>
      </div>
    </div>
  )
}

const HALO = {
  maj: 'radial-gradient(ellipse at center, rgba(201,168,76,.16) 0%, transparent 65%)',
  min: 'radial-gradient(ellipse at center, rgba(201,168,76,.07) 0%, transparent 62%)',
}

const S = {
  zone: { position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '18px 20px' },
  halo: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  bloc: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11, width: '100%', maxWidth: 440 },
  trait: { width: '100%', maxWidth: 330, height: 1, background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)', animation: 'vicTrait .55s ease both' },
  titre: { fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontWeight: 700, color: '#e8e0f0' },
  sous: { fontFamily: "'EB Garamond', serif", fontSize: 13, fontStyle: 'italic', color: '#8a8aaa', animation: 'vicMonte .5s .3s ease both' },
  liste: { display: 'flex', flexDirection: 'column', gap: 5, width: '100%', marginTop: 4 },
  ligne: { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 7, animation: 'vicLigne .4s ease both' },
  ligneNom: { flex: 1, fontSize: 13, color: '#c4bcd4' },
  ligneVal: { fontSize: 10.5, color: '#4a4a6a', fontFamily: "'Cinzel', serif" },
  stats: { display: 'flex', gap: 28, marginTop: 8, animation: 'vicMonte .5s .45s ease both' },
  stat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  statVal: { fontSize: 25, fontWeight: 700, fontFamily: "'Cinzel', serif", color: '#c9a84c' },
  statLbl: { fontSize: 8.5, color: '#4a4a6a', letterSpacing: 1.4 },
  btn: {
    marginTop: 14, background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)',
    border: 'none', borderRadius: 9, color: '#0a0b0f', padding: '11px 28px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cinzel', serif",
    animation: 'vicMonte .5s .6s ease both',
  },
}