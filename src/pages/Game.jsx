import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, Shield, Zap, Star, Swords, ScrollText, Dice6, Send, ChevronLeft } from 'lucide-react'
import { getCharacter } from '../services/characterService'
import { getOrCreateSession, loadMessages, saveMessage } from '../services/sessionService'
import { buildSystemPrompt, sendMessage, parseResponse } from '../services/claudeService'
import { lancerD20, formatPourIA } from '../services/diceService'

const C = {
  bg: '#0a0b0f', bgPanel: '#0f1118', bgCard: '#13161f', bgInput: '#1a1e2b',
  border: '#252a3a', borderGlow: '#4a3a6e',
  violet: '#7b5ea7', violetDim: '#3d2f5a',
  gold: '#c9a84c', goldDim: '#6b5520',
  red: '#b84040', teal: '#3a8a8a',
  textPrime: '#e8e0f0', textSub: '#8a8aaa', textMuted: '#4a4a6a',
  gradGold: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)',
  gradViolet: 'linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)',
}

const mod = (v) => Math.floor((v - 10) / 2)
const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`)

export default function Game() {
  const { id: characterId } = useParams()
  const navigate = useNavigate()

  const [perso, setPerso] = useState(null)
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [modal, setModal] = useState(null)
  const [dernierJet, setDernierJet] = useState(null)
  const filRef = useRef(null)

  useEffect(() => {
    async function init() {
      try {
        const p = await getCharacter(characterId)
        setPerso(p)
        const s = await getOrCreateSession(characterId)
        setSession(s)
        const msgs = await loadMessages(s.id)
        setMessages(msgs.map((m) => ({ role: m.role, content: m.content, id: m.id })))
        if (msgs.length === 0) await lancerPremierMessage(p, s)
      } catch (e) {
        setErreur(e.message)
      } finally {
        setInitLoading(false)
      }
    }
    init()
  }, [characterId])

  useEffect(() => {
    filRef.current?.scrollTo({ top: filRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function lancerPremierMessage(p, s) {
    const system = buildSystemPrompt(p, s)
    const intro = [{ role: 'user', content: "L'aventure commence." }]
    const texte = await sendMessage(intro, system)
    const { texte: affichage, jet } = parseResponse(texte)
    const msgMJ = { role: 'assistant', content: affichage }
    setMessages([msgMJ])
    await saveMessage(s.id, 'assistant', affichage)
    if (jet) setModal(jet)
  }

  async function envoyer() {
    if (!saisie.trim() || loading) return
    const contenu = saisie.trim()
    setSaisie('')
    setErreur('')
    const msgJoueur = { role: 'user', content: contenu }
    const nouveauxMessages = [...messages, msgJoueur]
    setMessages(nouveauxMessages)
    await saveMessage(session.id, 'user', contenu)
    setLoading(true)
    try {
      const system = buildSystemPrompt(perso, session)
      const historique = nouveauxMessages.map((m) => ({ role: m.role, content: m.content }))
      const texte = await sendMessage(historique, system)
      const { texte: affichage, jet } = parseResponse(texte)
      const msgMJ = { role: 'assistant', content: affichage }
      setMessages((prev) => [...prev, msgMJ])
      await saveMessage(session.id, 'assistant', affichage)
      if (jet) setModal(jet)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function resoudreJet() {
    if (!modal || !perso) return
    const MAP = {
      force: 'force', for: 'force',
      dexterite: 'dexterite', dex: 'dexterite',
      constitution: 'constitution', con: 'constitution',
      intelligence: 'intelligence', int: 'intelligence',
      sagesse: 'sagesse', sag: 'sagesse',
      charisme: 'charisme', cha: 'charisme',
    }
    const cle = MAP[modal.label.toLowerCase().split(/[\s(]/)[0]] || null
    const valeur = cle ? (perso[cle] || 10) : 10
    const jet = lancerD20(mod(valeur) + 2)
    setDernierJet({ ...jet, label: modal.label, dd: modal.dd })
    setModal(null)

    const contenu = formatPourIA(jet)
    const nouveauxMessages = [...messages, { role: 'user', content: contenu }]
    setMessages(nouveauxMessages)
    await saveMessage(session.id, 'user', contenu)
    setLoading(true)
    try {
      const system = buildSystemPrompt(perso, session)
      const historique = nouveauxMessages.map((m) => ({ role: m.role, content: m.content }))
      const texte = await sendMessage(historique, system)
      const { texte: affichage, jet: prochainJet } = parseResponse(texte)
      setMessages((prev) => [...prev, { role: 'assistant', content: affichage }])
      await saveMessage(session.id, 'assistant', affichage)
      if (prochainJet) setModal(prochainJet)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer() }
  }

  if (initLoading) return <div style={S.centrer}>Chargement de l'aventure…</div>
  if (erreur && !perso) return <div style={S.centrer}><p style={{ color: C.red }}>{erreur}</p></div>

  const pvPct = perso ? Math.max(0, Math.min(100, (perso.pv_actuels / perso.pv_max) * 100)) : 0
  const pvColor = pvPct > 60 ? C.teal : pvPct > 30 ? C.gold : C.red

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* ── COLONNE GAUCHE ── */}
      <aside style={S.sideLeft}>
        <button style={S.retour} onClick={() => navigate('/personnages')}>
          <ChevronLeft size={15} /> Personnages
        </button>
        {perso && <>
          <div style={S.persoNom}>{perso.nom}</div>
          <div style={S.persoMeta}>{perso.espece} · {perso.classe} niv.{perso.niveau}</div>
          <div style={S.pvBlock}>
            <div style={S.pvLbl}><Heart size={13} color={C.red} /> Points de vie</div>
            <div style={S.pvBar}><div style={{ ...S.pvFill, width: `${pvPct}%`, background: pvColor }} /></div>
            <div style={S.pvVal}>{perso.pv_actuels} / {perso.pv_max}</div>
          </div>
          <div style={S.statsGrid}>
            {[['FOR', perso.force], ['DEX', perso.dexterite], ['CON', perso.constitution],
              ['INT', perso.intelligence], ['SAG', perso.sagesse], ['CHA', perso.charisme]].map(([lbl, val]) => (
              <div key={lbl} style={S.statCell}>
                <span style={S.statVal}>{val ?? '—'}</span>
                <span style={S.statMod}>{val ? fmtMod(mod(val)) : '—'}</span>
                <span style={S.statLbl}>{lbl}</span>
              </div>
            ))}
          </div>
          <div style={S.derivees}>
            <Derivee icon={<Shield size={13} color={C.teal} />} label="CA" val={10 + mod(perso.dexterite || 10)} />
            <Derivee icon={<Zap size={13} color={C.gold} />} label="Init" val={fmtMod(mod(perso.dexterite || 10))} />
            <Derivee icon={<Star size={13} color={C.violet} />} label="Maîtrise" val="+2" />
          </div>
          {dernierJet && (
            <div style={S.jetResume}>
              <div style={S.jetResumeTitle}>Dernier jet — {dernierJet.label}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                <div style={S.jetDe}>
                  <span style={{ ...S.jetNum, color: dernierJet.critReussite ? C.gold : dernierJet.critEchec ? C.red : C.textPrime }}>{dernierJet.brut}</span>
                  <span style={S.jetSubLbl}>brut</span>
                </div>
                <div style={S.jetDe}><span style={S.jetNum}>{dernierJet.total}</span><span style={S.jetSubLbl}>total</span></div>
                {dernierJet.dd && <div style={S.jetDe}><span style={S.jetNum}>{dernierJet.dd}</span><span style={S.jetSubLbl}>DD</span></div>}
              </div>
              {dernierJet.critReussite && <div style={{ color: C.gold, textAlign: 'center', fontSize: 12, marginTop: 6 }}>✦ Réussite critique !</div>}
              {dernierJet.critEchec && <div style={{ color: C.red, textAlign: 'center', fontSize: 12, marginTop: 6 }}>✦ Échec critique !</div>}
            </div>
          )}
        </>}
      </aside>

      {/* ── CENTRE ── */}
      <main style={S.centre}>
        <div style={S.fil} ref={filRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ ...S.bulle, ...(m.role === 'user' ? S.bulleJoueur : S.bulleMJ) }}>
              {m.role === 'assistant' && <div style={S.mjLabel}>✦ Maître du Jeu</div>}
              <p style={S.bulleTexte}>{m.content}</p>
            </div>
          ))}
          {loading && (
            <div style={{ ...S.bulle, ...S.bulleMJ }}>
              <div style={S.mjLabel}>✦ Maître du Jeu</div>
              <p style={{ ...S.bulleTexte, color: C.textMuted }}>Le MJ réfléchit…</p>
            </div>
          )}
        </div>
        {erreur && <div style={S.erreur}>{erreur}</div>}
        <div style={S.saisieZone}>
          <textarea style={S.saisie} value={saisie} onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={handleKey} placeholder="Décrivez votre action… (Entrée pour envoyer)"
            disabled={loading || !!modal} rows={3} />
          <button style={{ ...S.sendBtn, opacity: loading || !saisie.trim() ? 0.5 : 1 }}
            onClick={envoyer} disabled={loading || !saisie.trim() || !!modal}>
            <Send size={18} />
          </button>
        </div>
      </main>

      {/* ── COLONNE DROITE ── */}
      <aside style={S.sideRight}>
        <div style={S.rightSection}>
          <div style={S.rightTitle}><ScrollText size={14} /> Quêtes</div>
          <p style={S.rightEmpty}>Aucune quête active.</p>
        </div>
        <div style={S.rightSection}>
          <div style={S.rightTitle}><Swords size={14} /> Inventaire</div>
          <p style={S.rightEmpty}>Inventaire vide.</p>
        </div>
      </aside>

      {/* ── MODALE DÉS ── */}
      {modal && (
        <div style={S.modalOverlay}>
          <div style={S.modalBox}>
            <div style={S.modalEyebrow}>✦ Jet demandé ✦</div>
            <h2 style={S.modalTitre}>{modal.label}</h2>
            {modal.dd && <p style={S.modalDD}>Difficulté : DD {modal.dd}</p>}
            <p style={S.modalSub}>Lance le dé pour connaître ton destin.</p>
            <button style={S.modalBtn} onClick={resoudreJet} disabled={loading}>
              <Dice6 size={20} style={{ marginRight: 8 }} />
              {loading ? 'Le MJ juge…' : 'Lancer le d20'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Derivee({ icon, label, val }) {
  return (
    <div style={S.deriveeCell}>
      {icon}
      <span style={S.deriveeVal}>{val}</span>
      <span style={S.deriveeLbl}>{label}</span>
    </div>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  ::placeholder { color: #4a4a6a; }
  textarea:focus { outline: none; border-color: #4a3a6e !important; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #252a3a; border-radius: 3px; }
`

const S = {
  page: { display: 'grid', gridTemplateColumns: '240px 1fr 220px', height: '100vh', overflow: 'hidden', background: '#0a0b0f', fontFamily: "'Inter', sans-serif", color: '#e8e0f0' },
  centrer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8a8aaa', fontFamily: "'Inter', sans-serif" },
  sideLeft: { display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 14px', background: '#0f1118', borderRight: '1px solid #252a3a', overflowY: 'auto' },
  retour: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #252a3a', borderRadius: 7, color: '#8a8aaa', fontSize: 12, padding: '6px 10px', cursor: 'pointer', marginBottom: 4 },
  persoNom: { fontSize: 18, fontWeight: 600, fontFamily: "'Cinzel', serif", color: '#e8e0f0' },
  persoMeta: { fontSize: 12, color: '#8a8aaa', marginTop: -8 },
  pvBlock: { background: '#13161f', border: '1px solid #252a3a', borderRadius: 10, padding: '12px 14px' },
  pvLbl: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#8a8aaa', marginBottom: 8 },
  pvBar: { height: 6, background: '#1a1e2b', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  pvFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  pvVal: { fontSize: 13, fontWeight: 600, color: '#e8e0f0', textAlign: 'center', fontFamily: "'Cinzel', serif" },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 },
  statCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9px 4px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 8 },
  statVal: { fontSize: 17, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  statMod: { fontSize: 11, color: '#c9a84c', fontFamily: 'monospace' },
  statLbl: { fontSize: 9, color: '#4a4a6a', letterSpacing: 1 },
  derivees: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 },
  deriveeCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 4px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 8 },
  deriveeVal: { fontSize: 15, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  deriveeLbl: { fontSize: 9, color: '#4a4a6a', letterSpacing: 1 },
  jetResume: { background: 'linear-gradient(135deg, #1a1228 0%, #14101c 100%)', border: '1px solid #4a3a6e', borderRadius: 10, padding: '12px 14px' },
  jetResumeTitle: { fontSize: 11, color: '#8a8aaa', textAlign: 'center', letterSpacing: 1, fontFamily: "'Cinzel', serif" },
  jetDe: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  jetNum: { fontSize: 22, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  jetSubLbl: { fontSize: 9, color: '#4a4a6a', letterSpacing: 1 },
  centre: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  fil: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 },
  bulle: { maxWidth: '80%', padding: '14px 18px', borderRadius: 12, lineHeight: 1.65 },
  bulleMJ: { background: '#13161f', border: '1px solid #252a3a', alignSelf: 'flex-start' },
  bulleJoueur: { background: '#3d2f5a', border: '1px solid #4a3a6e', alignSelf: 'flex-end' },
  mjLabel: { fontSize: 10.5, color: '#c9a84c', letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Cinzel', serif" },
  bulleTexte: { margin: 0, fontSize: 15, color: '#e8e0f0', whiteSpace: 'pre-wrap' },
  erreur: { margin: '0 24px 8px', padding: '10px 14px', background: '#2a1010', border: '1px solid #b84040', borderRadius: 8, fontSize: 13, color: '#b84040' },
  saisieZone: { display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid #252a3a', background: '#0f1118' },
  saisie: { flex: 1, padding: '11px 14px', background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 10, color: '#e8e0f0', fontSize: 14, fontFamily: "'Inter', sans-serif", resize: 'none', lineHeight: 1.5 },
  sendBtn: { width: 46, flexShrink: 0, background: 'linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)', border: 'none', borderRadius: 10, color: '#e8e0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sideRight: { display: 'flex', flexDirection: 'column', background: '#0f1118', borderLeft: '1px solid #252a3a', overflowY: 'auto' },
  rightSection: { padding: '16px 14px', borderBottom: '1px solid #252a3a' },
  rightTitle: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#c9a84c', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: 10 },
  rightEmpty: { margin: 0, fontSize: 12.5, color: '#4a4a6a', fontStyle: 'italic' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: 'linear-gradient(180deg, #16111f 0%, #0f1118 100%)', border: '1px solid #4a3a6e', borderRadius: 18, padding: '36px 40px', textAlign: 'center', maxWidth: 360, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.7)' },
  modalEyebrow: { fontSize: 11, letterSpacing: 4, color: '#c9a84c', marginBottom: 14, fontFamily: "'Cinzel', serif" },
  modalTitre: { margin: '0 0 8px', fontSize: 26, fontFamily: "'Cinzel', serif", fontWeight: 600 },
  modalDD: { margin: '0 0 6px', fontSize: 14, color: '#c9a84c' },
  modalSub: { margin: '0 0 24px', fontSize: 13.5, color: '#8a8aaa' },
  modalBtn: { display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)', color: '#1a1206', fontSize: 15, fontWeight: 700, fontFamily: "'Cinzel', serif", cursor: 'pointer' },
}