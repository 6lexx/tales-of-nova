import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Accueil() {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  return (
    <div className="menu-screen">
      <div className="menu">
        <h1 className="menu-title">Tales of Nova</h1>
        <p className="menu-tag">Ton aventure t'attend.</p>

        <button className="btn btn-block" onClick={() => navigate('/personnages')}>
          Démarrer une nouvelle campagne
        </button>
        <button className="btn btn-block" onClick={() => navigate('/campagnes')}>
          Continuer une campagne
        </button>
        <button className="btn-outline btn-block" onClick={() => navigate('/personnage/nouveau')}>
          Créer un personnage
        </button>

        <div className="menu-row">
          <button className="btn-ghost btn-block" onClick={() => navigate('/profil')}>Profil</button>
          <button className="btn-ghost btn-block" onClick={() => navigate('/parametres')}>Paramètres</button>
        </div>

        <button className="menu-logout" onClick={signOut}>Se déconnecter</button>
      </div>
    </div>
  )
}