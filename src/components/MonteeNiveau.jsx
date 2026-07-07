import { useState, useEffect } from 'react'
import { Sparkles, ArrowUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { applyMilestone } from '../services/progressionService'

const mod = (v) => Math.floor((v - 10) / 2)
const DE_CLASSE = { Guerrier: 10, Magicien: 6, Roublard: 8, Clerc: 8 }
const NORM_CLASSE = { Mage: 'Magicien', Voleur: 'Roublard' }
const classeSrd = (c) => (c ? NORM_CLASSE[c] || c : null)
const COL = { FOR: 'force', DEX: 'dexterite', CON: 'constitution', INT: 'intelligence', SAG: 'sagesse', CHA: 'charisme' }
const STATS = ['FOR', 'DEX', 'CON', 'INT', 'SAG', 'CHA']
const NIVEAUX_ASI = [4, 8, 12, 16, 19]
const NB_SORTS = { Magicien: 2, Clerc: 2 }

// Fenêtre modale de montée de niveau. Props : { perso, milestone, onDone }
export default function MonteeNiveau({ perso, milestone, onDone }) {
  const nouveauNiveau = milestone.to_level
  const classe = classeSrd(perso.classe)
  const de = DE_CLASSE[classe] ?? 8
  const gainPV = Math.floor(de / 2) + 1 + mod(perso.constitution ?? 10)
  const capSorts = NB_SORTS[classe] ?? 0

  const [capacites, setCapacites] = useState([])
  const [sortsDispo, setSortsDispo] = useState([])
  const [asi, setAsi] = useState({ FOR: 0, DEX: 0, CON: 0, INT: 0, SAG: 0, CHA: 0 })
  const [sortsChoisis, setSortsChoisis] = useState([])
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const asiDispo = NIVEAUX_ASI.includes(nouveauNiveau) || capacites.some((c) => /am[ée]lioration de caract/i.test(c.nom))

  useEffect(() => {
    let annule = false
    async function charger() {
      // Capacités débloquées à ce niveau (classe + sous-classe éventuelle)
      const { data: caps } = await supabase
        .from('features').select('nom, description, sous_source')
        .eq('type', 'classe').eq('source', classe).eq('niveau', nouveauNiveau)
      const filtrees = (caps || []).filter((c) => !c.sous_source || c.sous_source === perso.sous_classe)
      // Sorts apprenables (casters) : ≤ niveau castable, non déjà connus
      let dispo = []
      if (capSorts > 0) {
        const maxSort = Math.min(9, Math.ceil(nouveauNiveau / 2))
        const { data } = await supabase
          .from('spells').select('slug, nom, niveau, description')
          .contains('classes', [classe]).lte('niveau', maxSort)
          .order('niveau').order('nom')
        const connus = perso.fiche?.sorts || []
        dispo = (data || []).filter((s) => !connus.includes(s.slug))
      }
      if (!annule) { setCapacites(filtrees); setSortsDispo(dispo) }
    }
    charger()
    return () => { annule = true }
  }, [classe, nouveauNiveau, perso.sous_classe, capSorts, perso.fiche])

  const totalAsi = STATS.reduce((n, s) => n + asi[s], 0)
  const ajusterAsi = (s, d) => {
    const v = asi[s] + d
    if (v < 0 || v > 2) return
    if (d > 0 && totalAsi >= 2) return
    if (d > 0 && (perso[COL[s]] ?? 10) + v > 20) return
    setAsi({ ...asi, [s]: v })
  }
  const toggleSort = (slug) => {
    if (sortsChoisis.includes(slug)) setSortsChoisis(sortsChoisis.filter((x) => x !== slug))
    else if (sortsChoisis.length < capSorts) setSortsChoisis([...sortsChoisis, slug])
  }

  async function valider() {
    setEnCours(true); setErreur('')
    try {
      const choices = {
        pv_max: (perso.pv_max ?? 0) + gainPV,
        pv_actuels: (perso.pv_actuels ?? 0) + gainPV,
      }
      if (asiDispo && totalAsi > 0) {
        STATS.forEach((s) => { if (asi[s]) choices[COL[s]] = (perso[COL[s]] ?? 10) + asi[s] })
      }
      if (sortsChoisis.length) {
        choices.fiche = { ...(perso.fiche || {}), sorts: [...(perso.fiche?.sorts || []), ...sortsChoisis] }
      }
      await applyMilestone(milestone.id, perso.id, nouveauNiveau, choices)
      onDone?.()
    } catch (e) {
      setErreur(e.message); setEnCours(false)
    }
  }

  const bloque = enCours || (asiDispo && totalAsi !== 2) || (capSorts > 0 && sortsChoisis.length < capSorts && sortsDispo.length >= capSorts)

  return (
    <div style={S.overlay}>
      <div style={S.box}>
        <div style={S.eyebrow}><Sparkles size={13} style={{ marginRight: 6 }} />Montée de niveau</div>
        <h2 style={S.titre}>Niveau {milestone.from_level} → {nouveauNiveau}</h2>
        {milestone.raison && <p style={S.raison}>« {milestone.raison} »</p>}

        <div style={S.corps}>
          <Section titre="Points de vie">
            <p style={S.txt}><ArrowUp size={13} style={{ color: '#3a8a8a', verticalAlign: 'middle' }} /> +{gainPV} PV max (dé moyen d{de} + mod. CON)</p>
          </Section>

          {capacites.length > 0 && (
            <Section titre="Nouvelles capacités">
              {capacites.map((c, i) => (
                <div key={i} style={S.cap}>
                  <div style={S.capNom}>{c.nom}{c.sous_source && <span style={S.capSous}>{c.sous_source}</span>}</div>
                  <div style={S.capDesc}>{c.description}</div>
                </div>
              ))}
            </Section>
          )}

          {asiDispo && (
            <Section titre={`Amélioration de caractéristiques (${totalAsi}/2)`}>
              <div style={S.asiGrid}>
                {STATS.map((s) => (
                  <div key={s} style={S.asiCell}>
                    <span style={S.asiLbl}>{s}</span>
                    <span style={S.asiVal}>{(perso[COL[s]] ?? 10) + asi[s]}</span>
                    <div style={S.asiBtns}>
                      <button style={S.asiBtn} onClick={() => ajusterAsi(s, -1)}>−</button>
                      <button style={S.asiBtn} onClick={() => ajusterAsi(s, +1)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {capSorts > 0 && sortsDispo.length > 0 && (
            <Section titre={`Nouveaux sorts (${sortsChoisis.length}/${capSorts})`}>
              <div style={S.sorts}>
                {sortsDispo.map((s) => {
                  const sel = sortsChoisis.includes(s.slug)
                  const off = !sel && sortsChoisis.length >= capSorts
                  return (
                    <button key={s.slug} onClick={() => toggleSort(s.slug)} title={s.description}
                      style={{ ...S.sortChip, ...(sel ? S.sortChipOn : {}), opacity: off ? 0.4 : 1 }}>
                      {sel && '✦ '}{s.nom} <span style={S.sortNiv}>{s.niveau === 0 ? 'min.' : `n${s.niveau}`}</span>
                    </button>
                  )
                })}
              </div>
            </Section>
          )}
        </div>

        {erreur && <p style={S.err}>{erreur}</p>}
        <button style={{ ...S.valider, opacity: bloque ? 0.5 : 1 }} onClick={valider} disabled={bloque}>
          {enCours ? 'Application…' : 'Valider la montée de niveau'}
        </button>
      </div>
    </div>
  )
}

function Section({ titre, children }) {
  return (
    <div style={S.section}>
      <div style={S.sectionTitre}>{titre}</div>
      {children}
    </div>
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 },
  box: { width: 460, maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #16111f 0%, #0a0b0f 100%)', border: '1px solid #4a3a6e', borderRadius: 16, padding: '26px 28px', boxShadow: '0 24px 80px rgba(0,0,0,.8)', color: '#e8e0f0', fontFamily: "'Inter', sans-serif" },
  eyebrow: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, letterSpacing: 3, color: '#c9a84c', fontFamily: "'Cinzel', serif" },
  titre: { margin: '10px 0 4px', textAlign: 'center', fontSize: 26, fontFamily: "'Cinzel', serif", fontWeight: 600 },
  raison: { margin: '0 0 18px', textAlign: 'center', fontSize: 13, color: '#8a8aaa', fontStyle: 'italic' },
  corps: { overflowY: 'auto', flex: 1 },
  section: { marginBottom: 18 },
  sectionTitre: { fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: '#7b5ea7', fontFamily: "'Cinzel', serif", marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #252a3a' },
  txt: { margin: 0, fontSize: 14, color: '#e8e0f0' },
  cap: { marginBottom: 10 },
  capNom: { fontSize: 14, color: '#c9a84c', fontFamily: "'Cinzel', serif" },
  capSous: { marginLeft: 8, fontSize: 10, color: '#b79ad6', border: '1px solid #4a3a6e', borderRadius: 8, padding: '1px 6px' },
  capDesc: { fontSize: 12.5, color: '#8a8aaa', lineHeight: 1.5, marginTop: 3 },
  asiGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  asiCell: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', background: '#13161f', border: '1px solid #252a3a', borderRadius: 8 },
  asiLbl: { fontSize: 10, color: '#4a4a6a', letterSpacing: 1 },
  asiVal: { fontSize: 18, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  asiBtns: { display: 'flex', gap: 4 },
  asiBtn: { width: 22, height: 22, background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 5, color: '#c4bcd4', cursor: 'pointer', fontSize: 14, lineHeight: 1 },
  sorts: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  sortChip: { padding: '5px 11px', borderRadius: 14, background: '#13161f', border: '1px solid #252a3a', color: '#c4bcd4', fontSize: 12.5, cursor: 'pointer' },
  sortChipOn: { background: '#2a1e0a', border: '1px solid #c9a84c', color: '#e8c96a' },
  sortNiv: { fontSize: 9.5, color: '#6a6a8a', marginLeft: 4 },
  err: { color: '#b84040', fontSize: 13, textAlign: 'center', margin: '0 0 8px' },
  valider: { marginTop: 12, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)', color: '#1a1206', fontSize: 15, fontWeight: 700, fontFamily: "'Cinzel', serif", cursor: 'pointer' },
}