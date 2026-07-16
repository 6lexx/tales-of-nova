import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Type, AlignLeft, ScrollText, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { TAILLE_NARRATION, DENSITE_JOURNAL } from '../services/preferencesService'

// Profil + préférences. Le chrome (page / topbar / brand / btn-ghost) reste en
// classes globales, comme les autres pages hors-jeu ; le contenu est en styles
// inline, comme Game.jsx et les composants de jeu — c'est là que vit la charte.
//
// Sauvegarde immédiate à chaque changement : majPreferences() écrit ET rafraîchit
// le contexte, donc pas de bouton « Enregistrer », pas d'état local à resynchroniser.

const TAILLES = [
  ['S', 'Petit'],
  ['M', 'Moyen'],
  ['L', 'Grand'],
]
const DENSITES = [
  ['compact', 'Compact', 'Messages resserrés, plus de texte à l\u2019écran'],
  ['aere', 'Aéré', 'Plus d\u2019espace entre les messages'],
]
const LONGUEURS = [
  ['concis', 'Concis', 'Le MJ va à l\u2019essentiel, 1 à 2 paragraphes'],
  ['standard', 'Standard', '3 à 5 paragraphes — le rythme par défaut'],
  ['immersif', 'Immersif', 'Descriptions étoffées, ambiance appuyée'],
]


export default function Profil() {
  const navigate = useNavigate()
  const { user, pseudo, preferences, majPreferences, majPseudo } = useAuth()

  const [champPseudo, setChampPseudo] = useState('')
  const [enregistre, setEnregistre] = useState(null)   // clé de la section confirmée
  const [erreur, setErreur] = useState('')

  useEffect(() => { setChampPseudo(pseudo ?? '') }, [pseudo])

  function confirmer(section) {
    setEnregistre(section)
    setTimeout(() => setEnregistre((s) => (s === section ? null : s)), 1600)
  }

  async function changer(section, patch) {
    setErreur('')
    try {
      await majPreferences(patch)
      confirmer(section)
    } catch (e) {
      setErreur(e.message)
    }
  }

  async function validerPseudo() {
    if ((champPseudo ?? '').trim() === (pseudo ?? '')) return
    setErreur('')
    try {
      await majPseudo(champPseudo)
      confirmer('compte')
    } catch (e) {
      setErreur(e.message)
    }
  }

  const a = preferences.affichage
  const n = preferences.narration

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
      </header>

      <div style={S.contenu}>
        <div style={S.titreZone}>
          <h2 style={S.titre}>Profil</h2>
          <p style={S.sousTitre}>Connecté : {user?.email}</p>
        </div>

        {erreur && <div style={S.erreur}>{erreur}</div>}

        {/* ── Affichage ── */}
        <section style={S.section}>
          <Entete icone={<Type size={14} />} titre="Affichage" ok={enregistre === 'affichage'} />

          <Ligne libelle="Taille du texte de narration">
            <Segments valeurs={TAILLES} actif={a.tailleTexte}
              onChange={(v) => changer('affichage', { affichage: { tailleTexte: v } })} />
          </Ligne>

          <Ligne libelle="Densité du journal">
            <div style={S.cartes}>
              {DENSITES.map(([v, nom, desc]) => (
                <Carte key={v} actif={a.densite === v} nom={nom} desc={desc}
                  onClick={() => changer('affichage', { affichage: { densite: v } })} />
              ))}
            </div>
          </Ligne>

          {/* Aperçu : ce que donneront réellement taille et densité dans le fil. */}
          <div style={S.apercu}>
            <div style={S.apercuLbl}><AlignLeft size={11} /> Aperçu</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: DENSITE_JOURNAL[a.densite].gap }}>
              <p style={{ ...S.apercuMj, fontSize: TAILLE_NARRATION[a.tailleTexte] }}>
                La brume s'accroche aux pierres tombales. Quelque part dans la nef éventrée,
                une chose remue — lentement, comme si elle avait tout son temps.
              </p>
              <p style={S.apercuJoueur}>J'avance, glaive au clair.</p>
              <p style={{ ...S.apercuMj, fontSize: TAILLE_NARRATION[a.tailleTexte] }}>
                Le vieil homme te retient par la manche. « Pas par là », souffle-t-il.
              </p>
            </div>
          </div>
        </section>

        {/* ── Narration ── */}
        <section style={S.section}>
          <Entete icone={<ScrollText size={14} />} titre="Narration" ok={enregistre === 'narration'} />
          <Ligne libelle="Longueur des réponses du MJ">
            <div style={S.cartes}>
              {LONGUEURS.map(([v, nom, desc]) => (
                <Carte key={v} actif={n.longueur === v} nom={nom} desc={desc}
                  onClick={() => changer('narration', { narration: { longueur: v } })} />
              ))}
            </div>
          </Ligne>
        </section>

        {/* ── Compte ── */}
        <section style={S.section}>
          <Entete icone={<User size={14} />} titre="Compte" ok={enregistre === 'compte'} />
          <Ligne libelle="Nom d'affichage">
            <div style={S.champZone}>
              <input style={S.champ} value={champPseudo} maxLength={40}
                onChange={(e) => setChampPseudo(e.target.value)}
                onBlur={validerPseudo}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                placeholder="Comment veux-tu être appelé ?" />
              <span style={S.champNote}>Enregistré en quittant le champ.</span>
            </div>
          </Ligne>
        </section>
      </div>
    </div>
  )
}

function Entete({ icone, titre, ok }) {
  return (
    <div style={S.entete}>
      <span style={S.enteteIcone}>{icone}</span>
      <span style={S.enteteTitre}>{titre}</span>
      {ok && <span style={S.ok}><Check size={11} /> Enregistré</span>}
    </div>
  )
}

function Ligne({ libelle, children }) {
  return (
    <div style={S.ligne}>
      <span style={S.ligneLbl}>{libelle}</span>
      {children}
    </div>
  )
}

function Segments({ valeurs, actif, onChange }) {
  return (
    <div style={S.segments}>
      {valeurs.map(([v, nom]) => (
        <button key={v} onClick={() => onChange(v)}
          style={{ ...S.segment, ...(actif === v ? S.segmentActif : {}) }}>
          {nom}
        </button>
      ))}
    </div>
  )
}

function Carte({ actif, nom, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ ...S.carte, ...(actif ? S.carteActive : {}) }}>
      <span style={{ ...S.carteNom, ...(actif ? { color: '#c9a84c' } : {}) }}>{nom}</span>
      <span style={S.carteDesc}>{desc}</span>
    </button>
  )
}

const S = {
  contenu: { maxWidth: 760, margin: '0 auto', padding: '8px 24px 60px', display: 'flex', flexDirection: 'column', gap: 18 },
  titreZone: { display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 2 },
  titre: { fontFamily: "'Cinzel', serif", fontSize: 26, color: '#e8e0f0', margin: 0, letterSpacing: 1 },
  sousTitre: { fontSize: 12.5, color: '#8a8aaa', margin: 0 },
  erreur: { background: '#2a1414', border: '1px solid #5a2828', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: '#e8a0a0' },

  section: { background: 'linear-gradient(180deg, #13161f 0%, #0f1118 100%)', border: '1px solid #252a3a', borderRadius: 12, padding: '15px 18px 18px' },
  entete: { display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 11, marginBottom: 14, borderBottom: '1px solid #1c2030' },
  enteteIcone: { display: 'flex', color: '#7b5ea7' },
  enteteTitre: { fontFamily: "'Cinzel', serif", fontSize: 13, color: '#c9a84c', letterSpacing: 1.4 },
  ok: { display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', fontSize: 10.5, color: '#3a8a8a' },

  ligne: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 },
  ligneLbl: { fontSize: 12.5, color: '#c4bcd4' },

  segments: { display: 'inline-flex', background: '#0a0b0f', border: '1px solid #252a3a', borderRadius: 8, padding: 3, gap: 3, alignSelf: 'flex-start' },
  segment: { background: 'none', border: 'none', color: '#8a8aaa', borderRadius: 6, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  segmentActif: { background: 'linear-gradient(135deg, #7b5ea7 0%, #4a2f70 100%)', color: '#e8e0f0' },

  cartes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 },
  carte: { display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left', background: '#0f1118', border: '1px solid #252a3a', borderRadius: 9, padding: '10px 12px', cursor: 'pointer' },
  carteActive: { border: '1px solid #6b5520', background: '#1a1610' },
  carteNom: { fontFamily: "'Cinzel', serif", fontSize: 12.5, color: '#c4bcd4' },
  carteDesc: { fontSize: 10.5, color: '#4a4a6a', lineHeight: 1.45 },

  apercu: { background: '#0a0b0f', border: '1px solid #1c2030', borderRadius: 9, padding: '11px 14px 14px' },
  apercuLbl: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 9.5, color: '#4a4a6a', letterSpacing: 1.2, marginBottom: 9 },
  apercuMj: { fontFamily: "'EB Garamond', serif", lineHeight: 1.62, color: '#c4bcd4', margin: 0 },
  apercuJoueur: { fontSize: 12.5, color: '#7b5ea7', fontStyle: 'italic', borderLeft: '2px solid #3d2f5a', paddingLeft: 9, margin: 0 },

  champZone: { display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 340 },
  champ: { background: '#1a1e2b', border: '1px solid #252a3a', borderRadius: 8, color: '#e8e0f0', padding: '9px 11px', fontSize: 13, fontFamily: "'Inter', sans-serif" },
  champNote: { fontSize: 10, color: '#4a4a6a', fontStyle: 'italic' },
}