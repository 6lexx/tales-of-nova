import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Accueil from './pages/Accueil'
import Characters from './pages/Characters'
import CreateCharacter from './pages/CreateCharacter'
import Campagnes from './pages/Campagnes'
import Profil from './pages/Profil'
import Parametres from './pages/Parametres'
import Game from './pages/Game'
import './styles/auth.css'
import './styles/app.css'

const protege = (el) => <ProtectedRoute>{el}</ProtectedRoute>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={protege(<Accueil />)} />
          <Route path="/personnages" element={protege(<Characters />)} />
          <Route path="/personnage/nouveau" element={protege(<CreateCharacter />)} />
          <Route path="/campagnes" element={protege(<Campagnes />)} />
          <Route path="/profil" element={protege(<Profil />)} />
          <Route path="/parametres" element={protege(<Parametres />)} />
          <Route path="/jeu/:id" element={protege(<Game />)} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}