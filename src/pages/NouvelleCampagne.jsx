import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCharacter } from '../services/characterService'
import { campagneExistePour } from '../services/sessionService'
import { demarrerNouvelleCampagne } from '../services/campaignService'

// Options de paramétrage — les clés alimentent directement genererArcCampagne.
const TONS = [
  ['sombre et rude', 'Sombre & rude'], ['héroïque', 'Héroïque'],
  ['mystère', 'Mystère'], ['intrigue politique', 'Intrigue politique'],
  ['horreur', 'Horreur'], ['épique', 'Épique'],
]
const TYPES = [
  ['donjon', 'Donjon & exploration'], ['enquete', 'Enquête'],
  ['intrigue', 'Intrigue'], ['survie', 'Survie'],
  ['guerre', 'Guerre'], ['voyage', 'Grand voyage'],
]
const ENVERGURES = [
  ['one_shot', 'One-shot'], ['court', 'Courte'],
  ['standard', 'Standard'], ['long', 'Longue'],
]
const CENTRALITES = [['faible', 'Faible'], ['moyenne', 'Moyenne'], ['forte', 'Forte']]
const LETALITES = [['clemente', 'Clémente'], ['standard', 'Standard'], ['mortelle', 'Mortelle']]
const VOILES = [
  'Torture', 'Violence sexuelle', 'Maltraitance d’enfants', 'Automutilation',
  'Body horror', 'Cruauté animale', 'Esclavage', 'Fanatisme religieux',
]

export default function NouvelleCampagne() {
  const { id: characterId } = useParams()
  const navigate = useNavigate()

  const [perso, setPerso] = useState(null)
  const [initLoading, setInitLoading] = useState(true)
  const [generation, setGeneration] = useState(false)
  const [erreur, setErreur] = useState('')

  const [opts, setOpts] = useState({
    ton: 'sombre et rude',
    type_aventure: 'donjon',
    envergure: 'standard',
    region: '',
    centralite_historique: 'moyenne',
    letalite: 'standard',
    voiles: [],
    voilesLibre: '',
  })

  useEffect(() => {
    async function init() {
      try {
        // Garde-fou : si une campagne existe déjà, on reprend au lieu de dupliquer.
        if (await campagneExistePour(characterId)) {
          navigate(`/jeu/${characterId}`, { replace: true })
          return
        }
        const p = await getCharacter(characterId)
        setPerso(p)
      } catch (e) {
        setErreur(e.message)
      } finally {
        setInitLoading(false)
      }
    }
    init()
  }, [characterId, navigate])

  const set = (cle, val) => setOpts((o) => ({ ...o, [cle]: val }))
  const toggleVoile = (v) =>
    setOpts((o) => ({
      ...o,
      voiles: o.voiles.includes(v) ? o.voiles.filter((x) => x !== v) : [...o.voiles, v],
    }))

  async function forger() {
    if (generation) return
    setErreur('')
    setGeneration(true)
    try {
      const lignes_et_voiles = [
        ...opts.voiles,
        ...opts.voilesLibre.split(',').map((s) => s.trim()).filter(Boolean),
      ]
      const options = {
        ton: opts.ton,
        type_aventure: opts.type_aventure,
        envergure: opts.envergure,
        region: opts.region.trim() || null,
        centralite_historique: opts.centralite_historique,
        letalite: opts.letalite,
        lignes_et_voiles,
      }
      await demarrerNouvelleCampagne(characterId, options)
      navigate(`/jeu/${characterId}`, { replace: true })
    } catch (e) {
      setErreur(e.message)
      setGeneration(false)
    }
  }

  if (initLoading) return <div className="page"><p className="muted">Chargement…</p></div>

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/personnages')} disabled={generation}>
          ← Personnages
        </button>
      </header>

      <div className="page-head">
        <h2>Nouvelle campagne</h2>
      </div>
      {perso && (
        <p className="muted" style={{ marginTop: -8 }}>
          Pour <strong style={{ color: C.gold }}>{perso.nom}</strong> — {perso.espece} · {perso.classe} niv.{perso.niveau}
        </p>
      )}
      <p className="muted" style={S.intro}>
        Ces réglages nourrissent l'arc directeur généré sur mesure : enjeu personnel, antagoniste,
        jalons narratifs. Le grand objectif restera masqué jusqu'à ce que l'aventure le révèle.
      </p>

      {erreur && <p className="error">{erreur}</p>}

      <div className="form" style={S.form}>
        <div className="row">
          <label className="field">
            Ton / ambiance
            <select value={opts.ton} onChange={(e) => set('ton', e.target.value)} disabled={generation}>
              {TONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            Type d'aventure
            <select value={opts.type_aventure} onChange={(e) => set('type_aventure', e.target.value)} disabled={generation}>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <div className="row">
          <label className="field">
            Envergure
            <select value={opts.envergure} onChange={(e) => set('envergure', e.target.value)} disabled={generation}>
              {ENVERGURES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            Centralité de l'historique
            <select value={opts.centralite_historique} onChange={(e) => set('centralite_historique', e.target.value)} disabled={generation}>
              {CENTRALITES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            Létalité
            <select value={opts.letalite} onChange={(e) => set('letalite', e.target.value)} disabled={generation}>
              {LETALITES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          Région / point de départ
          <input
            value={opts.region}
            onChange={(e) => set('region', e.target.value)}
            placeholder="Ville des Royaumes Oubliés… (vide = au MJ de choisir)"
            disabled={generation}
          />
        </label>

        <div className="field">
          <span>Lignes & voiles — thèmes à exclure</span>
          <div style={S.chips}>
            {VOILES.map((v) => {
              const actif = opts.voiles.includes(v)
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggleVoile(v)}
                  disabled={generation}
                  style={{ ...S.chip, ...(actif ? S.chipActif : {}) }}
                >
                  {v}
                </button>
              )
            })}
          </div>
          <input
            value={opts.voilesLibre}
            onChange={(e) => set('voilesLibre', e.target.value)}
            placeholder="Autres à exclure (séparés par des virgules)"
            disabled={generation}
            style={{ marginTop: 8 }}
          />
        </div>

        <button className="btn btn-block" onClick={forger} disabled={generation} style={S.forger}>
          {generation ? 'Le MJ forge ton arc…' : 'Forger la campagne'}
        </button>
        {generation && (
          <p className="muted" style={{ textAlign: 'center' }}>
            Génération de l'arc directeur — quelques secondes.
          </p>
        )}
      </div>
    </div>
  )
}

const C = { gold: '#c9a84c', violet: '#7b5ea7' }

const S = {
  intro: { maxWidth: 520, lineHeight: 1.6, marginTop: 12 },
  form: { marginTop: 20 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: {
    padding: '6px 12px', borderRadius: 16, cursor: 'pointer',
    background: '#0f1116', border: '1px solid #2c313d', color: '#8a8aaa',
    fontSize: 13, fontFamily: "'Inter', sans-serif",
  },
  chipActif: { background: '#2a1010', border: '1px solid #b84040', color: '#e0a0a0' },
  forger: { marginTop: 8 },
}