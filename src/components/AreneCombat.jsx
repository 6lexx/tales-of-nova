import { useRef } from 'react'
import { Swords, Skull, User, Shield, Zap, Repeat, Footprints, GripHorizontal, Heart, Send } from 'lucide-react'
import { etatMecanique } from '../services/guerrierService'
import VictoireCombat from './VictoireCombat'

// Fenêtre flottante du combat. Le combat s'y joue ENTIÈREMENT : état des
// combattants, narration du MJ, jets de dés et saisie d'action. Le fil de chat
// reste derrière — il garde l'historique complet — mais sa saisie est VERROUILLÉE
// tant que le combat dure : la fenêtre est la seule entrée possible, jusqu'à ce
// que le MJ y mette fin (victoire, fuite, défaite).
// Déplaçable, sur le modèle du bloc-notes / de l'inventaire.
// Elle ne pilote RIEN : elle affiche l'état que Game.jsx lui passe. Le dock de
// dés est le JSX de Game.jsx, passé en prop : un seul dé, deux emplacements.
//
// Sur les données affichées — ne rien inventer :
//  - « Attaques par action » vient de etatMecanique(perso).nombreAttaques, qui
//    n'existe QUE pour le Guerrier (guerrierService est gated sur la classe,
//    comme buildBlocPerso). Pour les autres, la ligne est masquée : afficher « 1 »
//    serait faux dès le niveau 5 pour Barbare / Paladin / Rôdeur.
//  - Déplacement et actions bonus : AUCUNE donnée en base (pas de vitesse dans
//    dnd.js ni dans characters, pas de type "action_bonus" dans les classes).
//    Ils figurent donc en RAPPEL de règle, sans valeur chiffrée.

// Actions SRD 5.1 disponibles à tout personnage — rappel statique, aucune logique.
const ACTIONS_BASE = [
  ['Attaquer', 'Une attaque au corps à corps ou à distance.'],
  ['Lancer un sort', "Selon le temps d'incantation du sort."],
  ['Esquiver', 'Les attaques contre toi ont un désavantage ; tes jets de DEX ont un avantage.'],
  ['Foncer', 'Double ton déplacement pour ce tour.'],
  ['Se désengager', "Ton déplacement ne provoque pas d'attaque d'opportunité."],
  ['Se cacher', 'Jet de Discrétion pour tenter de disparaître.'],
  ['Aider', 'Donne un avantage à un allié sur son prochain jet.'],
  ['Préparer', 'Choisis un déclencheur et une réaction à exécuter.'],
  ['Utiliser un objet', 'Interagir avec un objet qui le nécessite.'],
]

export default function AreneCombat({
  combat, perso, impacts = {}, victoire, onReprendre,
  combattantCourant, estMonTour, pos = { x: 300, y: 70 }, onDragStart,
  saisie, setSaisie, onSend, onKeyDown, onTerminerTour, onLaisserAgir,
  loading, jetEnCours, derniersMessages = [], dockDe = null,
}) {
  const winRef = useRef(null)
  // Écran de fin : l'arène reste, son contenu change. C'est « Reprendre
  // l'aventure » qui la referme, jamais un timer.
  const ordre = combat?.ordre ?? []

  const estGuerrier = (perso?.classe ?? '').toLowerCase().includes('guerrier')
  let nbAttaques = null
  if (estGuerrier) {
    try { nbAttaques = etatMecanique(perso).nombreAttaques } catch { nbAttaques = null }
  }

  // Écran de fin : la fenêtre reste, son contenu change. C'est « Reprendre
  // l'aventure » qui la referme, jamais un timer.
  if (victoire) {
    return (
      <div style={{ ...S.fenetre, left: pos.x, top: pos.y, width: 620 }} ref={winRef}>
        <style>{CSS}</style>
        <div style={S.barre} onMouseDown={onDragStart}>
          <GripHorizontal size={14} color="#4a4a6a" />
          <span style={S.barreTitre}>Combat</span>
        </div>
        <VictoireCombat issue={victoire.issue} ordre={victoire.ordre}
          round={victoire.round} onReprendre={onReprendre} />
      </div>
    )
  }

  return (
    <div style={{ ...S.fenetre, left: pos.x, top: pos.y }} ref={winRef}>
      <style>{CSS}</style>

      <div style={S.barre} onMouseDown={onDragStart}>
        <GripHorizontal size={14} color="#4a4a6a" />
        <span style={S.barreTitre}>Combat</span>
      </div>

      {/* ── Bandeau : round + ordre d'initiative ── */}
      <div style={S.entete}>
        <div style={S.round}>
          <Swords size={15} color="#b84040" />
          <span style={S.roundTxt}>ROUND {combat.round}</span>
        </div>
        <div style={S.piste}>
          {ordre.map((c, i) => {
            const actif = i === combat.tour
            const mort = c.type === 'ennemi' && c.statut === 'mort'
            return (
              <div key={c.id} style={{ ...S.jeton, ...(actif ? S.jetonActif : {}), ...(mort ? S.jetonMort : {}) }}>
                <span style={S.jetonInit}>{c.init ?? '—'}</span>
                <span style={S.jetonNom}>{c.nom}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Scène : tous les combattants, dans l'ordre d'initiative.
             Le joueur y figure à SA place — pas à part : c'est l'ordre qui compte. ── */}
      <div style={S.scene}>
        {ordre.length === 0 && <div style={S.vide}>Aucun combattant déclaré.</div>}
        {ordre.map((c) => {
          const estPerso = c.type === 'perso'
          const actif = ordre[combat.tour]?.id === c.id
          const mort = !estPerso && c.statut === 'mort'
          const imp = impacts[c.id]
          // Le joueur connaît ses PV : on les affiche. Ceux des ennemis restent
          // cachés — seul le cumul de dégâts encaissés est révélé.
          const cumul = estPerso ? 0 : Math.max(0, (c.pvMax ?? 0) - (c.pv ?? 0))
          const pvPct = estPerso ? Math.max(0, Math.min(100, ((perso?.pv_actuels ?? 0) / (perso?.pv_max || 1)) * 100)) : 0
          return (
            <div key={c.id} style={{
              ...S.carte,
              ...(estPerso ? S.cartePerso : {}),
              ...(actif ? (estPerso ? S.carteActivePerso : S.carteActive) : {}),
              ...(mort ? S.carteMorte : {}),
              ...(imp ? S.carteTouchee : {}),
            }}>
              {imp && <div key={imp.key} style={S.impact}>
                <span style={S.impactVal}>−{imp.total}</span>
                {imp.formule && <span style={S.impactDes}>{imp.formule}</span>}
              </div>}
              <div style={{ ...S.avatar, ...(estPerso ? S.avatarPerso : {}), ...(mort ? S.avatarMort : {}) }}>
                {estPerso ? <User size={30} color="#3a8a8a" />
                  : mort ? <Skull size={30} color="#8a8aaa" />
                  : <Swords size={30} color="#b84040" />}
              </div>
              <div style={S.carteNom}>{c.nom}</div>
              <div style={S.carteMeta}>
                {mort ? <span style={S.carteHors}>hors de combat</span>
                  : <><Shield size={11} color="#4a4a6a" /> <span>CA {c.ca}</span></>}
              </div>
              {estPerso ? (
                <div style={S.persoPv}>
                  <div style={S.persoBarre}>
                    <div style={{ ...S.persoFill, width: `${pvPct}%`, background: pvPct > 60 ? '#3a8a8a' : pvPct > 30 ? '#c9a84c' : '#b84040' }} />
                  </div>
                  <div style={S.persoPvTxt}>
                    <Heart size={10} color="#b84040" /> {perso?.pv_actuels ?? 0}/{perso?.pv_max ?? 1}
                  </div>
                </div>
              ) : !mort && (
                <div style={S.cumul}>
                  {cumul > 0 ? <><span style={S.cumulVal}>−{cumul}</span><span style={S.cumulLbl}>subis</span></>
                    : <span style={S.cumulLbl}>indemne</span>}
                </div>
              )}
              {actif && <div style={{ ...S.badgeTour, ...(estPerso ? S.badgeTourPerso : {}) }}>
                {estPerso ? 'À TOI' : 'À LUI'}
              </div>}
            </div>
          )
        })}
      </div>

      {/* ── Ton tour : rappels d'actions ── */}
      <div style={{ ...S.tourPanneau, ...(estMonTour ? S.tourPanneauActif : {}) }}>
        <div style={S.tourEntete}>
          {estMonTour
            ? <><User size={13} color="#3a8a8a" /> <span style={S.tourTitre}>Ton tour</span></>
            : <><Swords size={13} color="#b84040" /> <span style={S.tourTitreOff}>Tour de {combattantCourant?.nom ?? '—'}</span></>}
        </div>

        <div style={S.jetons}>
          <Pastille icone={<Zap size={12} />} val="1" lbl="ACTION" on={estMonTour} />
          <Pastille icone={<Zap size={12} />} val="1" lbl="ACTION BONUS" on={estMonTour} note="si une capacité t'en donne une" />
          <Pastille icone={<Repeat size={12} />} val="1" lbl="RÉACTION" on={estMonTour} note="hors de ton tour" />
          <Pastille icone={<Footprints size={12} />} val="—" lbl="DÉPLACEMENT" on={estMonTour} note="demande au MJ" />
          {nbAttaques > 1 && (
            <Pastille icone={<Swords size={12} />} val={String(nbAttaques)} lbl="ATTAQUES" on={estMonTour}
              note="par action Attaquer" accent />
          )}
        </div>

        <details style={S.rappels}>
          <summary style={S.rappelsTitre}>Que peux-tu faire ?</summary>
          <div style={S.rappelsListe}>
            {ACTIONS_BASE.map(([nom, desc]) => (
              <div key={nom} style={S.rappel}>
                <span style={S.rappelNom}>{nom}</span>
                <span style={S.rappelDesc}>{desc}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      {/* ── Narration du combat ── */}
      <div style={S.narration}>
        {derniersMessages.length === 0
          ? <div style={S.vide}>Le combat s'engage…</div>
          : derniersMessages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? S.msgJoueur : S.msgMj}>{m.content}</div>
          ))}
        {loading && <div style={S.reflechit}>Le MJ réfléchit…</div>}
      </div>

      {/* ── Dé : même composant que hors combat, rendu ici pendant le combat ── */}
      {dockDe && <div style={S.dockZone}>{dockDe}</div>}

      {/* ── Saisie d'action : le combat se joue ICI, pas dans le fil ── */}
      {estMonTour ? (
        <div style={S.saisieZone}>
          <textarea style={S.saisie} value={saisie} rows={2}
            onChange={(e) => setSaisie(e.target.value)} onKeyDown={onKeyDown}
            disabled={loading || jetEnCours}
            placeholder="Décris ton action… (Entrée pour envoyer)" />
          <div style={S.saisieBtns}>
            <button style={{ ...S.envoyer, opacity: loading || jetEnCours || !saisie?.trim() ? 0.4 : 1 }}
              onClick={onSend} disabled={loading || jetEnCours || !saisie?.trim()}>
              <Send size={16} />
            </button>
            <button style={{ ...S.finTour, opacity: loading || jetEnCours ? 0.4 : 1 }}
              onClick={onTerminerTour} disabled={loading || jetEnCours}
              title="Enchaîne autant d'actions que tu veux, puis termine">
              Terminer mon tour
            </button>
          </div>
        </div>
      ) : (
        <div style={S.attenteZone}>
          <span style={S.attenteLbl}>Ce n'est pas ton tour.</span>
          <button style={{ ...S.agirBtn, opacity: loading || jetEnCours ? 0.4 : 1 }}
            onClick={() => onLaisserAgir(combattantCourant?.nom)} disabled={loading || jetEnCours}>
            <Swords size={15} style={{ marginRight: 7 }} /> Laisser agir {combattantCourant?.nom ?? ''}
          </button>
        </div>
      )}
    </div>
  )
}

function Pastille({ icone, val, lbl, note, on, accent }) {
  return (
    <div style={{ ...S.past, opacity: on ? 1 : 0.4, ...(accent ? S.pastAccent : {}) }} title={note || ''}>
      <div style={S.pastHaut}>{icone}<span style={{ ...S.pastVal, ...(accent ? { color: '#c9a84c' } : {}) }}>{val}</span></div>
      <span style={S.pastLbl}>{lbl}</span>
      {note && <span style={S.pastNote}>{note}</span>}
    </div>
  )
}

const CSS = `
  @keyframes arImpact {
    0%   { opacity: 0; transform: translate(-50%, 10px) scale(.4) }
    15%  { opacity: 1; transform: translate(-50%, -10px) scale(1.5) }
    30%  { opacity: 1; transform: translate(-50%, -16px) scale(1) }
    72%  { opacity: 1; transform: translate(-50%, -30px) scale(1) }
    100% { opacity: 0; transform: translate(-50%, -52px) scale(.85) }
  }
  @keyframes arSecousse {
    0%, 100% { transform: translateX(0) }
    12% { transform: translateX(-7px) } 26% { transform: translateX(7px) }
    40% { transform: translateX(-5px) } 55% { transform: translateX(5px) }
    72% { transform: translateX(-2px) }
  }
  @keyframes arFlash {
    0%   { box-shadow: 0 0 0 0 rgba(184,64,64,.85), inset 0 0 22px rgba(184,64,64,.7) }
    100% { box-shadow: 0 0 0 16px rgba(184,64,64,0), inset 0 0 0 rgba(184,64,64,0) }
  }
  @keyframes arPulse {
    0%, 100% { border-color: #c9a84c; box-shadow: 0 0 0 0 rgba(201,168,76,.25) }
    50%      { border-color: #e0c46a; box-shadow: 0 0 0 5px rgba(201,168,76,0) }
  }
`

const S = {
  // Fenetre flottante, meme facture que noteWindow / ficheWindow de Game.jsx.
  fenetre: {
    position: 'fixed', zIndex: 180, width: 620, maxHeight: '86vh',
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, #16111f 0%, #0f1118 100%)',
    border: '1px solid #5a2828', borderRadius: 13,
    boxShadow: '0 20px 60px rgba(0,0,0,.8)', overflow: 'hidden',
  },
  barre: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
    borderBottom: '1px solid #252a3a', cursor: 'move', userSelect: 'none',
    background: 'rgba(28,16,16,.6)', flexShrink: 0,
  },
  barreTitre: { fontFamily: "'Cinzel', serif", fontSize: 11.5, color: '#8a8aaa', letterSpacing: 1.4 },
  corps: { display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px 14px', overflowY: 'auto' },

  entete: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, padding: '12px 16px 0' },
  round: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: '#1c1010', border: '1px solid #5a2828', borderRadius: 7 },
  roundTxt: { fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: '#e8e0f0', letterSpacing: 1.2 },
  piste: { display: 'flex', gap: 5, flex: 1, overflowX: 'auto', paddingBottom: 2 },
  jeton: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 20, flexShrink: 0 },
  jetonActif: { border: '1px solid #c9a84c', background: '#1c1810', animation: 'arPulse 2s ease-in-out infinite' },
  jetonMort: { opacity: 0.32, textDecoration: 'line-through' },
  jetonInit: { fontFamily: "'Cinzel', serif", fontSize: 10.5, color: '#7b5ea7' },
  jetonNom: { fontSize: 11, color: '#c4bcd4', whiteSpace: 'nowrap' },

  scene: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', padding: '14px 16px 24px', flexShrink: 0 },
  carte: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    width: 140, padding: '16px 12px 13px', borderRadius: 12,
    background: 'linear-gradient(160deg, #16121a 0%, #0f1118 100%)', border: '1px solid #252a3a',
  },
  carteActive: { border: '1px solid #b84040', background: 'linear-gradient(160deg, #241416 0%, #120f14 100%)' },
  cartePerso: { border: '1px solid #2f4a4a', background: 'linear-gradient(160deg, #101c1c 0%, #0d1114 100%)' },
  carteActivePerso: { border: '1px solid #3a8a8a', background: 'linear-gradient(160deg, #122626 0%, #0d1114 100%)' },
  avatarPerso: { background: '#101c1c', border: '2px solid #3a8a8a', animation: 'none' },
  persoPv: { display: 'flex', flexDirection: 'column', gap: 3, width: '100%', marginTop: 2 },
  persoBarre: { height: 5, background: '#0a0b0f', borderRadius: 3, overflow: 'hidden' },
  persoFill: { height: '100%', transition: 'width .4s ease' },
  persoPvTxt: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, color: '#c4bcd4', fontFamily: "'Cinzel', serif" },
  badgeTourPerso: { background: '#3a8a8a' },
  carteMorte: { opacity: 0.4, filter: 'grayscale(.8)' },
  carteTouchee: { animation: 'arSecousse .5s ease' },
  avatar: {
    width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#1c1010', border: '2px solid #5a2828', animation: 'arFlash .6s ease',
  },
  avatarMort: { background: '#14161c', border: '2px solid #252a3a', animation: 'none' },
  carteNom: { fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8e0f0', textAlign: 'center', lineHeight: 1.25 },
  carteMeta: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#8a8aaa' },
  carteHors: { fontStyle: 'italic', color: '#4a4a6a' },
  cumul: { display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 },
  cumulVal: { fontFamily: "'Cinzel', serif", fontSize: 19, fontWeight: 700, color: '#b84040' },
  cumulLbl: { fontSize: 9, color: '#4a4a6a', letterSpacing: .8 },
  badgeTour: { position: 'absolute', top: -8, right: 8, background: '#b84040', color: '#e8e0f0', fontSize: 8, fontWeight: 700, letterSpacing: 1, padding: '2px 6px', borderRadius: 4, fontFamily: "'Cinzel', serif" },
  impact: {
    position: 'absolute', left: '50%', bottom: '78%', display: 'flex', flexDirection: 'column', alignItems: 'center',
    pointerEvents: 'none', zIndex: 5, animation: 'arImpact 2.4s ease-out forwards',
  },
  impactVal: { fontFamily: "'Cinzel', serif", fontSize: 46, fontWeight: 700, color: '#ff6b5a', textShadow: '0 0 22px rgba(184,64,64,.95), 0 2px 4px #000', lineHeight: 1 },
  impactDes: { fontSize: 11, color: '#c9a84c', letterSpacing: .5, marginTop: 1 },

  tourPanneau: { flexShrink: 0, background: '#0f1118', border: '1px solid #252a3a', borderRadius: 10, padding: '10px 12px', margin: '0 16px 14px' },
  tourPanneauActif: { border: '1px solid #2f4a4a' },
  tourEntete: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 },
  tourTitre: { fontFamily: "'Cinzel', serif", fontSize: 12, color: '#3a8a8a', letterSpacing: 1 },
  tourTitreOff: { fontFamily: "'Cinzel', serif", fontSize: 12, color: '#8a8aaa', letterSpacing: 1 },
  jetons: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  past: { display: 'flex', flexDirection: 'column', gap: 1, padding: '6px 10px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 8, minWidth: 88 },
  pastAccent: { border: '1px solid #6b5520', background: '#1a1610' },
  pastHaut: { display: 'flex', alignItems: 'center', gap: 5, color: '#8a8aaa' },
  pastVal: { fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: '#e8e0f0' },
  pastLbl: { fontSize: 8, color: '#8a8aaa', letterSpacing: 1 },
  pastNote: { fontSize: 8.5, color: '#4a4a6a', fontStyle: 'italic' },

  rappels: { marginTop: 9 },
  rappelsTitre: { fontSize: 11, color: '#7b5ea7', cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: .5, listStyle: 'none' },
  rappelsListe: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 5, marginTop: 8 },
  rappel: { display: 'flex', flexDirection: 'column', padding: '5px 8px', background: '#13161f', borderRadius: 6, border: '1px solid #1c2030' },
  rappelNom: { fontSize: 11, color: '#c4bcd4', fontWeight: 600 },
  rappelDesc: { fontSize: 9.5, color: '#4a4a6a', lineHeight: 1.4 },

  narration: {
    flex: 1, minHeight: 110, maxHeight: 260, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 10,
    padding: '12px 16px', borderTop: '1px solid #1c2030', background: 'rgba(10,11,15,.35)',
  },
  msgMj: { fontFamily: "'EB Garamond', serif", fontSize: 15, lineHeight: 1.62, color: '#c4bcd4', whiteSpace: 'pre-wrap' },
  msgJoueur: { fontSize: 13, color: '#7b5ea7', fontStyle: 'italic', borderLeft: '2px solid #3d2f5a', paddingLeft: 9, whiteSpace: 'pre-wrap' },
  reflechit: { fontSize: 12.5, color: '#4a4a6a', fontStyle: 'italic' },
  dockZone: { padding: '0 14px', flexShrink: 0 },

  saisieZone: { display: 'flex', gap: 8, padding: '11px 14px', borderTop: '1px solid #252a3a', background: 'rgba(10,11,15,.5)', flexShrink: 0 },
  saisie: {
    flex: 1, resize: 'none', background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 8,
    color: '#e8e0f0', padding: '8px 10px', fontSize: 13, fontFamily: "'Inter', sans-serif", lineHeight: 1.5,
  },
  saisieBtns: { display: 'flex', flexDirection: 'column', gap: 6 },
  envoyer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)', border: 'none',
    borderRadius: 8, color: '#e8e0f0', padding: '8px 12px', cursor: 'pointer',
  },
  finTour: {
    background: 'none', border: '1px solid #c9a84c', color: '#c9a84c', borderRadius: 8,
    padding: '5px 8px', fontSize: 10, cursor: 'pointer', fontFamily: "'Cinzel', serif",
    letterSpacing: .3, whiteSpace: 'nowrap',
  },
  attenteZone: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
    padding: '13px 14px', borderTop: '1px solid #252a3a', background: 'rgba(10,11,15,.5)', flexShrink: 0,
  },
  attenteLbl: { fontSize: 12, color: '#8a8aaa', fontStyle: 'italic' },
  agirBtn: {
    display: 'flex', alignItems: 'center',
    background: 'linear-gradient(135deg, #3a1414 0%, #1c1010 100%)', border: '1px solid #5a2828',
    color: '#e8e0f0', borderRadius: 9, padding: '9px 16px', fontSize: 12.5, cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
  },

  vide: { fontSize: 12, color: '#4a4a6a', fontStyle: 'italic', textAlign: 'center', padding: 14 },
}