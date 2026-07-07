import { useState, useEffect, useCallback } from 'react'
import { X, GripHorizontal, ChevronDown, ChevronRight, Trash2, Plus, Minus } from 'lucide-react'
import {
  listerInventaire, equiper, desequiper, majQuantite, retirer, majBourse, getBourse, ajouter,
} from '../services/inventaireService'
import { ARMES } from '../data/equipement/armes.js'
import { ARMURES } from '../data/equipement/armures.js'
import { OBJETS_COMMUNS } from '../data/equipement/objets_communs.js'
import { supabase } from '../lib/supabase'

// Fenêtre flottante draggable : Sac + Équipement + bourse.
// Props : { perso, bourse, onBourse, refreshKey, onClose }
export default function Inventaire({ perso, bourse: bourseProp, onBourse, refreshKey, onClose }) {
  const characterId = perso?.id
  const [rows, setRows] = useState([])
  const [onglet, setOnglet] = useState('sac')
  const [ouverts, setOuverts] = useState({})            // descriptions dépliées
  const [bourse, setBourse] = useState(bourseProp || getBourse(perso?.fiche))
  const [pos, setPos] = useState({ x: 200, y: 90 })

  const recharger = useCallback(async () => {
    if (!characterId) return
    try { setRows(await listerInventaire(characterId)) } catch (e) { console.error('inventaire —', e) }
  }, [characterId])

  useEffect(() => { recharger() }, [recharger, refreshKey])
  // Bourse mise à jour par le MJ (loot/or) → resync depuis le parent.
  useEffect(() => { if (bourseProp) setBourse(bourseProp) }, [bourseProp])

  const startDrag = (e) => {
    e.preventDefault()
    const dx = e.clientX - pos.x, dy = e.clientY - pos.y
    const move = (ev) => setPos({ x: ev.clientX - dx, y: ev.clientY - dy })
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }

  /* ── Équipement ── */
  const equipeDe = (emp) => rows.find((r) => r.equipe && r.emplacement === emp)
  const accessoiresEquipes = rows.filter((r) => r.equipe && r.emplacement === 'accessoire')

  async function basculer(item, emplacement) {
    try {
      if (item.equipe && item.emplacement === emplacement) {
        await desequiper(characterId, item.id)
      } else {
        if (['armure', 'main', 'off', 'bouclier'].includes(emplacement)) {
          const actuel = rows.find((r) => r.equipe && r.emplacement === emplacement)
          if (actuel && actuel.id !== item.id) await desequiper(characterId, actuel.id)
        }
        await equiper(characterId, item.id, emplacement)
      }
      await recharger()
    } catch (e) { console.error('equip —', e) }
  }

  /* ── Sac ── */
  async function ajusterQte(item, delta) {
    await majQuantite(item.id, item.quantite + delta)
    await recharger()
  }
  async function supprimer(item) { await retirer(item.id); await recharger() }

  /* ── Bourse ── */
  async function commitBourse(champ, valeur) {
    const v = Math.max(0, parseInt(valeur, 10) || 0)
    const nb = { ...bourse, [champ]: v }
    setBourse(nb)
    try { await majBourse(characterId, nb); onBourse?.(nb) } catch (e) { console.error('bourse —', e) }
  }

  const candidats = {
    armure: rows.filter((r) => r.categorie === 'armure' && r.ref !== 'bouclier'),
    bouclier: rows.filter((r) => r.ref === 'bouclier'),
    main: rows.filter((r) => r.categorie === 'arme'),
    off: rows.filter((r) => r.categorie === 'arme'),
    accessoire: rows.filter((r) => r.categorie === 'objet_magique'),
  }

  return (
    <div style={{ ...S.win, left: pos.x, top: pos.y }}>
      <div style={S.bar} onMouseDown={startDrag}>
        <span style={S.titre}><GripHorizontal size={13} style={{ marginRight: 6, opacity: 0.5 }} />Inventaire — {perso?.nom}</span>
        <button style={S.close} onClick={onClose}><X size={14} /></button>
      </div>

      {/* Bourse permanente */}
      <div style={S.bourse}>
        {[['po', 'Or', '#c9a84c'], ['pa', 'Argent', '#b8c0cc'], ['pc', 'Cuivre', '#b87333']].map(([k, lbl, col]) => (
          <div key={k} style={S.piece}>
            <span style={{ ...S.pieceDot, background: col }} />
            <input type="number" min="0" value={bourse[k]} onChange={(e) => setBourse({ ...bourse, [k]: e.target.value })}
              onBlur={(e) => commitBourse(k, e.target.value)} style={S.pieceInput} />
            <span style={S.pieceLbl}>{lbl}</span>
          </div>
        ))}
      </div>

      <div style={S.onglets}>
        <button style={{ ...S.onglet, ...(onglet === 'sac' ? S.ongletOn : {}) }} onClick={() => setOnglet('sac')}>Sac</button>
        <button style={{ ...S.onglet, ...(onglet === 'equip' ? S.ongletOn : {}) }} onClick={() => setOnglet('equip')}>Équipement</button>
      </div>

      <div style={S.corps}>
        {onglet === 'sac' && (
          rows.length === 0
            ? <p style={S.vide}>Sac vide.</p>
            : rows.map((it) => (
              <div key={it.id} style={S.ligne}>
                <div style={S.ligneHaut}>
                  {it.description
                    ? <button style={S.chevron} onClick={() => setOuverts((o) => ({ ...o, [it.id]: !o[it.id] }))}>
                        {ouverts[it.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </button>
                    : <span style={{ width: 19 }} />}
                  <span style={S.nom}>{it.nom}{it.equipe && <span style={S.tagEquipe}>équipé</span>}</span>
                  <div style={S.qteBloc}>
                    <button style={S.qteBtn} onClick={() => ajusterQte(it, -1)}><Minus size={11} /></button>
                    <span style={S.qte}>{it.quantite}</span>
                    <button style={S.qteBtn} onClick={() => ajusterQte(it, +1)}><Plus size={11} /></button>
                    <button style={S.suppr} onClick={() => supprimer(it)}><Trash2 size={12} /></button>
                  </div>
                </div>
                {it.description && ouverts[it.id] && <p style={S.desc}>{it.description}</p>}
              </div>
            ))
        )}

        {onglet === 'equip' && (
          <>
            <Slot titre="Armure" item={equipeDe('armure')} candidats={candidats.armure} emp="armure" onToggle={basculer} />
            <Slot titre="Bouclier" item={equipeDe('bouclier')} candidats={candidats.bouclier} emp="bouclier" onToggle={basculer} />
            <Slot titre="Arme principale" item={equipeDe('main')} candidats={candidats.main} emp="main" onToggle={basculer} />
            <Slot titre="Arme secondaire" item={equipeDe('off')} candidats={candidats.off} emp="off" onToggle={basculer} />
            <SlotMulti titre="Accessoires magiques" equipes={accessoiresEquipes} candidats={candidats.accessoire} onToggle={basculer} />
          </>
        )}
      </div>
    </div>
  )
}

function Slot({ titre, item, candidats, emp, onToggle }) {
  return (
    <div style={S.slot}>
      <div style={S.slotTitre}>{titre}</div>
      {candidats.length === 0
        ? <p style={S.slotVide}>Aucun objet possédé.</p>
        : <div style={S.chips}>
            {candidats.map((c) => {
              const on = item?.id === c.id
              return (
                <button key={c.id} onClick={() => onToggle(c, emp)}
                  style={{ ...S.chip, ...(on ? S.chipOn : {}) }}>{on && '✦ '}{c.nom}</button>
              )
            })}
          </div>}
    </div>
  )
}

function SlotMulti({ titre, equipes, candidats, onToggle }) {
  const ids = new Set(equipes.map((e) => e.id))
  return (
    <div style={S.slot}>
      <div style={S.slotTitre}>{titre}</div>
      {candidats.length === 0
        ? <p style={S.slotVide}>Aucun objet magique.</p>
        : <div style={S.chips}>
            {candidats.map((c) => (
              <button key={c.id} onClick={() => onToggle(c, 'accessoire')}
                style={{ ...S.chip, ...(ids.has(c.id) ? S.chipOn : {}) }}>{ids.has(c.id) && '✦ '}{c.nom}</button>
            ))}
          </div>}
    </div>
  )
}

const S = {
  win: {
    position: 'fixed', zIndex: 205, width: 380, maxHeight: '78vh', display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, #14131f 0%, #0a0b0f 100%)', border: '1px solid #4a3a6e',
    borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.7)', overflow: 'hidden', color: '#e8e0f0',
    fontFamily: "'Inter', sans-serif",
  },
  bar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#1a1228', borderBottom: '1px solid #252a3a', cursor: 'grab', userSelect: 'none' },
  titre: { display: 'flex', alignItems: 'center', fontSize: 12, color: '#c9a84c', fontFamily: "'Cinzel', serif", letterSpacing: 1 },
  close: { background: 'none', border: 'none', color: '#8a8aaa', cursor: 'pointer', display: 'flex', padding: 2 },
  bourse: { display: 'flex', gap: 14, padding: '10px 14px', borderBottom: '1px solid #252a3a', background: '#0f1118' },
  piece: { display: 'flex', alignItems: 'center', gap: 6 },
  pieceDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  pieceInput: { width: 52, background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 6, color: '#e8e0f0', fontSize: 13, padding: '3px 6px', textAlign: 'right' },
  pieceLbl: { fontSize: 10, color: '#8a8aaa' },
  onglets: { display: 'flex', gap: 4, padding: '8px 12px 0', background: '#0f1118' },
  onglet: { padding: '7px 16px', borderRadius: '8px 8px 0 0', borderTop: '1px solid transparent', borderLeft: '1px solid transparent', borderRight: '1px solid transparent', borderBottom: 'none', background: 'transparent', color: '#8a8aaa', fontSize: 12.5, cursor: 'pointer', fontFamily: "'Cinzel', serif" },
  ongletOn: { color: '#c9a84c', background: '#0a0b0f', borderTop: '1px solid #252a3a', borderLeft: '1px solid #252a3a', borderRight: '1px solid #252a3a', borderBottom: 'none' },
  corps: { padding: '12px 14px', overflowY: 'auto' },
  vide: { margin: 0, fontSize: 13, color: '#4a4a6a', fontStyle: 'italic' },
  ligne: { borderBottom: '1px solid #1a1e2b', padding: '6px 0' },
  ligneHaut: { display: 'flex', alignItems: 'center', gap: 4 },
  chevron: { background: 'none', border: 'none', color: '#8a8aaa', cursor: 'pointer', display: 'flex', padding: 0, width: 19 },
  nom: { flex: 1, fontSize: 13.5, color: '#e8e0f0' },
  tagEquipe: { marginLeft: 8, fontSize: 9.5, color: '#c9a84c', border: '1px solid #6b5520', borderRadius: 8, padding: '1px 6px', letterSpacing: 0.5 },
  qteBloc: { display: 'flex', alignItems: 'center', gap: 5 },
  qteBtn: { width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 5, color: '#c4bcd4', cursor: 'pointer' },
  qte: { minWidth: 22, textAlign: 'center', fontSize: 13, color: '#e8e0f0' },
  suppr: { marginLeft: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#6a4a4a', cursor: 'pointer' },
  desc: { margin: '4px 0 4px 23px', fontSize: 12, lineHeight: 1.5, color: '#8a8aaa' },
  slot: { marginBottom: 14 },
  slotTitre: { fontSize: 10.5, letterSpacing: 1.5, color: '#7b5ea7', fontFamily: "'Cinzel', serif", textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid #252a3a', paddingBottom: 5 },
  slotVide: { margin: 0, fontSize: 12, color: '#4a4a6a', fontStyle: 'italic' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  chip: { padding: '5px 11px', borderRadius: 14, background: '#13161f', border: '1px solid #252a3a', color: '#8a94ad', fontSize: 12.5, cursor: 'pointer' },
  chipOn: { background: '#2a1e0a', border: '1px solid #c9a84c', color: '#e8c96a' },
}