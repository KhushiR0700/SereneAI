import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { Shield, Key, Loader2, ArrowLeft, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react'

export default function MFASetup() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [factorId, setFactorId] = useState<string | null>(null)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  async function checkMFAStatus() {
    try {
      const { data } = await supabase.auth.mfa.listFactors()
      const factors = data?.all ?? []
      const hasMFA = factors.some((f) => f.status === 'verified')
      setMfaEnabled(hasMFA)
    } catch {
      // MFA might not be enabled for this project
    }
    setLoading(false)
  }

  async function enrollMFA() {
    setEnrolling(true)
    setError(null)

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'SereneAI Authenticator'
      })

      if (enrollError) {
        if (enrollError.message.includes('MFA') || enrollError.message.includes('not enabled')) {
          setError('Two-Factor Authentication is not enabled for this project. Please contact your administrator to enable MFA in Supabase Dashboard > Authentication > Providers.')
        } else {
          setError(enrollError.message)
        }
        setEnrolling(false)
        return
      }

      if (data) {
        setQrCode(data.totp.qr_code || null)
        setSecret(data.totp.secret || null)
        setFactorId(data.id)
      }
    } catch {
      setError('Failed to start MFA enrollment. Please try again.')
    }
    setEnrolling(false)
  }

  async function verifyMFA() {
    if (!verifyCode || verifyCode.length < 6) {
      setError('Please enter a 6-digit code from your authenticator app')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId!,
        code: verifyCode
      })

      if (verifyError) {
        setError('Invalid code. Please try again.')
        setVerifying(false)
        return
      }

      setSuccess('Two-Factor Authentication has been enabled successfully!')
      setMfaEnabled(true)
      setQrCode(null)
      setSecret(null)
      setTimeout(() => navigate('/settings'), 2000)
    } catch {
      setError('Verification failed. Please try again.')
    }
    setVerifying(false)
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '100px auto', textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} />
        <p style={{ marginTop: 16, color: 'var(--color-text-muted)' }}>Checking MFA status...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <button className="btn-ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 24 }}>
        <ArrowLeft size={18} /> Back to Settings
      </button>

      <div className="glass-card-static" style={{ padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,94,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} color="var(--color-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Two-Factor Authentication</h1>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {error && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, color: '#dc2626', lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {success && (
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, color: '#16a34a', lineHeight: 1.5 }}>{success}</p>
          </div>
        )}

        {mfaEnabled ? (
          <div>
            <div style={{ padding: 20, borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <CheckCircle2 size={20} color="#16a34a" />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Two-Factor Authentication is Enabled</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Your account is protected with an authenticator app. You'll need to enter a code from your app when signing in.
              </p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/settings')}>
              Back to Settings
            </button>
          </div>
        ) : qrCode ? (
          <div>
            <p style={{ fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'inline-block', padding: 16, background: 'white', borderRadius: 12 }}>
                <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180 }} />
              </div>
            </div>

            {secret && (
              <div style={{ marginBottom: 20, padding: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Or enter this code manually:</p>
                {secret}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>
                Enter the 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                className="glass-input"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{ width: '100%', padding: '12px 14px', fontSize: 18, letterSpacing: 4, textAlign: 'center' }}
                maxLength={6}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setQrCode(null); setSecret(null); setFactorId(null) }}>
                Cancel
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={verifyMFA} disabled={verifying || verifyCode.length < 6}>
                {verifying ? <Loader2 size={18} className="spinner" /> : 'Verify & Enable'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 15, marginBottom: 20, lineHeight: 1.6, color: 'var(--color-text-primary)' }}>
              Two-Factor Authentication adds an extra layer of security to your account. When enabled, you'll need to enter a code from an authenticator app when signing in.
            </p>

            <div style={{ padding: 20, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>How it works:</h4>
              <ol style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code we'll provide</li>
                <li>Enter the 6-digit code to verify</li>
                <li>Future sign-ins will require your code</li>
              </ol>
            </div>

            <button className="btn-primary" onClick={enrollMFA} disabled={enrolling} style={{ width: '100%', justifyContent: 'center' }}>
              {enrolling ? (
                <>
                  <Loader2 size={18} className="spinner" /> Setting up...
                </>
              ) : (
                <>
                  <Smartphone size={18} /> Enable Two-Factor Authentication
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
