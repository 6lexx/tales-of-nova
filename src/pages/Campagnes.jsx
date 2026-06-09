import { useNavigate } from 'react-router-dom'

export default function Campagnes() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
      </header>
      <h2>Campagnes</h2>
      <div className="empty">
        <p>Aucune campagne en cours.</p>
        <p className="muted">La reprise de campagne sera branchée à l'étape 6b.</p>
        <button className="btn" onClick={() => navigate('/personnages')}>Choisir un personnage</button>
      </div>
    </div>
  )
}