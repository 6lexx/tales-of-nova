import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCharacters } from '../services/characterService'

export default function Characters() {
  const navigate = useNavigate()
  const [persos, setPersos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    listCharacters()
      .then(setPersos)
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
        <h2>Mes personnages</h2>
        <button className="btn" onClick={() => navigate('/personnage/nouveau')}>
          Nouveau personnage
        </button>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {erreur && <p className="error">{erreur}</p>}

      {!loading && !erreur && persos.length === 0 && (
        <div className="empty">
          <p>Aucun personnage pour l'instant.</p>
          <p className="muted">Crée ton premier héros pour partir à l'aventure.</p>
        </div>
      )}

      <div className="char-grid">
        {persos.map((p) => (
          <button key={p.id} className="char-card" onClick={() => navigate(`/jeu/${p.id}`)}>
            <span className="char-name">{p.nom}</span>
            <span className="char-meta">{p.espece} · {p.classe} niv.{p.niveau}</span>
            <span className="char-pv">PV {p.pv_actuels ?? '?'}/{p.pv_max ?? '?'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}