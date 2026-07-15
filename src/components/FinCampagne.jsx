import { useNavigate } from 'react-router-dom'
import { Skull, Crown } from 'lucide-react'

// Fin de campagne — déclenché par [FIN:mort|raison] ou [FIN:reussie|raison].
// La campagne est déjà passée en 'terminee_mort' / 'terminee_reussie' en base
// (campaignService.terminerCampagne) : cet écran ne fait qu'annoncer, il ne décide rien.
// Le personnage n'est pas touché : il reste réutilisable pour une autre campagne.
// Pas de bouton de fermeture — la partie est finie, on ne revient pas au fil.

const CSS = `
  @keyframes finVoile  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes finMonte  { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes finTrait  { from { transform: scaleX(0); opacity: 0 } to { transform: scaleX(1); opacity: 1 } }
  @keyframes finTitre  {
    0%   { opacity: 0; letter-spacing: 26px; filter: blur(7px) }
    100% { opacity: 1; letter-spacing: 9px;  filter: blur(0) }
  }
`

export default function FinCampagne({ issue, raison, perso, titreCampagne }) {
  const navigate = useNavigate()
  const mort = issue === 'mort'
  const t = mort ? TH.mort : TH.reussie

  return (
    <div style={S.voile}>
      <style>{CSS}</style>
      {/* Halo purement decoratif, DERRIERE le panneau : le fond, lui, est opaque.
          Un voile semi-transparent laissait le chat transparaitre pile sous le
          titre et la raison — illisible. La partie est finie : rien a voir derriere. */}
      <div style={{ ...S.halo, background: t.halo }} />
      <div style={{ ...S.panneau, borderColor: t.bordure }}>
        <div style={{ ...S.trait, background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)` }} />

        {mort ? <Skull size={40} color={t.accent} style={S.icone} /> : <Crown size={40} color={t.accent} style={S.icone} />}

        <div style={{ ...S.titre, color: t.titre, textShadow: `0 0 30px ${t.lueur}` }}>{t.mot}</div>
        <div style={{ ...S.sous, color: t.accent }}>{t.sous}</div>

        <div style={{ ...S.trait, background: `linear-gradient(90deg, transparent, ${t.accent}, transparent)`, animationDelay: '.1s' }} />

        {raison && <p style={S.raison}>« {raison} »</p>}

        <div style={S.meta}>
          {perso?.nom && (
            <span>{perso.nom} — {perso.espece} {perso.classe}, niveau {perso.niveau}</span>
          )}
          {titreCampagne && <span style={S.metaCamp}>{titreCampagne}</span>}
        </div>

        <p style={S.note}>
          {mort
            ? `Cette campagne est close. ${perso?.nom ?? 'Ton personnage'} pourra reprendre la route dans une nouvelle aventure — ce qui s'est joué ici reste consultable dans tes campagnes terminées.`
            : `L'histoire est achevée. Elle reste consultable dans tes campagnes terminées, et ${perso?.nom ?? 'ton personnage'} peut désormais s'engager ailleurs.`}
        </p>

        <div style={S.btns}>
          <button style={{ ...S.btn, borderColor: t.accent, color: t.accent }} onClick={() => navigate('/campagnes')}>
            Mes campagnes
          </button>
          <button style={{ ...S.btnPlein, background: t.grad }} onClick={() => navigate('/personnages')}>
            Nouvelle aventure
          </button>
        </div>
      </div>
    </div>
  )
}

const TH = {
  mort: {
    mot: 'MORT', sous: 'Ici s\u2019arrête ton histoire',
    accent: '#b84040', titre: '#f2eef8', lueur: 'rgba(184,64,64,.55)',
    bordure: '#4a2020',
    halo: 'radial-gradient(ellipse 900px 520px at center, rgba(184,64,64,.18) 0%, transparent 70%)',
    grad: 'linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)',
  },
  reussie: {
    mot: 'ACHEVÉE', sous: 'Ton histoire touche à sa fin',
    accent: '#c9a84c', titre: '#f2eef8', lueur: 'rgba(201,168,76,.55)',
    bordure: '#5a4a20',
    halo: 'radial-gradient(ellipse 900px 520px at center, rgba(201,168,76,.16) 0%, transparent 70%)',
    grad: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)',
  },
}

const S = {
  voile: {
    position: 'fixed', inset: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#06060a',                 // ← OPAQUE : plus rien ne transparaît
    animation: 'finVoile .6s ease both', fontFamily: "'Inter', sans-serif",
  },
  halo: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  panneau: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13,
    padding: '38px 42px 32px', maxWidth: 560, textAlign: 'center',
    background: 'linear-gradient(180deg, #101018 0%, #0a0b10 100%)',
    border: '1px solid', borderRadius: 16,
    boxShadow: '0 30px 90px rgba(0,0,0,.9)',
    animation: 'finMonte .7s .15s ease both',
  },
  trait: { width: 340, height: 1, animation: 'finTrait .7s ease both' },
  icone: { animation: 'finMonte .6s .1s ease both' },
  titre: { fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: 50, fontWeight: 700, animation: 'finTitre .9s cubic-bezier(.2,.9,.3,1) both' },
  trait2: {},
  sous: { fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 3, animation: 'finVoile .6s .5s ease both' },
  raison: {
    fontFamily: "'EB Garamond', serif", fontSize: 16, fontStyle: 'italic',
    color: '#ded6ea', lineHeight: 1.55, margin: '6px 0 0', animation: 'finMonte .6s .6s ease both',
  },
  meta: { display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12.5, color: '#a8a2bc', marginTop: 4, animation: 'finVoile .6s .75s ease both' },
  metaCamp: { fontFamily: "'Cinzel', serif", fontSize: 11.5, color: '#7b7495' },
  note: { fontSize: 12.5, color: '#8a8399', lineHeight: 1.65, margin: '12px 0 0', maxWidth: 440, animation: 'finVoile .6s .85s ease both' },
  btns: { display: 'flex', gap: 10, marginTop: 18, animation: 'finVoile .6s .95s ease both' },
  btn: { background: 'none', border: '1px solid', borderRadius: 9, padding: '10px 20px', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Cinzel', serif" },
  btnPlein: { border: 'none', borderRadius: 9, color: '#e8e0f0', padding: '10px 22px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Cinzel', serif" },
}