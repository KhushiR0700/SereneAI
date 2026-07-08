import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signInWithGithub: () => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      // Profile might not exist yet for OAuth users — try to create it
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            target_role: '',
          })
          .select('*')
          .single()
        if (newProfile) return newProfile as Profile
      }
      return null
    }
    return data as Profile
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        const p = await fetchProfile(session.user.id)
        if (mounted) setProfile(p)
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        setSession(session)
        if (session?.user) {
          fetchProfile(session.user.id).then(p => {
            if (mounted) setProfile(p)
          })
        } else {
          if (mounted) setProfile(null)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign up failed. Please try again.' }
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    if (!data.session) return { error: 'Login failed. Please check your credentials.' }
    return { error: null }
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      const msg = error.message || ''
      if (msg.includes('provider') || msg.includes('not enabled') || msg.includes('OAuth provider')) {
        return { error: 'Google sign-in is not enabled for this project. Please use email/password sign in, or ask the project owner to enable Google OAuth in the Supabase dashboard.' }
      }
      return { error: msg }
    }
    return { error: null }
  }

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      const msg = error.message || ''
      if (msg.includes('provider') || msg.includes('not enabled') || msg.includes('OAuth provider')) {
        return { error: 'GitHub sign-in is not enabled for this project. Please use email/password sign in, or ask the project owner to enable GitHub OAuth in the Supabase dashboard.' }
      }
      return { error: msg }
    }
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.user) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (error) return { error: error.message }
    const p = await fetchProfile(session.user.id)
    setProfile(p)
    return { error: null }
  }

  const refreshProfile = async () => {
    if (session?.user) {
      const p = await fetchProfile(session.user.id)
      setProfile(p)
    }
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signUp, signIn, signInWithGoogle, signInWithGithub, resetPassword, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
