import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* Palette dark fantasy (constantes du projet) */
const C = {
  bg: '#0a0b0f', panel: '#12141c', panel2: '#171a24', border: '#2a2d3a',
  violet: '#7b5ea7', gold: '#c9a84c', text: '#e8e6e0', muted: '#8a8a99',
}

const S = {
  fenetre: {
    position: 'fixed', width: 760, maxWidth: '92vw', height: 540, maxHeight: '85vh',
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    boxShadow: '0 18px 50px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column',
    zIndex: 60, overflow: 'hidden', color: C.text,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  entete: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
    background: C.panel, cursor: 'move', userSelect: 'none',
  },
  titre: { fontFamily: "'Cinzel', serif", fontSize: 15, color: C.gold, letterSpacing: '.5px' },
  fermer: {
    border: `1px solid ${C.border}`, background: 'transparent', color: C.muted,
    width: 26, height: 26, borderRadius: 6, cursor: 'pointer', fontSize: 15, lineHeight: 1,
  },
  onglets: { display: 'flex', gap: 4, padding: '8px 12px 0', background: C.panel },
  onglet: (actif) => ({
    padding: '7px 16px', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontSize: 13,
    fontFamily: "'Cinzel', serif", letterSpacing: '.5px',
    color: actif ? C.gold : C.muted,
    background: actif ? C.bg : 'transparent',
    border: `1px solid ${actif ? C.border : 'transparent'}`, borderBottom: 'none',
  }),
  barreOutils: {
    display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px',
    borderBottom: `1px solid ${C.border}`, background: C.panel,
  },
  input: {
    flex: 1, background: C.panel2, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none',
  },
  select: {
    background: C.panel2, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 6, padding: '6px 8px', fontSize: 13, outline: 'none',
  },
  corps: { flex: 1, display: 'flex', minHeight: 0 },
  liste: {
    width: 260, borderRight: `1px solid ${C.border}`, overflowY: 'auto',
    background: C.panel,
  },
  item: (actif) => ({
    padding: '9px 12px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer',
    background: actif ? C.panel2 : 'transparent',
    borderLeft: `3px solid ${actif ? C.violet : 'transparent'}`,
  }),
  itemNom: { fontSize: 13, color: C.text, marginBottom: 2 },
  itemMeta: { fontSize: 11, color: C.muted },
  detail: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  detailTitre: { fontFamily: "'Cinzel', serif", fontSize: 18, color: C.gold, marginBottom: 6 },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6, margin: '4px 0 12px' },
  badge: {
    fontSize: 11, color: C.violet, border: `1px solid ${C.violet}55`,
    borderRadius: 999, padding: '2px 9px', background: `${C.violet}18`,
  },
  ligneInfo: { display: 'flex', gap: 8, fontSize: 13, marginBottom: 4 },
  infoLabel: { color: C.muted, minWidth: 130 },
  desc: {
    fontFamily: "'EB Garamond', serif", fontSize: 15, lineHeight: 1.55,
    color: C.text, whiteSpace: 'pre-wrap', marginTop: 12,
  },
  sousTitre: { fontFamily: "'Cinzel', serif", fontSize: 13, color: C.gold, marginTop: 14, marginBottom: 4 },
  vide: { padding: 30, textAlign: 'center', color: C.muted, fontSize: 13 },
}

const niveauSort = (n) => (n === 0 ? 'Sort mineur' : `Niveau ${n}`)

// Compat anciens persos : valeurs pré-nettoyage → vocabulaire SRD FR des tables spells/features.
const NORM_CLASSE = { Mage: 'Magicien', Voleur: 'Roublard' }
const NORM_ESPECE = { Orc: 'Demi-orc' }
const classeSrd = (c) => (c ? (NORM_CLASSE[c] || c) : null)
const especeSrd = (e) => (e ? (NORM_ESPECE[e] || e) : null)

export default function FicheSortsCapacites({ perso = {}, onClose }) {
  const [onglet, setOnglet] = useState('capacites')
  const [capacites, setCapacites] = useState([])
  const [sorts, setSorts] = useState([])
  const [chargement, setChargement] = useState(true)
  const [selId, setSelId] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [filtreNiveau, setFiltreNiveau] = useState('tous')

  /* --- Récupération des données --- */
  useEffect(() => {
    let annule = false
    async function charger() {
      setChargement(true)
      const espece = especeSrd(perso.espece)
      const classe = classeSrd(perso.classe)
      const niveau = perso.niveau ?? 1

      const reqRace = espece
        ? supabase.from('features').select('*').eq('type', 'race').eq('source', espece)
        : Promise.resolve({ data: [] })
      const reqClasse = classe
        ? supabase.from('features').select('*').eq('type', 'classe').eq('source', classe)
        : Promise.resolve({ data: [] })
      const reqSorts = classe
        ? supabase.from('spells').select('*').contains('classes', [classe]).order('niveau', { ascending: true })
        : Promise.resolve({ data: [] })

      const [rRace, rClasse, rSorts] = await Promise.all([reqRace, reqClasse, reqSorts])
      if (annule) return

      // Capacités : traits de base + sous-race choisie uniquement (jamais les autres sous-races).
      const sousEspece = perso.fiche?.sousEspece || null
      const caps = [...(rRace.data || []), ...(rClasse.data || [])]
        .filter((c) => c.niveau == null || c.niveau <= niveau)
        .filter((c) => c.type !== 'race' || !c.sous_source || c.sous_source === sousEspece)
        .sort((a, b) => a.type.localeCompare(b.type) || (a.niveau ?? 0) - (b.niveau ?? 0) || a.nom.localeCompare(b.nom))
      setCapacites(caps)

      // Sorts : masque les niveaux au-dessus du castable, puis restreint aux sorts appris si renseignés.
      const maxSort = Math.min(9, Math.ceil(niveau / 2))
      const sortsConnus = perso.fiche?.sorts
      let listeSorts = (rSorts.data || []).filter((s) => s.niveau === 0 || s.niveau <= maxSort)
      if (Array.isArray(sortsConnus)) listeSorts = listeSorts.filter((s) => sortsConnus.includes(s.slug))
      setSorts(listeSorts)
      setChargement(false)
    }
    charger()
    return () => { annule = true }
  }, [perso?.id, perso?.espece, perso?.classe, perso?.niveau, perso?.fiche?.sousEspece, perso?.fiche?.sorts])

  /* --- Déplacement de la fenêtre --- */
  const [pos, setPos] = useState({ x: 140, y: 70 })
  const drag = useRef(null)
  const onMouseDown = (e) => { drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y } }
  const onMouseMove = useCallback((e) => {
    if (!drag.current) return
    setPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy })
  }, [])
  const onMouseUp = useCallback(() => { drag.current = null }, [])
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  /* --- Liste filtrée selon l'onglet --- */
  const source = onglet === 'capacites' ? capacites : sorts
  const filtree = source.filter((el) => {
    const okNom = !recherche || el.nom?.toLowerCase().includes(recherche.toLowerCase())
    const okNiv = onglet !== 'sorts' || filtreNiveau === 'tous' || el.niveau === Number(filtreNiveau)
    return okNom && okNiv
  })
  const selection = filtree.find((el) => el.id === selId) || filtree[0] || null

  return (
    <div style={{ ...S.fenetre, left: pos.x, top: pos.y }}>
      <div style={S.entete} onMouseDown={onMouseDown}>
        <span style={S.titre}>Grimoire &amp; Capacités — {perso.nom || 'Personnage'}</span>
        <button style={S.fermer} onClick={onClose} title="Fermer">×</button>
      </div>

      <div style={S.onglets}>
        <div style={S.onglet(onglet === 'capacites')} onClick={() => { setOnglet('capacites'); setSelId(null) }}>
          Capacités ({capacites.length})
        </div>
        <div style={S.onglet(onglet === 'sorts')} onClick={() => { setOnglet('sorts'); setSelId(null) }}>
          Sorts ({sorts.length})
        </div>
      </div>

      <div style={S.barreOutils}>
        <input
          style={S.input}
          placeholder="Rechercher…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        {onglet === 'sorts' && (
          <select style={S.select} value={filtreNiveau} onChange={(e) => setFiltreNiveau(e.target.value)}>
            <option value="tous">Tous niveaux</option>
            <option value="0">Sorts mineurs</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>Niveau {n}</option>
            ))}
          </select>
        )}
      </div>

      <div style={S.corps}>
        <div style={S.liste}>
          {chargement && <div style={S.vide}>Chargement…</div>}
          {!chargement && filtree.length === 0 && (
            <div style={S.vide}>
              {onglet === 'sorts' ? 'Aucun sort disponible pour cette classe.' : 'Aucune capacité trouvée.'}
            </div>
          )}
          {!chargement && filtree.map((el) => (
            <div
              key={el.id}
              style={S.item((selection && el.id === selection.id))}
              onClick={() => setSelId(el.id)}
            >
              <div style={S.itemNom}>{el.nom}</div>
              <div style={S.itemMeta}>
                {onglet === 'sorts'
                  ? `${niveauSort(el.niveau)} · ${el.ecole || '—'}`
                  : `${el.source}${el.sous_source ? ' · ' + el.sous_source : ''}${el.niveau ? ' · niv.' + el.niveau : ''}`}
              </div>
            </div>
          ))}
        </div>

        <div style={S.detail}>
          {!selection && <div style={S.vide}>Sélectionne un élément.</div>}
          {selection && onglet === 'sorts' && <DetailSort s={selection} />}
          {selection && onglet === 'capacites' && <DetailCapacite c={selection} />}
        </div>
      </div>
    </div>
  )
}

/* --- Panneaux de détail --- */
function DetailSort({ s }) {
  return (
    <>
      <div style={S.detailTitre}>{s.nom}</div>
      <div style={S.badges}>
        <span style={S.badge}>{niveauSort(s.niveau)}</span>
        {s.ecole && <span style={S.badge}>{s.ecole}</span>}
        {s.concentration && <span style={S.badge}>Concentration</span>}
        {s.rituel && <span style={S.badge}>Rituel</span>}
      </div>
      {s.temps_incantation && <Info label="Temps d'incantation" val={s.temps_incantation} />}
      {s.portee && <Info label="Portée" val={s.portee} />}
      {s.composantes && <Info label="Composantes" val={s.composantes} />}
      {s.duree && <Info label="Durée" val={s.duree} />}
      {Array.isArray(s.classes) && s.classes.length > 0 && <Info label="Classes" val={s.classes.join(', ')} />}
      <div style={S.desc}>{s.description}</div>
      {s.aux_niveaux_superieurs && (
        <>
          <div style={S.sousTitre}>Aux niveaux supérieurs</div>
          <div style={S.desc}>{s.aux_niveaux_superieurs}</div>
        </>
      )}
    </>
  )
}

function DetailCapacite({ c }) {
  return (
    <>
      <div style={S.detailTitre}>{c.nom}</div>
      <div style={S.badges}>
        <span style={S.badge}>{c.type === 'race' ? 'Trait racial' : 'Capacité de classe'}</span>
        <span style={S.badge}>{c.source}</span>
        {c.sous_source && <span style={S.badge}>{c.sous_source}</span>}
        {c.niveau && <span style={S.badge}>Niveau {c.niveau}</span>}
      </div>
      <div style={S.desc}>{c.description}</div>
    </>
  )
}

function Info({ label, val }) {
  return (
    <div style={S.ligneInfo}>
      <span style={S.infoLabel}>{label}</span>
      <span>{val}</span>
    </div>
  )
}