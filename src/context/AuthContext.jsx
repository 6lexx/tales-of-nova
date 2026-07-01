import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)        // 'player' | 'admin'
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

  // Charge le rôle (profiles.role) dès qu'une session existe
  useEffect(() => {
    if (!session?.user) { setRole(null); return }
    let actif = true
    supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => { if (actif) setRole(data?.role ?? 'player') })
    return () => { actif = false }
  }, [session])

  const value = {
    session,
    user: session?.user ?? null,
    role,
    isAdmin: role === 'admin',
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