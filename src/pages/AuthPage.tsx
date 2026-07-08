import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Mic, TrendingUp, FileText, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useTilt } from '@/hooks/useTilt'

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle, signInWithGithub, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  const featureTilt1 = useTilt<HTMLDivElement>()
  const featureTilt2 = useTilt<HTMLDivElement>()
  const featureTilt3 = useTilt<HTMLDivElement>()

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null)
    setOauthLoading(true)
    const fn = provider === 'google' ? signInWithGoogle : signInWithGithub
    try {
      const { error } = await fn()
      if (error) {
        setError(error)
        setOauthLoading(false)
      }
      // If no error, browser will redirect to OAuth provider
      // Keep oauthLoading=true during redirect
    } catch (err) {
      setError(`Failed to initiate ${provider} sign in. Please try again.`)
      setOauthLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address')
      return
    }
    setForgotLoading(true)
    const { error } = await resetPassword(forgotEmail.trim())
    setForgotLoading(false)
    if (error) {
      setForgotError(error)
    } else {
      setForgotSent(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup') {
      if (!fullName.trim()) return setError('Please enter your name')
      if (!email.trim()) return setError('Please enter your email')
      if (password.length < 6) return setError('Password must be at least 6 characters')
      if (password !== confirmPassword) return setError('Passwords do not match')
      if (!agreeTerms) return setError('Please accept the terms to continue')
    } else {
      if (!email.trim()) return setError('Please enter your email')
      if (!password) return setError('Please enter your password')
    }

    setLoading(true)
    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const features = [
    { icon: Mic, title: 'Voice Interview Mode', tiltRef: featureTilt1 },
    { icon: TrendingUp, title: 'Growth Analytics', tiltRef: featureTilt2 },
    { icon: FileText, title: 'Smart Reports', tiltRef: featureTilt3 },
  ]

  // Loading overlay for OAuth redirects
  if (oauthLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'linear-gradient(135deg, #FAF7F5 0%, #F5EFEC 100%)',
        fontFamily: 'var(--font-body)',
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Redirecting to sign in...
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Left Panel */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 64px',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #FF5E78, #E8B4A0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(255,94,120,0.3)',
          }}>
            <Mic size={22} color="white" />
          </div>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>SereneAI</span>
        </div>

        <div className="badge badge-primary" style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
          AI Interview Intelligence Platform
        </div>

        <h1 style={{
          fontSize: 48, fontWeight: 700, lineHeight: 1.15,
          color: 'var(--color-text-primary)', marginBottom: 20, fontFamily: 'var(--font-display)',
        }}>
          Become the candidate<br />
          <span className="gradient-text">interviewers remember.</span>
        </h1>

        <p style={{
          fontSize: 17, color: 'var(--color-text-muted)', lineHeight: 1.6,
          maxWidth: 420, marginBottom: 40,
        }}>
          Practice with AI-powered mock interviews, get real-time voice evaluation,
          pronunciation analysis, and personalized feedback that actually helps you improve.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {features.map((f, i) => (
            <div
              key={i}
              ref={f.tiltRef}
              className="glass-card tilt-card"
              style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(255,94,120,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={18} color="var(--color-primary)" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{f.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div style={{
        flex: '1 1 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}>
        <div className="glass-card-static" style={{
          width: '100%', maxWidth: 440, padding: 40,
          borderRadius: 24,
        }}>
          {/* Toggle */}
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'rgba(255,94,120,0.06)',
            borderRadius: 100, marginBottom: 32,
          }}>
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null) }}
                style={{
                  flex: 1, padding: '10px 20px', borderRadius: 100,
                  border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.3s ease', fontFamily: 'var(--font-body)',
                  background: mode === m ? 'linear-gradient(135deg, #FF5E78, #FF8FA3)' : 'transparent',
                  color: mode === m ? 'white' : 'var(--color-text-muted)',
                  boxShadow: mode === m ? '0 4px 12px rgba(255,94,120,0.25)' : 'none',
                }}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-primary)' }}>
            {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
            {mode === 'signin' ? 'Sign in to continue your interview prep' : 'Create an account to get started'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6, display: 'block' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    className="glass-input"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6, display: 'block' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="glass-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="glass-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} color="var(--color-text-muted)" /> : <Eye size={18} color="var(--color-text-muted)" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6, display: 'block' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    className="glass-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: 42 }}
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--color-primary)' }}
                />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
            )}

            {mode === 'signin' && (
              <div style={{ textAlign: 'right' }}>
                <button type="button" className="btn-ghost" style={{ padding: '4px 0', color: 'var(--color-primary)' }} onClick={() => { setForgotMode(true); setForgotSent(false); setForgotError(null) }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,94,120,0.08)',
                border: '1px solid rgba(255,94,120,0.2)',
                fontSize: 13, color: 'var(--color-primary)',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(232,180,160,0.3)' }} />
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(232,180,160,0.3)' }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOAuth('google')} disabled={loading || oauthLoading} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOAuth('github')} disabled={loading || oauthLoading} type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-text-primary)"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33s1.7.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>
              GitHub
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotMode && (
        <div
          onClick={() => setForgotMode(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(43, 31, 36, 0.4)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card-static"
            style={{
              width: '100%', maxWidth: 420, padding: 36, borderRadius: 20,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setForgotMode(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} color="var(--color-text-muted)" />
            </button>

            {forgotSent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(255,94,120,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <CheckCircle2 size={28} color="var(--color-primary)" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Check your email</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                  We've sent a password reset link to <strong style={{ color: 'var(--color-text-primary)' }}>{forgotEmail}</strong>.
                  Click the link in the email to reset your password.
                </p>
                <button className="btn-primary" onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail('') }} style={{ justifyContent: 'center' }}>
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Reset Password</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6, display: 'block' }}>Email</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        className="glass-input"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{ paddingLeft: 42 }}
                        autoFocus
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div style={{
                      padding: '12px 16px', borderRadius: 12,
                      background: 'rgba(255,94,120,0.08)',
                      border: '1px solid rgba(255,94,120,0.2)',
                      fontSize: 13, color: 'var(--color-primary)',
                    }}>
                      {forgotError}
                    </div>
                  )}
                  <button type="submit" className="btn-primary" disabled={forgotLoading} style={{ justifyContent: 'center' }}>
                    {forgotLoading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <>Send Reset Link <ArrowRight size={18} /></>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
