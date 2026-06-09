import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user, signOut } = useAuth()

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Tales of Nova</h1>
        <p className="auth-sub">Connecté : {user?.email}</p>
        <p className="auth-message">
          La liste de tes personnages et la création arriveront ici (étape 6).
        </p>
        <button className="auth-btn" onClick={signOut}>Se déconnecter</button>
      </div>
    </div>
  )
}