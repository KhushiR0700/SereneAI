import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { User, Mail, Briefcase, GraduationCap, Save, CheckCircle2, Clock, FileText, Mic } from 'lucide-react'
import type { InterviewSession } from '@/types'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [targetRole, setTargetRole] = useState(profile?.target_role || 'Software Engineer')
  const [university, setUniversity] = useState(profile?.university || '')
  const [graduationYear, setGraduationYear] = useState(profile?.graduation_year?.toString() || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sessions, setSessions] = useState<InterviewSession[]>([])

  useEffect(() => {
    async function loadSessions() {
      if (!profile) return
      const { data } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setSessions(data || [])
    }
    loadSessions()
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await updateProfile({
      full_name: fullName,
      target_role: targetRole,
      university,
      graduation_year: graduationYear ? parseInt(graduationYear) : null,
    })
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Profile</h1>

      {/* Profile Header */}
      <div className="glass-card-static" style={{ padding: 28, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF5E78, #E8B4A0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 32, fontWeight: 700, flexShrink: 0,
        }}>
          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{profile?.full_name || 'User'}</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>{profile?.email}</p>
          <p style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 4 }}>{targetRole}</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Edit Profile</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={15} color="var(--color-text-muted)" /> Full Name
            </label>
            <input className="glass-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={15} color="var(--color-text-muted)" /> Email
            </label>
            <input className="glass-input" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={15} color="var(--color-text-muted)" /> Target Role
            </label>
            <input className="glass-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={15} color="var(--color-text-muted)" /> University
              </label>
              <input className="glass-input" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="Your university" />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={15} color="var(--color-text-muted)" /> Graduation Year
              </label>
              <input className="glass-input" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="2025" type="number" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : <><Save size={18} /> Save Changes</>}
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-primary)', fontSize: 14 }}>
                <CheckCircle2 size={18} /> Saved successfully
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Practice History */}
      <div className="glass-card-static" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Practice History</h3>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>
            No practice sessions yet. Start your first interview to see your history here.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.slice(0, 10).map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.status === 'completed' ? <FileText size={16} color="var(--color-primary)" /> : <Clock size={16} color="var(--color-text-muted)" />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{s.domain} — {s.interview_type}</p>
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(s.created_at).toLocaleDateString()} · {s.question_count} questions · {s.status}</p>
                  </div>
                </div>
                {s.overall_score && <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>{s.overall_score.toFixed(0)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
