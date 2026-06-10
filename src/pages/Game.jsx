import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import * as claudeService from '../services/claudeService'
import { applyMjActions } from '../services/mjTagParser'
import * as statusService from '../services/statusService'
import * as progressionService from '../services/progressionService'
import * as codexService from '../services/codexService'

export default function Game() {
  const { id } = useParams()            // id = character_id (selon ton routing actuel)
  const navigate = useNavigate()

  const [campaignId, setCampaignId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])   // {role, content}
  const [input, setInput] = useState('')
  const [pendingJet, setPendingJet] = useState(null)  // {label, dd} en attente
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  // --- Chargement initial : campagne active + session courante du perso ---
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // campagne active de ce personnage
      const { data: camp } = await supabase
        .from('campaigns')
        .select('id')
        .eq('character_id', id)
        .eq('status', 'active')
        .maybeSingle()
      if (cancelled || !camp) return
      setCampaignId(camp.id)

      // dernière session, sinon on en crée une
      let { data: sess } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('campaign_id', camp.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!sess) {
        const { data: created } = await supabase
          .from('game_sessions')
          .insert({ campaign_id: camp.id })
          .select('id')
          .single()
        sess = created
      }
      if (cancelled) return
      setSessionId(sess.id)

      // historique de la session
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content')
        .eq('session_id', sess.id)
        .order('created_at')
      if (!cancelled) setMessages(msgs ?? [])
    })()
    return () => { cancelled = true }
  }, [id])

  // auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy])

  // --- Envoi d'un tour ---
  async function send(playerText, jetResult = null) {
    if (!sessionId || busy) return
    setBusy(true)

    // 1. message joueur (texte ou résultat de jet)
    const userContent = jetResult
      ? `[RESULTAT_JET: brut:${jetResult.brut} | total:${jetResult.total}]`
      : playerText

    const userMsg = { role: 'user', content: userContent }
    setMessages((m) => [...m, userMsg])
    await supabase.from('messages').insert({
      session_id: sessionId, role: 'user', content: userContent,
    })

    try {
      // 2. appel MJ — ADAPTE selon la vraie signature de sendMessage.
      //    On suppose qu'il prend l'historique et renvoie le texte brut.
      const raw = await claudeService.sendMessage({
        characterId: id,
        campaignId,
        sessionId,
        history: [...messages, userMsg],
      })

      // 3. parsing : texte affichable + jet éventuel + actions mécaniques
      const { texte, jet, actions } = claudeService.parseResponse(raw)

      // 4. exécution des effets mécaniques
      if (actions?.length) {
        await applyMjActions(
          actions,
          {
            characterId: id,
            campaignId,
            sessionId,
            invokeClaude: claudeService.invokeRaw, // util JSON pour le recap — voir note
          },
          { statusService, progressionService, codexService }
        )
      }

      // 5. affichage + persistance de la réponse MJ
      const mjMsg = { role: 'assistant', content: texte }
      setMessages((m) => [...m, mjMsg])
      await supabase.from('messages').insert({
        session_id: sessionId, role: 'assistant', content: texte,
      })

      // 6. si un jet est demandé, on bascule en attente de jet
      if (jet) setPendingJet(jet)
    } catch (err) {
      console.error('Tour MJ —', err)
      setMessages((m) => [...m, {
        role: 'assistant',
        content: '⚠️ Le fil de la narration s’est rompu un instant. Réessaie.',
      }])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit() {
    const t = input.trim()
    if (!t) return
    setInput('')
    send(t)
  }

  // À remplacer par ton vrai composant de dé 3D (diceService).
  // Ici : résolution minimale pour boucler la mécanique.
  function resolveJet() {
    const brut = 1 + Math.floor(Math.random() * 20)
    const total = brut // + modificateur réel à injecter
    setPendingJet(null)
    send(null, { brut, total })
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Personnages</button>
      </header>

      <div ref={scrollRef} className="narration">
        {messages.map((m, i) => (
          <p key={i} className={m.role === 'user' ? 'msg-user' : 'msg-mj'}>
            {m.content}
          </p>
        ))}
        {busy && <p className="msg-mj muted">…</p>}
      </div>

      {pendingJet ? (
        <div className="jet-bar">
          <span>Jet demandé : {pendingJet.label}
            {pendingJet.dd ? ` (DD ${pendingJet.dd})` : ''}</span>
          <button className="btn" onClick={resolveJet} disabled={busy}>
            Lancer le dé
          </button>
        </div>
      ) : (
        <div className="input-bar">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            placeholder="Que fais-tu ?"
            disabled={busy}
          />
          <button className="btn" onClick={onSubmit} disabled={busy}>Agir</button>
        </div>
      )}
    </div>
  )
}
