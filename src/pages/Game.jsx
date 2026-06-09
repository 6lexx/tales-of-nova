import { useParams, useNavigate } from 'react-router-dom'

export default function Game() {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Personnages</button>
      </header>
      <p className="muted">Interface de jeu (étape 6b) — personnage {id}.</p>
    </div>
  )
}