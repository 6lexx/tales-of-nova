import { useNavigate } from 'react-router-dom'

export default function Parametres() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
      </header>
      <h2>Paramètres</h2>
      <p className="muted">Les paramètres arriveront ici (préférences de jeu, ton du MJ, affichage…).</p>
    </div>
  )
}