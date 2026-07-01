import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Accueil from './pages/Accueil'
import Characters from './pages/Characters'
import Campagnes from './pages/Campagnes'
import Profil from './pages/Profil'
import Parametres from './pages/Parametres'
import './styles/auth.css'
import './styles/app.css'

const Game = lazy(() => import('./pages/Game'))
const CharacterCreator = lazy(() => import('./pages/CharacterCreator'))
const NouvelleCampagne = lazy(() => import('./pages/NouvelleCampagne'))

const protege = (el) => <ProtectedRoute>{el}</ProtectedRoute>

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="loading-screen">Chargement…</div>}>
          <Routes>
            <Route path="/login"              element={<Login />} />
            <Route path="/"                   element={protege(<Accueil />)} />
            <Route path="/personnages"        element={protege(<Characters />)} />
            <Route path="/personnage/nouveau" element={protege(<CharacterCreator />)} />
            <Route path="/campagnes"          element={protege(<Campagnes />)} />
            <Route path="/campagne/nouvelle/:id" element={protege(<NouvelleCampagne />)} />
            <Route path="/profil"             element={protege(<Profil />)} />
            <Route path="/parametres"         element={protege(<Parametres />)} />
            <Route path="/jeu/:id"            element={protege(<Game />)} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}