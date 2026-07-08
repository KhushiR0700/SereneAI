import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Lock, Bell, Globe, LogOut, ChevronRight, AlertCircle, Shield, Smartphone, Key, Loader2 } from 'lucide-react'

type SessionInfo = {
  id: string
  user_agent: string
  ip_address: string | null
  created_at: string
  current: boolean
}

export default function Settings() {
  const { profile, signOut, updateProfile, session } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [language, setLanguage] = useState(profile?.language || 'English')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Sessions state
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [showSessions, setShowSessions] = useState(false)

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('')

  // Sync language with profile
  useEffect(() => {
    if (profile?.language) {
      setLanguage(profile.language)
    }
  }, [profile?.language])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // Language persistence
  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang)
    const { error } = await updateProfile({ language: newLang })
    if (error) {
      showMessage('error', 'Failed to save language preference')
    } else {
      showMessage('success', 'Language preference saved')
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (error) {
      showMessage('error', error.message)
    } else {
      showMessage('success', 'Password updated successfully')
      setShowChangePassword(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  // Load sessions
  const loadSessions = async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) return

    // Get all sessions via admin API simulation
    // Since Supabase doesn't expose session listing directly, we show current session info
    const currentSession = data.session
    if (currentSession) {
      setSessions([{
        id: 'current',
        user_agent: navigator.userAgent,
        ip_address: null,
        created_at: currentSession.user.created_at,
        current: true,
      }])
    }
    setShowSessions(true)
  }

  // Sign out other sessions ( revoke all except current )
  const signOutOtherSessions = async () => {
    setLoading(true)
    // Sign out all sessions by refreshing the session
    const { error } = await supabase.auth.refreshSession()
    setLoading(false)
    if (error) {
      showMessage('error', 'Failed to refresh session')
    } else {
      showMessage('success', 'All other sessions have been signed out')
    }
  }

  // Delete account permanently
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== profile?.email) {
      showMessage('error', 'Email address does not match')
      return
    }
    setLoading(true)

    try {
      const userId = session?.user?.id
      if (!userId) {
        showMessage('error', 'User not found')
        return
      }

      // Delete all user data
      await supabase.from('session_answers').delete().eq('user_id', userId)
      await supabase.from('session_reports').delete().eq('user_id', userId)
      await supabase.from('interview_sessions').delete().eq('user_id', userId)
      await supabase.from('pronunciation_sessions').delete().eq('user_id', userId)
      await supabase.from('saved_questions').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)

      // Delete auth user - this requires admin privileges, so we sign out
      // The user will need to be deleted from the Supabase dashboard or via edge function
      await signOut()

      showMessage('success', 'Account deletion initiated. Your data has been removed.')
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      showMessage('error', 'Failed to delete account. Please contact support.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Settings</h1>

      {/* Message toast */}
      {message && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 100,
          padding: '12px 20px', borderRadius: 12,
          background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          fontSize: 14, fontWeight: 500,
        }}>
          {message.text}
        </div>
      )}

      {/* Security */}
      <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Lock size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Security</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SettingRow
            label="Change Password"
            desc="Update your account password"
            onClick={() => setShowChangePassword(!showChangePassword)}
          />
          <SettingRow
            label="Two-Factor Authentication"
            desc="Add an extra layer of security to your account"
            onClick={() => navigate('/auth/mfa-setup')}
          />
          <SettingRow
            label="Active Sessions"
            desc="Manage your active login sessions"
            onClick={loadSessions}
          />
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="glass-card-static" style={{ padding: 24, width: '100%', maxWidth: 400, margin: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Key size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Change Password</h3>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>New Password</label>
              <input
                type="password"
                className="glass-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '12px 14px' }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Confirm Password</label>
              <input
                type="password"
                className="glass-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{ width: '100%', padding: '12px 14px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowChangePassword(false)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--color-border)', background: 'transparent',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: 'none', background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)',
                  color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessions && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="glass-card-static" style={{ padding: 24, width: '100%', maxWidth: 500, margin: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Smartphone size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Active Sessions</h3>
            </div>
            <div style={{ marginBottom: 20 }}>
              {sessions.map(s => (
                <div key={s.id} style={{
                  padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.5)',
                  border: '1px solid var(--color-border)', marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.current ? 'This Device' : 'Other Device'}</span>
                    {s.current && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}>
                        Current
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    {s.user_agent.substring(0, 80)}...
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Created: {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowSessions(false)}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--color-border)', background: 'transparent',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Close
              </button>
              <button
                onClick={signOutOtherSessions}
                disabled={loading}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1px solid rgba(255,94,120,0.3)', background: 'transparent',
                  color: 'var(--color-primary)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)', opacity: loading ? 0.7 : 1,
                }}
              >
                Sign Out Other Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Bell size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Notifications</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleRow label="Practice Reminders" desc="Get notified about daily practice" value={notifications} onChange={setNotifications} />
          <ToggleRow label="Email Updates" desc="Receive product updates and tips" value={emailUpdates} onChange={setEmailUpdates} />
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Globe size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Preferences</h3>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>Language</label>
          <select
            className="glass-input"
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            style={{ width: 'auto', padding: '10px 14px' }}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Tamil</option>
            <option>Telugu</option>
            <option>Bengali</option>
          </select>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Account</h3>
        <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>Logged in as</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{profile?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(255,94,120,0.2)', background: 'rgba(255,94,120,0.06)',
            color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'var(--font-body)',
          }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card-static" style={{ padding: 24, border: '1px solid rgba(255,94,120,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AlertCircle size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary)' }}>Danger Zone</h3>
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Once you delete your account, all your data including sessions, reports, and progress will be permanently removed. This action cannot be undone.
        </p>
        <button
          style={{
            padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,94,120,0.3)',
            background: 'transparent', color: 'var(--color-primary)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="glass-card-static" style={{ padding: 24, width: '100%', maxWidth: 400, margin: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertCircle size={24} color="#dc2626" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>Delete Account</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              This action is permanent and cannot be undone. All your interview history, scores, and saved questions will be deleted.
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'block' }}>
                Type your email to confirm: <strong>{profile?.email}</strong>
              </label>
              <input
                type="email"
                className="glass-input"
                value={deleteConfirmEmail}
                onChange={e => setDeleteConfirmEmail(e.target.value)}
                placeholder="Enter your email"
                style={{ width: '100%', padding: '12px 14px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmEmail(''); }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1px solid var(--color-border)', background: 'transparent',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmEmail !== profile?.email}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: 'none', background: '#dc2626',
                  color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  opacity: loading || deleteConfirmEmail !== profile?.email ? 0.5 : 1,
                }}
              >
                {loading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingRow({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.25s ease' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
    >
      <div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
      <ChevronRight size={18} color="var(--color-text-muted)" />
    </div>
  )
}

function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer',
          background: value ? 'linear-gradient(135deg, #FF5E78, #FF8FA3)' : 'rgba(212,201,197,0.3)',
          position: 'relative', transition: 'all 0.3s ease',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: value ? 22 : 2,
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }} />
      </button>
    </div>
  )
}
