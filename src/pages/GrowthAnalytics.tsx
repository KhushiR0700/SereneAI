import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { TrendingUp, Calendar, Target, Mic2, Sparkles, ArrowRight, ChevronRight } from 'lucide-react'
import type { InterviewSession } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Area, AreaChart } from 'recharts'

export default function GrowthAnalytics() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: true })
      setSessions(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}><div className="spinner" /></div>

  if (sessions.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <TrendingUp size={36} color="var(--color-primary)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>No Analytics Yet</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          Your growth charts and analytics will appear here after your first completed session. No fake data, no placeholders — only real progress.
        </p>
        <button className="btn-primary" onClick={() => navigate('/studio')}>
          Start Your First Interview <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  const growthData = sessions.map((s, i) => ({
    session: `S${i + 1}`,
    Communication: s.communication_score || 0,
    Confidence: s.confidence_score || 0,
    Technical: s.technical_score || 0,
    Pronunciation: s.pronunciation_score || 0,
  }))

  const latest = sessions[sessions.length - 1]
  const radarData = [
    { metric: 'Communication', score: latest.communication_score || 0 },
    { metric: 'Confidence', score: latest.confidence_score || 0 },
    { metric: 'Technical', score: latest.technical_score || 0 },
    { metric: 'Pronunciation', score: latest.pronunciation_score || 0 },
    { metric: 'Clarity', score: latest.clarity_score || 0 },
    { metric: 'Problem Solving', score: latest.problem_solving_score || 0 },
  ]

  // Domain performance
  const domainMap: Record<string, { count: number; total: number }> = {}
  sessions.forEach(s => {
    if (!domainMap[s.domain]) domainMap[s.domain] = { count: 0, total: 0 }
    domainMap[s.domain].count++
    domainMap[s.domain].total += s.overall_score || 0
  })
  const domainData = Object.entries(domainMap).map(([domain, { count, total }]) => ({
    domain, avg: Math.round(total / count), count,
  })).sort((a, b) => b.avg - a.avg)

  // Practice consistency (last 30 days)
  const today = new Date()
  const consistencyData: { date: string; sessions: number; label: string }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toDateString()
    const count = sessions.filter(s => new Date(s.created_at).toDateString() === dateStr).length
    consistencyData.push({ date: dateStr, sessions: count, label: `${d.getMonth() + 1}/${d.getDate()}` })
  }

  // Strengths and weaknesses
  const avgScores = {
    communication: sessions.reduce((s, x) => s + (x.communication_score || 0), 0) / sessions.length,
    confidence: sessions.reduce((s, x) => s + (x.confidence_score || 0), 0) / sessions.length,
    technical: sessions.reduce((s, x) => s + (x.technical_score || 0), 0) / sessions.length,
    pronunciation: sessions.reduce((s, x) => s + (x.pronunciation_score || 0), 0) / sessions.length,
    clarity: sessions.reduce((s, x) => s + (x.clarity_score || 0), 0) / sessions.length,
    problem_solving: sessions.reduce((s, x) => s + (x.problem_solving_score || 0), 0) / sessions.length,
  }
  const sortedMetrics = Object.entries(avgScores).sort((a, b) => b[1] - a[1])
  const strengths = sortedMetrics.slice(0, 3)
  const weaknesses = sortedMetrics.slice(-3).reverse()

  const chartColors = {
    Communication: '#FF5E78',
    Confidence: '#FF8FA3',
    Technical: '#E8B4A0',
    Pronunciation: '#D4C9C5',
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Growth Analytics</h1>

      {/* Growth Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {(['Communication', 'Confidence', 'Technical', 'Pronunciation'] as const).map((metric) => (
          <div key={metric} className="glass-card-static" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{metric} Growth</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Progress over {sessions.length} sessions</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColors[metric]} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartColors[metric]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="session" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,94,120,0.2)', borderRadius: 12, fontSize: 13 }} />
                <Area type="monotone" dataKey={metric} stroke={chartColors[metric]} strokeWidth={2.5} fill={`url(#grad-${metric})`} dot={{ fill: chartColors[metric], r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Radar + Domain Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass-card-static" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Strength Radar</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Latest session breakdown</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,94,120,0.1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <Radar dataKey="score" stroke="#FF5E78" fill="#FF5E78" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card-static" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Domain Performance</h3>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Average scores by domain</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {domainData.map(d => (
              <div key={d.domain}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{d.domain}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{d.avg} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({d.count})</span></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${d.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Practice Consistency */}
      <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Calendar size={18} color="var(--color-primary)" />
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Practice Consistency</h3>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {consistencyData.map((d, i) => (
            <div
              key={i}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: d.sessions > 0 ? `rgba(255,94,120,${Math.min(0.2 + d.sessions * 0.2, 0.9)})` : 'rgba(255,94,120,0.05)',
                border: '1px solid rgba(255,94,120,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: d.sessions > 0 ? 'white' : 'var(--color-text-muted)',
                fontWeight: 600,
              }}
              title={`${d.label}: ${d.sessions} session(s)`}
            >
              {d.sessions > 0 ? d.sessions : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
          <span>Less</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0.05, 0.3, 0.5, 0.7, 0.9].map(op => (
              <div key={op} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(255,94,120,${op})` }} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="glass-card-static" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Strength Areas</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {strengths.map(([metric, score]) => (
              <div key={metric} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,94,120,0.05)', border: '1px solid rgba(255,94,120,0.1)' }}>
                <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{metric.replace('_', ' ')}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{Math.round(score)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-static" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Target size={18} color="#B8826A" />
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Areas to Improve</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weaknesses.map(([metric, score]) => (
              <div key={metric} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(232,180,160,0.08)', border: '1px solid rgba(232,180,160,0.15)' }}>
                <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{metric.replace('_', ' ')}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#B8826A' }}>{Math.round(score)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="glass-card-static" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Session History</h3>
          <button className="btn-ghost" onClick={() => navigate('/reports')}>View Reports <ChevronRight size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...sessions].reverse().map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic2 size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{s.domain} — {s.interview_type}</p>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.question_count} questions · {s.difficulty}</p>
                </div>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>{s.overall_score?.toFixed(0) || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
