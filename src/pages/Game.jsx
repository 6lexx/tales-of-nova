import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, Shield, Zap, Star, Swords, ScrollText, Dice6, Send, ChevronLeft, BookOpen, X, GripHorizontal, User, Eye } from 'lucide-react'
import { getCharacter } from '../services/characterService'
import { getOrCreateSession, loadMessages, saveMessage, updateSession } from '../services/sessionService'
import { buildSystemPrompt, sendMessage, parseResponse, buildAdminPrompt, sendAdminMessage } from '../services/claudeService'
import { lancerD20, formatPourIA } from '../services/diceService'
import Narration from '../components/Narration'
import { useAuth } from '../context/AuthContext'

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
// Bonus de maîtrise par niveau (table de progression PHB)
const MAITRISE_NIVEAU = [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6]
const bonusMaitrise = (niv) => MAITRISE_NIVEAU[Math.min(20, Math.max(1, niv || 1)) - 1]

export default function Game() {
  const { id: characterId } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [perso, setPerso] = useState(null)
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [saisie, setSaisie] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [modal, setModal] = useState(null)
  const [dernierJet, setDernierJet] = useState(null)
  const [phaseJet, setPhaseJet] = useState('pret')   // pret | roule | brut | total
  const [affichageDe, setAffichageDe] = useState(null)
  const jetRef = useRef(null)
  const animRef = useRef(null)
  const filRef = useRef(null)

  // Mode admin (inspection) — historique éphémère, jamais persisté
  const [mode, setMode] = useState('mj')          // 'mj' | 'admin'
  const [adminMessages, setAdminMessages] = useState([])

  // Bloc-notes
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTexte, setNoteTexte] = useState('')
  const [notePos, setNotePos] = useState({ x: 80, y: 80 })
  const [noteSize, setNoteSize] = useState({ w: 340, h: 320 })
  const [noteSaving, setNoteSaving] = useState(false)
  const dragRef = useRef(null)
  const saveTimerRef = useRef(null)
  const sessionRef = useRef(null)

  // Fiche personnage flottante
  const [ficheOpen, setFicheOpen] = useState(false)
  const [fichePos, setFichePos] = useState({ x: 260, y: 60 })
  const [ficheTab, setFicheTab] = useState('stats')

  useEffect(() => {
    async function init() {
      try {
        const p = await getCharacter(characterId)
        setPerso(p)
        const s = await getOrCreateSession(characterId)
        setSession(s)
        sessionRef.current = s
        setNoteTexte(s.notes || '')
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
    const t = setTimeout(() => {
      filRef.current?.scrollTo({ top: filRef.current.scrollHeight, behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(t)
  }, [messages, adminMessages, mode, loading])

  useEffect(() => () => clearInterval(animRef.current), [])

  // Sauvegarde des notes avec debounce 1s
  const sauvegarderNotes = useCallback((texte) => {
    clearTimeout(saveTimerRef.current)
    setNoteSaving(true)
    saveTimerRef.current = setTimeout(async () => {
      if (sessionRef.current) {
        await updateSession(sessionRef.current.id, { notes: texte })
      }
      setNoteSaving(false)
    }, 1000)
  }, [])

  const onNoteChange = (e) => {
    setNoteTexte(e.target.value)
    sauvegarderNotes(e.target.value)
  }

  // Drag de la fenêtre bloc-notes
  const startDrag = (e) => {
    e.preventDefault()
    const startX = e.clientX - notePos.x
    const startY = e.clientY - notePos.y
    const onMove = (ev) => setNotePos({ x: ev.clientX - startX, y: ev.clientY - startY })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Redimensionnement du bloc-notes (poignée coin bas-droit)
  const startResize = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX, startY = e.clientY
    const { w: startW, h: startH } = noteSize
    const onMove = (ev) => setNoteSize({
      w: Math.max(240, startW + (ev.clientX - startX)),
      h: Math.max(200, startH + (ev.clientY - startY)),
    })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Drag de la fenêtre fiche personnage
  const startDragFiche = (e) => {
    e.preventDefault()
    const startX = e.clientX - fichePos.x
    const startY = e.clientY - fichePos.y
    const onMove = (ev) => setFichePos({ x: ev.clientX - startX, y: ev.clientY - startY })
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function lancerPremierMessage(p, s) {
    const system = buildSystemPrompt(p, s)
    const intro = [{ role: 'user', content: "L'aventure commence." }]
    const texte = await sendMessage(intro, system)
    const { texte: affichage, jet } = parseResponse(texte)
    const msgMJ = { role: 'assistant', content: affichage }
    setMessages([msgMJ])
    await saveMessage(s.id, 'assistant', affichage)
    if (jet) ouvrirJet(jet)
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
      if (jet) ouvrirJet(jet)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Envoi en mode inspection — bypass total : pas de persistance, pas de parseResponse,
  // pas de jet. Le contexte de narration sert de lecture ; le fil admin reste éphémère.
  async function envoyerAdmin() {
    if (!saisie.trim() || loading) return
    const contenu = saisie.trim()
    setSaisie('')
    setErreur('')
    const nouveaux = [...adminMessages, { role: 'user', content: contenu }]
    setAdminMessages(nouveaux)
    setLoading(true)
    try {
      const system = buildAdminPrompt(perso, session)
      const historique = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        ...nouveaux.map((m) => ({ role: m.role, content: m.content })),
      ]
      const texte = await sendAdminMessage(historique, system)
      setAdminMessages((prev) => [...prev, { role: 'assistant', content: texte }])
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Ouvre un jet (réinitialise l'état d'animation)
  function ouvrirJet(jet) {
    setModal(jet)
    setPhaseJet('pret')
    setAffichageDe(null)
  }

  // Lance le dé avec une petite mise en scène
  function lancerLeDe() {
    if (!modal || !perso || phaseJet !== 'pret') return
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
    const modificateur = mod(valeur) + bonusMaitrise(perso.niveau)
    const jet = lancerD20(modificateur)
    jetRef.current = { ...jet, modificateur, label: modal.label, dd: modal.dd }

    // Animation : défilement de valeurs (~770 ms)
    setPhaseJet('roule')
    let ticks = 0
    clearInterval(animRef.current)
    animRef.current = setInterval(() => {
      setAffichageDe(1 + Math.floor(Math.random() * 20))
      ticks += 1
      if (ticks >= 11) {
        clearInterval(animRef.current)
        setAffichageDe(jet.brut)
        setPhaseJet('brut')
        setTimeout(() => setPhaseJet('total'), 500)   // le bonus apparaît à côté
        setTimeout(() => finaliserJet(), 1500)        // puis on envoie au MJ
      }
    }, 70)
  }

  // Envoie le résultat au MJ et enchaîne la narration
  async function finaliserJet() {
    const jet = jetRef.current
    if (!jet) return
    setDernierJet({ brut: jet.brut, total: jet.total, critEchec: jet.critEchec, critReussite: jet.critReussite, label: jet.label, dd: jet.dd })
    setModal(null)
    setPhaseJet('pret')
    setAffichageDe(null)

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
      if (prochainJet) ouvrirJet(prochainJet)
    } catch (e) {
      setErreur(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onSend = () => (mode === 'admin' ? envoyerAdmin() : envoyer())

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend() }
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
        <button style={S.retour} onClick={() => navigate('/campagnes')}>
          <ChevronLeft size={15} /> Campagnes
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
            <Derivee icon={<Star size={13} color={C.violet} />} label="Maîtrise" val={fmtMod(bonusMaitrise(perso.niveau))} />
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
          {isAdmin && (
            <button
              style={{ ...S.modeBtn, ...(mode === 'admin' ? S.modeBtnActive : {}) }}
              onClick={() => setMode((m) => (m === 'admin' ? 'mj' : 'admin'))}
            >
              <Eye size={13} />
              {mode === 'admin' ? "Quitter l'inspection" : 'Mode inspection'}
            </button>
          )}
          <button style={S.ficheBtn} onClick={() => setFicheOpen((v) => !v)}>
            <User size={13} />
            {ficheOpen ? 'Fermer la fiche' : 'Consulter la fiche'}
          </button>
        </>}
      </aside>

      {/* ── CENTRE ── */}
      <main style={S.centre}>
        <div style={S.fil} ref={filRef}>
          {mode === 'admin' ? (
            <>
              <div style={S.adminBanner}>
                <Eye size={13} style={{ marginRight: 6, flexShrink: 0 }} />
                Inspection — hors-jeu, lecture seule. Fil éphémère (non sauvegardé), n'altère jamais la partie.
              </div>
              {adminMessages.length === 0 && !loading && (
                <p style={{ ...S.bulleTexte, color: C.textMuted, fontStyle: 'italic' }}>
                  Interroge le MJ sur la scène courante : intentions des PNJ, DD envisagés, embranchements prévus…
                </p>
              )}
              {adminMessages.map((m, i) => (
                <div key={i} style={{ ...S.bulle, ...(m.role === 'user' ? S.bulleJoueur : S.bulleAdmin) }}>
                  {m.role === 'assistant' && <div style={S.adminLabel}>✦ Inspection MJ</div>}
                  <p style={S.bulleTexte}>{m.content}</p>
                </div>
              ))}
              {loading && (
                <div style={{ ...S.bulle, ...S.bulleAdmin }}>
                  <div style={S.adminLabel}>✦ Inspection MJ</div>
                  <p style={{ ...S.bulleTexte, color: C.textMuted }}>Analyse…</p>
                </div>
              )}
            </>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} style={{ ...S.bulle, ...(m.role === 'user' ? S.bulleJoueur : S.bulleMJ) }}>
                  {m.role === 'assistant' && <div style={S.mjLabel}>✦ Maître du Jeu</div>}
                  {m.role === 'assistant'
                    ? <div style={S.bulleTexte}><Narration text={m.content} /></div>
                    : <p style={S.bulleTexte}>{m.content}</p>}
                </div>
              ))}
              {loading && (
                <div style={{ ...S.bulle, ...S.bulleMJ }}>
                  <div style={S.mjLabel}>✦ Maître du Jeu</div>
                  <p style={{ ...S.bulleTexte, color: C.textMuted }}>Le MJ réfléchit…</p>
                </div>
              )}
            </>
          )}
        </div>
        {erreur && <div style={S.erreur}>{erreur}</div>}

        {/* ── PANNEAU DE DÉS (ancré, non bloquant) ── */}
        {mode === 'mj' && modal && (
          <div style={S.diceDock}>
            <div style={S.diceInfo}>
              <span style={S.diceTitre}>Jet de {modal.label}</span>
              {modal.dd && <span style={S.diceDD}>DD {modal.dd}</span>}
            </div>

            {phaseJet === 'pret' ? (
              <button style={S.diceBtn} onClick={lancerLeDe}>
                <Dice6 size={18} style={{ marginRight: 8 }} /> Lancer le d20
              </button>
            ) : (
              <div style={S.diceResultat}>
                <div style={{ ...S.diceBrut, color:
                  (phaseJet !== 'roule' && jetRef.current?.critReussite) ? C.gold :
                  (phaseJet !== 'roule' && jetRef.current?.critEchec) ? C.red : C.textPrime,
                  opacity: phaseJet === 'roule' ? 0.6 : 1 }}>
                  {affichageDe}
                </div>
                {phaseJet === 'total' && (
                  <>
                    <span style={S.dicePlus}>{fmtMod(jetRef.current.modificateur)}</span>
                    <span style={S.diceEgal}>=</span>
                    <span style={S.diceTotal}>{jetRef.current.total}</span>
                    {jetRef.current.critReussite && <span style={S.diceCritR}>réussite critique</span>}
                    {jetRef.current.critEchec && <span style={S.diceCritE}>échec critique</span>}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div style={S.saisieZone}>
          <textarea style={S.saisie} value={saisie} onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={handleKey}
            placeholder={mode === 'admin' ? 'Interroge le MJ hors-jeu… (Entrée pour envoyer)' : 'Décrivez votre action… (Entrée pour envoyer)'}
            disabled={loading || (mode === 'mj' && !!modal)} rows={3} />
          <button style={{ ...S.sendBtn, ...(mode === 'admin' ? S.sendBtnAdmin : {}), opacity: loading || !saisie.trim() ? 0.5 : 1 }}
            onClick={onSend} disabled={loading || !saisie.trim() || (mode === 'mj' && !!modal)}>
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
        <div style={S.rightSection}>
          <button style={S.noteBtn} onClick={() => setNoteOpen((v) => !v)}>
            <BookOpen size={14} />
            {noteOpen ? 'Fermer les notes' : 'Bloc-notes'}
          </button>
        </div>
      </aside>

      {/* ── BLOC-NOTES FLOTTANT ── */}
      {noteOpen && (
        <div style={{ ...S.noteWindow, left: notePos.x, top: notePos.y, width: noteSize.w, height: noteSize.h }} ref={dragRef}>
          <div style={S.noteTitleBar} onMouseDown={startDrag}>
            <span style={S.noteTitleTxt}><GripHorizontal size={13} style={{ marginRight: 6, opacity: 0.5 }} />Bloc-notes</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {noteSaving && <span style={S.noteSaving}>Sauvegarde…</span>}
              <button style={S.noteClose} onClick={() => setNoteOpen(false)}><X size={14} /></button>
            </div>
          </div>
          <textarea
            style={S.noteArea}
            value={noteTexte}
            onChange={onNoteChange}
            placeholder="Tes notes de campagne, PNJ rencontrés, indices…"
            spellCheck={false}
          />
          <div style={S.noteResizeGrip} onMouseDown={startResize} title="Redimensionner">
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ display: 'block' }}>
              <path d="M11 5 L5 11 M11 8.5 L8.5 11" stroke="#6a6a8a" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}

      {/* ── FICHE PERSONNAGE FLOTTANTE ── */}
      {ficheOpen && perso && (
        <div style={{ ...S.ficheWindow, left: fichePos.x, top: fichePos.y }}>
          {/* Barre de titre draggable */}
          <div style={S.ficheTitleBar} onMouseDown={startDragFiche}>
            <span style={S.ficheTitleTxt}><GripHorizontal size={13} style={{ marginRight: 6, opacity: 0.5 }} />{perso.nom}</span>
            <button style={S.noteClose} onClick={() => setFicheOpen(false)}><X size={14} /></button>
          </div>
          {/* Onglets */}
          <div style={S.ficheTabs}>
            {[['stats', 'Stats'], ['competences', 'Compétences'], ['histoire', 'Histoire'], ['classe', 'Classe']].map(([id, lbl]) => (
              <button key={id} style={{ ...S.ficheTab, ...(ficheTab === id ? S.ficheTabActive : {}) }}
                onClick={() => setFicheTab(id)}>{lbl}</button>
            ))}
          </div>
          {/* Contenu */}
          <div style={S.ficheBody}>

            {/* STATS */}
            {ficheTab === 'stats' && (
              <div style={S.ficheCol}>
                <div style={S.ficheSection}>
                  <div style={S.ficheSectionTitle}>Identité</div>
                  <Row label="Espèce" val={perso.espece} />
                  <Row label="Classe" val={perso.classe} />
                  <Row label="Niveau" val={perso.niveau} />
                  {perso.fiche?.alignement && <Row label="Alignement" val={perso.fiche.alignement} />}
                  {perso.historique && <Row label="Historique" val={perso.historique} />}
                </div>
                <div style={S.ficheSection}>
                  <div style={S.ficheSectionTitle}>Caractéristiques</div>
                  <div style={S.ficheStatsGrid}>
                    {[['FOR', perso.force], ['DEX', perso.dexterite], ['CON', perso.constitution],
                      ['INT', perso.intelligence], ['SAG', perso.sagesse], ['CHA', perso.charisme]].map(([lbl, val]) => (
                      <div key={lbl} style={S.ficheStatCell}>
                        <span style={S.ficheStatVal}>{val ?? '—'}</span>
                        <span style={S.ficheStatMod}>{val ? fmtMod(mod(val)) : '—'}</span>
                        <span style={S.ficheStatLbl}>{lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.ficheSection}>
                  <div style={S.ficheSectionTitle}>Stats dérivées</div>
                  <Row label="Points de vie" val={`${perso.pv_actuels} / ${perso.pv_max}`} />
                  <Row label="Classe d'armure" val={10 + mod(perso.dexterite || 10)} />
                  <Row label="Initiative" val={fmtMod(mod(perso.dexterite || 10))} />
                  <Row label="Maîtrise" val={fmtMod(bonusMaitrise(perso.niveau))} />
                  <Row label="Perception passive" val={10 + mod(perso.sagesse || 10)} />
                  <Row label="Vitesse" val="9 m" />
                </div>
                {perso.fiche?.langues?.length > 0 && (
                  <div style={S.ficheSection}>
                    <div style={S.ficheSectionTitle}>Langues</div>
                    <p style={S.fichePara}>{perso.fiche.langues.join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {/* COMPÉTENCES */}
            {ficheTab === 'competences' && (
              <div style={S.ficheCol}>
                {perso.fiche?.competences?.length > 0 && (
                  <div style={S.ficheSection}>
                    <div style={S.ficheSectionTitle}>Compétences maîtrisées</div>
                    <div style={S.ficheChips}>
                      {perso.fiche.competences.map((c) => (
                        <span key={c} style={S.ficheChip}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={S.ficheSection}>
                  <div style={S.ficheSectionTitle}>Jets de sauvegarde maîtrisés</div>
                  {(() => {
                    const SAUV = { guerrier: ['FOR', 'CON'], mage: ['INT', 'SAG'], voleur: ['DEX', 'INT'], clerc: ['SAG', 'CHA'] }
                    const sauv = SAUV[(perso.classe || '').toLowerCase()] || []
                    return sauv.length > 0
                      ? <div style={S.ficheChips}>{sauv.map((s) => <span key={s} style={S.ficheChipGold}>{s}</span>)}</div>
                      : <p style={S.fichePara}>—</p>
                  })()}
                </div>
                {perso.fiche?.personnalite && Object.values(perso.fiche.personnalite).some(Boolean) && (
                  <div style={S.ficheSection}>
                    <div style={S.ficheSectionTitle}>Personnalité</div>
                    {[['trait', 'Trait'], ['ideal', 'Idéal'], ['lienPerso', 'Lien'], ['defaut', 'Défaut']].map(([k, lbl]) =>
                      perso.fiche.personnalite[k] ? <Row key={k} label={lbl} val={perso.fiche.personnalite[k]} multiline /> : null
                    )}
                  </div>
                )}
              </div>
            )}

            {/* HISTOIRE */}
            {ficheTab === 'histoire' && (
              <div style={S.ficheCol}>
                {perso.fiche?.themes?.length > 0 && (
                  <div style={S.ficheSection}>
                    <div style={S.ficheSectionTitle}>Thèmes narratifs</div>
                    <div style={S.ficheChips}>
                      {perso.fiche.themes.map((t) => <span key={t} style={S.ficheChipGold}>{t}</span>)}
                    </div>
                  </div>
                )}
                {perso.fiche?.histoire && (
                  <div style={S.ficheSection}>
                    {[
                      ['origine', 'Origine'],
                      ['declencheur', 'Évènement déclencheur'],
                      ['motivation', 'Motivation'],
                      ['lien', 'Lien vivant'],
                      ['secret', 'Secret / Fardeau'],
                      ['faille', 'Peur / Faille'],
                    ].map(([k, lbl]) =>
                      perso.fiche.histoire[k]
                        ? <div key={k} style={{ marginBottom: 14 }}>
                            <div style={S.ficheRowLabel}>{lbl}</div>
                            <p style={S.fichePara}>{perso.fiche.histoire[k]}</p>
                          </div>
                        : null
                    )}
                  </div>
                )}
                {!perso.fiche?.histoire && <p style={{ color: '#4a4a6a', fontSize: 13, fontStyle: 'italic' }}>Aucune histoire renseignée.</p>}
              </div>
            )}

            {/* CLASSE */}
            {ficheTab === 'classe' && (
              <div style={S.ficheCol}>
                <div style={S.ficheSection}>
                  <div style={S.ficheSectionTitle}>{perso.classe ?? '—'}</div>
                  {(() => {
                    const INFO = {
                      guerrier: { de: 'd10', prim: 'FOR / DEX', desc: 'Maître des armes et des armures. Combat polyvalent, résistance hors pair.', capacites: ['Second souffle (1/repos court)', 'Style de combat', 'Fougue (niv. 2)'] },
                      mage: { de: 'd6', prim: 'INT', desc: 'Érudit des arcanes. Façonne la réalité par la puissance de l\'esprit.', capacites: ['Récupération arcanique (niv. 1)', 'Tradition arcanique (niv. 2)', 'Sorts préparés = INT + niveau'] },
                      voleur: { de: 'd8', prim: 'DEX', desc: 'Expert de la discrétion et de la précision. Frappe vite, disparaît vite.', capacites: ['Expertise (×2 maîtrise sur 2 compétences)', 'Attaque sournoise', 'Argot des voleurs'] },
                      clerc: { de: 'd8', prim: 'SAG', desc: 'Canal de la volonté divine. Soutien, soin, et foudre sacrée.', capacites: ['Sorts divins (SAG)', 'Domaine divin (niv. 1)', 'Renvoi des morts-vivants'] },
                    }
                    const info = INFO[(perso.classe || '').toLowerCase()]
                    if (!info) return <p style={S.fichePara}>Informations non disponibles.</p>
                    return <>
                      <Row label="Dé de vie" val={info.de} />
                      <Row label="Caractéristique primaire" val={info.prim} />
                      <p style={{ ...S.fichePara, marginTop: 10 }}>{info.desc}</p>
                      <div style={{ ...S.ficheSectionTitle, marginTop: 14 }}>Capacités de classe</div>
                      {info.capacites.map((cap) => (
                        <div key={cap} style={S.ficheCapacite}>
                          <span style={{ color: '#c9a84c', marginRight: 8 }}>✦</span>{cap}
                        </div>
                      ))}
                    </>
                  })()}
                </div>
                {perso.fiche?.apparence?.desc && (
                  <div style={S.ficheSection}>
                    <div style={S.ficheSectionTitle}>Apparence</div>
                    <p style={S.fichePara}>{perso.fiche.apparence.desc}</p>
                  </div>
                )}
              </div>
            )}

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

function Row({ label, val, multiline }) {
  return (
    <div style={S.ficheRow}>
      <span style={S.ficheRowLabel}>{label}</span>
      {multiline
        ? <span style={{ ...S.ficheRowVal, textAlign: 'left', maxWidth: '65%', color: '#c8c0d8', fontStyle: 'italic' }}>{val}</span>
        : <span style={S.ficheRowVal}>{val}</span>}
    </div>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cinzel+Decorative:wght@700&family=EB+Garamond:ital@0;1&family=Grenze+Gotisch:wght@500&family=Inter:wght@400;500;600&display=swap');
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
  // Panneau de dés ancré
  diceDock: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: '0 20px 10px', padding: '12px 18px', background: 'linear-gradient(135deg, #1a1228 0%, #14101c 100%)', border: '1px solid #4a3a6e', borderRadius: 12 },
  diceInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  diceTitre: { fontSize: 14, fontFamily: "'Cinzel', serif", color: '#e8e0f0' },
  diceDD: { fontSize: 12, color: '#c9a84c' },
  diceBtn: { display: 'inline-flex', alignItems: 'center', padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)', color: '#1a1206', fontSize: 14.5, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 0.5, cursor: 'pointer', boxShadow: '0 4px 16px rgba(201,168,76,.25)' },
  diceResultat: { display: 'flex', alignItems: 'center', gap: 12 },
  diceBrut: { fontSize: 34, fontWeight: 700, fontFamily: "'Cinzel', serif", minWidth: 44, textAlign: 'center', transition: 'color .2s' },
  dicePlus: { fontSize: 17, color: '#8a8aaa', fontFamily: 'monospace' },
  diceEgal: { fontSize: 15, color: '#4a4a6a' },
  diceTotal: { fontSize: 26, fontWeight: 700, color: '#c9a84c', fontFamily: "'Cinzel', serif" },
  diceCritR: { fontSize: 11, color: '#c9a84c', fontFamily: "'Cinzel', serif", letterSpacing: 1, marginLeft: 4 },
  diceCritE: { fontSize: 11, color: '#b84040', fontFamily: "'Cinzel', serif", letterSpacing: 1, marginLeft: 4 },
  saisie: { flex: 1, padding: '11px 14px', background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 10, color: '#e8e0f0', fontSize: 14, fontFamily: "'Inter', sans-serif", resize: 'none', lineHeight: 1.5 },
  sendBtn: { width: 46, flexShrink: 0, background: 'linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)', border: 'none', borderRadius: 10, color: '#e8e0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  sideRight: { display: 'flex', flexDirection: 'column', background: '#0f1118', borderLeft: '1px solid #252a3a', overflowY: 'auto' },
  rightSection: { padding: '16px 14px', borderBottom: '1px solid #252a3a' },
  rightTitle: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#c9a84c', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: 10 },
  rightEmpty: { margin: 0, fontSize: 12.5, color: '#4a4a6a', fontStyle: 'italic' },
  noteBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 8, color: '#8a8aaa', fontSize: 13, cursor: 'pointer' },
  ficheBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: '#1a1e2b', border: '1px solid #4a3a6e', borderRadius: 8, color: '#c9a84c', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  modeBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: '#1a1e2b', border: '1px solid #6b5520', borderRadius: 8, color: '#c9a84c', fontSize: 13, cursor: 'pointer', marginTop: 4 },
  modeBtnActive: { background: 'linear-gradient(135deg, #2a1e0a 0%, #1a1206 100%)', border: '1px solid #c9a84c', color: '#e8c96a' },
  adminBanner: { display: 'flex', alignItems: 'center', padding: '9px 14px', background: '#1a160f', border: '1px solid #6b5520', borderRadius: 8, color: '#c9a84c', fontSize: 12, letterSpacing: 0.3, lineHeight: 1.4 },
  bulleAdmin: { background: '#141018', border: '1px dashed #6b5520', alignSelf: 'flex-start' },
  adminLabel: { fontSize: 10.5, color: '#c9a84c', letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Cinzel', serif" },
  sendBtnAdmin: { background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)' },
  // Fiche flottante
  ficheWindow: { position: 'fixed', zIndex: 190, width: 400, maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #16111f 0%, #0f1118 100%)', border: '1px solid #4a3a6e', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,.8)', overflow: 'hidden' },
  ficheTitleBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#1a1228', borderBottom: '1px solid #252a3a', cursor: 'grab', userSelect: 'none', flexShrink: 0 },
  ficheTitleTxt: { display: 'flex', alignItems: 'center', fontSize: 13, color: '#c9a84c', fontFamily: "'Cinzel', serif", letterSpacing: 1, fontWeight: 600 },
  ficheTabs: { display: 'flex', borderBottom: '1px solid #252a3a', background: '#13161f', flexShrink: 0 },
  ficheTab: { flex: 1, padding: '9px 4px', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', color: '#8a8aaa', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  ficheTabActive: { color: '#c9a84c', borderBottom: '2px solid #c9a84c', background: '#0f1118' },
  ficheBody: { overflowY: 'auto', flex: 1, padding: '16px' },
  ficheCol: { display: 'flex', flexDirection: 'column', gap: 0 },
  ficheSection: { marginBottom: 18 },
  ficheSectionTitle: { fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: '#7b5ea7', fontFamily: "'Cinzel', serif", marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #252a3a' },
  ficheRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '5px 0', borderBottom: '1px solid #1a1e2b' },
  ficheRowLabel: { fontSize: 12, color: '#8a8aaa', flexShrink: 0 },
  ficheRowVal: { fontSize: 13, color: '#e8e0f0', textAlign: 'right', maxWidth: '60%' },
  ficheRowValMulti: { fontSize: 13, color: '#e8e0f0', marginTop: 4, lineHeight: 1.55 },
  ficheStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginTop: 6 },
  ficheStatCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 8 },
  ficheStatVal: { fontSize: 19, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  ficheStatMod: { fontSize: 11, color: '#c9a84c', fontFamily: 'monospace' },
  ficheStatLbl: { fontSize: 9, color: '#4a4a6a', letterSpacing: 1 },
  ficheChips: { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  ficheChip: { padding: '4px 10px', borderRadius: 14, background: '#1a1e2b', border: '1px solid #252a3a', color: '#8a8aaa', fontSize: 12 },
  ficheChipGold: { padding: '4px 10px', borderRadius: 14, background: '#1a160f', border: '1px solid #6b5520', color: '#c9a84c', fontSize: 12 },
  fichePara: { margin: '4px 0 0', fontSize: 13, color: '#8a8aaa', lineHeight: 1.6 },
  ficheCapacite: { display: 'flex', alignItems: 'flex-start', fontSize: 13, color: '#e8e0f0', padding: '6px 0', borderBottom: '1px solid #1a1e2b' },
  // Bloc-notes flottant
  noteWindow: { position: 'fixed', zIndex: 200, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #16111f 0%, #0f1118 100%)', border: '1px solid #4a3a6e', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.7)', overflow: 'hidden' },
  noteTitleBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#1a1228', borderBottom: '1px solid #252a3a', cursor: 'grab', userSelect: 'none', flexShrink: 0 },
  noteTitleTxt: { display: 'flex', alignItems: 'center', fontSize: 12, color: '#c9a84c', fontFamily: "'Cinzel', serif", letterSpacing: 1 },
  noteSaving: { fontSize: 11, color: '#4a4a6a', fontStyle: 'italic' },
  noteClose: { background: 'none', border: 'none', color: '#8a8aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 },
  noteArea: { flex: 1, minHeight: 0, padding: '14px 16px', background: 'transparent', border: 'none', color: '#e8e0f0', fontSize: 13.5, fontFamily: "'Inter', sans-serif", lineHeight: 1.65, resize: 'none', outline: 'none', overflowY: 'auto', overflowX: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  noteResizeGrip: { position: 'absolute', right: 3, bottom: 3, width: 16, height: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', cursor: 'nwse-resize', padding: 2, opacity: 0.7 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: 'linear-gradient(180deg, #16111f 0%, #0f1118 100%)', border: '1px solid #4a3a6e', borderRadius: 18, padding: '36px 40px', textAlign: 'center', maxWidth: 360, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,.7)' },
  modalEyebrow: { fontSize: 11, letterSpacing: 4, color: '#c9a84c', marginBottom: 14, fontFamily: "'Cinzel', serif" },
  modalTitre: { margin: '0 0 8px', fontSize: 26, fontFamily: "'Cinzel', serif", fontWeight: 600 },
  modalDD: { margin: '0 0 6px', fontSize: 14, color: '#c9a84c' },
  modalSub: { margin: '0 0 24px', fontSize: 13.5, color: '#8a8aaa' },
  modalBtn: { display: 'inline-flex', alignItems: 'center', padding: '14px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)', color: '#1a1206', fontSize: 15, fontWeight: 700, fontFamily: "'Cinzel', serif", cursor: 'pointer' },
}