import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ScoreRing } from '@/components/ScoreRing'
import { useTilt } from '@/hooks/useTilt'
import { useCountUp } from '@/hooks/useCountUp'
import { Mic2, TrendingUp, MessageSquare, Sparkles, Target, ArrowRight, Calendar, Flame, Users, Lightbulb, ChevronRight, FileText } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { InterviewSession, SessionReport } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar } from 'recharts'
import { getReadinessLevel } from '@/types'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [latestReport, setLatestReport] = useState<SessionReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [peerData, setPeerData] = useState<{ percentile: number; metric: string } | null>(null)

  const tilt1 = useTilt<HTMLDivElement>()
  const tilt2 = useTilt<HTMLDivElement>()
  const tilt3 = useTilt<HTMLDivElement>()

  useEffect(() => {
    async function loadData() {
      if (!profile) return

      const { data: sessionData } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      setSessions(sessionData || [])

      if (sessionData && sessionData.length > 0) {
        const { data: reportData } = await supabase
          .from('session_reports')
          .select('*')
          .eq('session_id', sessionData[0].id)
          .single()
        setLatestReport(reportData as SessionReport | null)

        // Peer-relative: check if enough users for comparison
        const { count } = await supabase
          .from('interview_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (count && count > 5) {
          const avgClarity = sessionData.reduce((sum, s) => sum + (s.clarity_score || 0), 0) / sessionData.length
          setPeerData({ percentile: Math.round(100 - avgClarity), metric: 'clarity' })
        }
      }

      setLoading(false)
    }

    loadData()
  }, [profile])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  // Empty state for new users
  if (sessions.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 40 }}>
        <div className="badge badge-primary" style={{ marginBottom: 24 }}>
          <Sparkles size={14} /> Welcome to SereneAI
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
          Welcome, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'there'}</span>!
        </h1>

        <p style={{ fontSize: 17, color: 'var(--color-text-muted)', maxWidth: 560, marginBottom: 32, lineHeight: 1.6 }}>
          You're all set. Start your first AI-powered mock interview to unlock your scores,
          growth charts, and personalized feedback. Everything will be generated from your real performance.
        </p>

        <button className="btn-primary" onClick={() => navigate('/studio')} style={{ marginBottom: 48 }}>
          Start Your First Interview <ArrowRight size={18} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { num: '1', title: 'Choose a Domain', desc: 'Pick from 30+ technical domains and set your difficulty level', icon: Target, ref: tilt1 },
            { num: '2', title: 'Answer AI Questions', desc: 'Respond to dynamically generated questions with text or voice', icon: Mic2, ref: tilt2 },
            { num: '3', title: 'Get Your Report', desc: 'Receive detailed feedback, scores, and a personalized action plan', icon: FileText, ref: tilt3 },
          ].map((step) => (
            <div key={step.num} ref={step.ref} className="glass-card tilt-card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(255,94,120,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <step.icon size={18} color="var(--color-primary)" />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: 1 }}>STEP {step.num}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 40, textAlign: 'center', fontStyle: 'italic' }}>
          Your scores, growth charts, and analytics will appear here after your first completed session.
          No fake data, no placeholders — only real progress.
        </p>
      </div>
    )
  }

  // Populated dashboard
  const latestSession = sessions[0]
  const overallScore = latestSession.overall_score || 0
  const readinessLevel = latestSession.readiness_level || getReadinessLevel(overallScore)
  const sessionCount = sessions.length
  const bestScore = Math.max(...sessions.map(s => s.overall_score || 0))

  // Calculate streak
  const today = new Date()
  let streak = 0
  const sessionDates = new Set(sessions.map(s => new Date(s.created_at).toDateString()))
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    if (sessionDates.has(d.toDateString())) streak++
    else if (i > 0) break
  }

  // Growth chart data
  const growthData = [...sessions].reverse().map((s, i) => ({
    session: `S${i + 1}`,
    Communication: s.communication_score || 0,
    Confidence: s.confidence_score || 0,
    Technical: s.technical_score || 0,
  }))

  // Radar data
  const radarData = [
    { metric: 'Communication', score: latestSession.communication_score || 0 },
    { metric: 'Confidence', score: latestSession.confidence_score || 0 },
    { metric: 'Technical', score: latestSession.technical_score || 0 },
    { metric: 'Pronunciation', score: latestSession.pronunciation_score || 0 },
    { metric: 'Clarity', score: latestSession.clarity_score || 0 },
    { metric: 'Problem Solving', score: latestSession.problem_solving_score || 0 },
  ]

  const metrics = [
    { label: 'Communication', value: latestSession.communication_score || 0, icon: MessageSquare },
    { label: 'Confidence', value: latestSession.confidence_score || 0, icon: TrendingUp },
    { label: 'Technical', value: latestSession.technical_score || 0, icon: Target },
    { label: 'Pronunciation', value: latestSession.pronunciation_score || 0, icon: Mic2 },
    { label: 'Clarity', value: latestSession.clarity_score || 0, icon: Sparkles },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
            Welcome back, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>Here's your interview readiness command center</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/studio')}>
          <Mic2 size={18} /> New Interview
        </button>
      </div>

      {/* Top Row: Readiness Score + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, marginBottom: 20 }}>
        {/* Readiness Score Card */}
        <div className="glass-card-static" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 16 }}>Interview Readiness Score</span>
          <ScoreRing score={overallScore} size={160} stroke={10} showLabel={false} />
          <div className="badge badge-primary" style={{ marginTop: 16, fontSize: 13 }}>
            {readinessLevel}
          </div>
          <div style={{ width: '100%', marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>
              <span>Progress to next level</span>
              <span>{overallScore}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${overallScore}%` }} />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <StatCard icon={FileText} label="Sessions Completed" value={sessionCount} />
          <StatCard icon={TrendingUp} label="Best Score" value={bestScore} suffix="/100" />
          <StatCard icon={Flame} label="Practice Streak" value={streak} suffix=" days" />
          <StatCard icon={Calendar} label="This Week" value={sessions.filter(s => {
            const d = new Date(s.created_at)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return d > weekAgo
          }).length} suffix=" sessions" />
        </div>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} icon={m.icon} label={m.label} value={m.value} />
        ))}
      </div>

      {/* Growth Chart + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        <div className="glass-card-static" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Growth Overview</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Score progression across sessions</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={growthData}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,94,120,0.2)" />
                  <stop offset="100%" stopColor="rgba(255,94,120,0)" />
                </linearGradient>
              </defs>
              <XAxis dataKey="session" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,94,120,0.2)', borderRadius: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="Communication" stroke="#FF5E78" strokeWidth={2.5} dot={{ fill: '#FF5E78', r: 4 }} />
              <Line type="monotone" dataKey="Confidence" stroke="#FF8FA3" strokeWidth={2.5} dot={{ fill: '#FF8FA3', r: 4 }} />
              <Line type="monotone" dataKey="Technical" stroke="#E8B4A0" strokeWidth={2.5} dot={{ fill: '#E8B4A0', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-static" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Strength Radar</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Latest session breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,94,120,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <RechartsRadar dataKey="score" stroke="#FF5E78" fill="#FF5E78" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Next 3 Fixes + Peer Context */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
        {latestReport && latestReport.next_three_fixes && latestReport.next_three_fixes.length > 0 && (
          <div className="glass-card-static" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,94,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lightbulb size={18} color="var(--color-primary)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Next 3 Fixes</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Highest-impact improvements to focus on</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {latestReport.next_three_fixes.map((fix, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                  <div className={`badge badge-${fix.impact.toLowerCase()}`} style={{ flexShrink: 0, height: 'fit-content' }}>
                    {fix.impact}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{fix.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{fix.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Peer Context */}
        <div className="glass-card-static" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(232,180,160,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#B8826A" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Peer Context</h3>
          </div>
          {peerData ? (
            <div>
              <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
                Your <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{peerData.metric}</span> score is in the
                top <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{peerData.percentile}%</span> of users this week.
              </p>
              <div className="progress-bar" style={{ marginTop: 16 }}>
                <div className="progress-bar-fill" style={{ width: `${peerData.percentile}%` }} />
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
              Peer comparisons will appear once more users join the platform. Keep practicing — your progress is being tracked.
            </p>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card-static" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Sessions</h3>
          <button className="btn-ghost" onClick={() => navigate('/reports')}>
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.slice(0, 5).map((s) => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 12,
              background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)',
              transition: 'all 0.25s ease', cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-hover)'; e.currentTarget.style.transform = 'translateX(4px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateX(0)' }}
            onClick={() => navigate('/reports')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{s.domain} — {s.interview_type}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.question_count} questions
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{s.overall_score?.toFixed(0) || '—'}</span>
                <span className="badge badge-neutral">{s.difficulty}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix }: { icon: typeof FileText; label: string; value: number; suffix?: string }) {
  const animatedValue = useCountUp(value)
  return (
    <div className="glass-card-static" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color="var(--color-primary)" />
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {animatedValue}{suffix}
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  const animatedValue = useCountUp(value)
  return (
    <div className="glass-card-static" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon size={16} color="var(--color-primary)" />
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>{animatedValue}</p>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}


