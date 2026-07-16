import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  PREFERENCES_DEFAUT, fusionner,
  sauverPreferences as ecrirePreferences,
  sauverPseudo as ecrirePseudo,
} from '../services/preferencesService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)        // 'player' | 'admin'
  const [pseudo, setPseudo] = useState(null)
  const [preferences, setPreferences] = useState(PREFERENCES_DEFAUT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Session en cours au chargement
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // Mises à jour (login, logout, refresh de token)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Charge le profil (role, pseudo, preferences) dès qu'une session existe.
  // Un seul select : les préférences voyagent avec le rôle, aucune requête en plus.
  useEffect(() => {
    if (!session?.user) {
      setRole(null)
      setPseudo(null)
      setPreferences(PREFERENCES_DEFAUT)
      return
    }
    let actif = true
    supabase
      .from('profiles')
      .select('role, pseudo, preferences')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!actif) return
        setRole(data?.role ?? 'player')
        setPseudo(data?.pseudo ?? null)
        // fusionner() tolère null, {} ou un objet partiel : la colonne vaut '{}'
        // pour tous les comptes existants.
        setPreferences(fusionner(data?.preferences))
      })
    return () => { actif = false }
  }, [session])

  // Écrit un patch partiel et rafraîchit l'état local : toutes les vues qui lisent
  // `preferences` se resynchronisent sans rechargement ni second appel.
  async function majPreferences(patch) {
    if (!session?.user) return preferences
    const nouvelles = await ecrirePreferences(session.user.id, patch)
    setPreferences(nouvelles)
    return nouvelles
  }

  async function majPseudo(valeur) {
    if (!session?.user) return pseudo
    const v = await ecrirePseudo(session.user.id, valeur)
    setPseudo(v)
    return v
  }

  const value = {
    session,
    user: session?.user ?? null,
    role,
    isAdmin: role === 'admin',
    pseudo,
    preferences,
    majPreferences,
    majPseudo,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}