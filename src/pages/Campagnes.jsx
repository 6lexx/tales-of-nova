import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCampagnes } from '../services/sessionService'
import { Heart, ChevronRight, Swords } from 'lucide-react'

export default function Campagnes() {
  const navigate = useNavigate()
  const [campagnes, setCampagnes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    listCampagnes()
      .then(setCampagnes)
      .catch((e) => setErreur(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
      </header>

      <div className="page-head">
        <h2>Campagnes en cours</h2>
        <button className="btn" onClick={() => navigate('/personnages')}>
          Nouvelle campagne
        </button>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {erreur && <p className="error">{erreur}</p>}

      {!loading && !erreur && campagnes.length === 0 && (
        <div className="empty">
          <p>Aucune campagne en cours.</p>
          <p className="muted">Lance une nouvelle aventure depuis l'accueil ou la liste des personnages.</p>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/personnages')}>
            Choisir un personnage
          </button>
        </div>
      )}

      <div className="camp-liste">
        {campagnes.map((c) => {
          const perso = c.characters
          const session = c.derniere_session
          const pvPct = perso ? Math.max(0, Math.min(100, (perso.pv_actuels / perso.pv_max) * 100)) : 0
          const pvColor = pvPct > 60 ? '#3a8a8a' : pvPct > 30 ? '#c9a84c' : '#b84040'
          const dateStr = new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

          return (
            <button key={c.id} className="camp-card"
              onClick={() => navigate(`/jeu/${perso?.id}`)}>
              <div className="camp-card-left">
                <div className="camp-perso-icone"><Swords size={22} color="#c9a84c" /></div>
                <div>
                  <div className="camp-perso-nom">{perso?.nom ?? '—'}</div>
                  <div className="camp-perso-meta">
                    {perso?.espece} · {perso?.classe} niv.{perso?.niveau}
                  </div>
                  {session?.lieu_actuel && (
                    <div className="camp-lieu">📍 {session.lieu_actuel}</div>
                  )}
                  {session?.resume && (
                    <div className="camp-resume">{session.resume}</div>
                  )}
                  <div className="camp-date">Commencée le {dateStr}</div>
                </div>
              </div>

              <div className="camp-card-right">
                {perso?.pv_max && (
                  <div className="camp-pv">
                    <Heart size={12} color="#b84040" />
                    <div className="camp-pv-bar">
                      <div style={{ width: `${pvPct}%`, height: '100%', background: pvColor, borderRadius: 3, transition: 'width .4s' }} />
                    </div>
                    <span>{perso.pv_actuels}/{perso.pv_max}</span>
                  </div>
                )}
                <div className="camp-reprendre">
                  Reprendre <ChevronRight size={15} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}