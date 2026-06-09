import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profil() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
      </header>
      <h2>Profil</h2>
      <p className="muted">Connecté : {user?.email}</p>
      <p className="muted">La gestion du profil (pseudo, avatar…) arrivera ici.</p>
    </div>
  )
}