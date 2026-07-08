import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

function parseOAuthError(): string | null {
  // Check URL hash for error parameters (Supabase uses fragment)
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const errorParam = params.get('error')
  const errorDesc = params.get('error_description')

  if (errorParam) {
    if (errorParam === 'access_denied') {
      return 'Sign in was cancelled or denied. Please try again.'
    }
    if (errorParam === 'unauthorized_client') {
      return 'OAuth provider is not properly configured. Please use email/password sign in.'
    }
    if (errorParam === 'unsupported_response_type') {
      return 'OAuth configuration error. Please contact support.'
    }
    if (errorDesc) {
      return decodeURIComponent(errorDesc.replace(/\+/g, ' '))
    }
    return `Authentication error: ${errorParam}`
  }

  // Check query string for error parameters
  const query = new URLSearchParams(window.location.search)
  const queryError = query.get('error')
  const queryDesc = query.get('error_description')

  if (queryError) {
    if (queryError === 'access_denied') {
      return 'Sign in was cancelled or denied. Please try again.'
    }
    if (queryDesc) {
      return decodeURIComponent(queryDesc.replace(/\+/g, ' '))
    }
    return `Authentication error: ${queryError}`
  }

  return null
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    // Check for OAuth errors in URL first
    const oauthError = parseOAuthError()
    if (oauthError) {
      console.error('OAuth error from URL:', oauthError)
      setError(oauthError)
      return
    }

    let done = false
    let subscription: { unsubscribe: () => void } | null = null

    function finish(path: string) {
      if (done) return
      done = true
      subscription?.unsubscribe()
      navigate(path, { replace: true })
    }

    async function handleCallback() {
      try {
        setStatus('Checking session...')

        // detectSessionInUrl is true, so Supabase auto-exchanges the PKCE code.
        // getSession() will resolve once the exchange completes (may take a moment).
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (done) return

        if (sessionError) {
          console.error('Session error:', sessionError)
          const msg = sessionError.message || ''
          if (msg.includes('provider') || msg.includes('not enabled') || msg.includes('OAuth')) {
            setError('OAuth provider is not configured for this project. Please use email/password sign in, or enable the OAuth provider in Supabase Dashboard > Authentication > Providers.')
          } else if (msg.includes('PKCE') || msg.includes('code')) {
            setError('Authentication code exchange failed. Please try signing in again.')
          } else {
            setError(msg || 'Authentication failed. Please try again.')
          }
          return
        }

        if (session) {
          setStatus('Session established, redirecting...')
          finish('/dashboard')
          return
        }

        // Session not ready yet — listen for the SIGNED_IN event
        setStatus('Waiting for authentication...')
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, sess) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && sess) {
            finish('/dashboard')
          } else if (event === 'SIGNED_OUT') {
            setError('Sign in was not completed. Please try again.')
          }
        })
        subscription = sub

        // Safety timeout — if nothing happens in 15s, show error
        setTimeout(() => {
          if (!done) {
            setError('Authentication timed out. This could mean the OAuth provider is not enabled in Supabase Dashboard. Please check Authentication > Providers in your Supabase project settings.')
          }
        }, 15000)
      } catch (err) {
        console.error('Auth callback error:', err)
        if (!done) {
          setError('Authentication failed. Please try signing in again.')
        }
      }
    }

    handleCallback()

    return () => {
      done = true
      subscription?.unsubscribe()
    }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'var(--font-body)',
      background: 'linear-gradient(135deg, #FAF7F5 0%, #F5EFEC 100%)',
    }}>
      {error ? (
        <>
          <div style={{
            maxWidth: 450,
            padding: '24px 32px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            textAlign: 'center',
          }}>
            <p style={{ color: 'var(--color-primary)', fontSize: 15, fontWeight: 500, marginBottom: 16, lineHeight: 1.6 }}>
              {error}
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/', { replace: true })}
              style={{ marginBottom: 12 }}
            >
              Back to Login
            </button>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Need help? Make sure OAuth providers are enabled in Supabase Dashboard {'>'} Authentication {'>'} Providers
            </p>
          </div>
        </>
      ) : (
        <>
          <Spinner />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {status}
          </p>
        </>
      )}
    </div>
  )
}
