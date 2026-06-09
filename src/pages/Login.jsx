import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    setBusy(true)
    const fn = mode === 'login' ? signIn : signUp
    const { data, error } = await fn(email, password)
    setBusy(false)

    if (error) { setMessage(error.message); return }

    // Inscription avec confirmation e-mail activée : pas de session immédiate
    if (mode === 'signup' && !data.session) {
      setMessage('Compte créé. Confirme ton adresse par e-mail, puis connecte-toi.')
      setMode('login')
      return
    }
    navigate('/')
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Tales of Nova</h1>
        <p className="auth-sub">{mode === 'login' ? 'Reprends ton aventure' : 'Crée ton grimoire'}</p>

        <label className="auth-label">Adresse e-mail
          <input type="email" value={email} required
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>

        <label className="auth-label">Mot de passe
          <input type="password" value={password} required minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>

        {message && <p className="auth-message">{message}</p>}

        <button className="auth-btn" type="submit" disabled={busy}>
          {busy ? '…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
        </button>

        <button type="button" className="auth-switch"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </form>
    </div>
  )
}