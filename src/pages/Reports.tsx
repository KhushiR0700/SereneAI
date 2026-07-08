import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ScoreRing } from '@/components/ScoreRing'
import { jsPDF } from 'jspdf'
import {
  FileText, Download, ChevronRight, ArrowLeft, Play, Pause, Clock,
  CheckCircle2, AlertCircle, Lightbulb, TrendingUp, Target, MessageSquare,
  Sparkles, Volume2, Users,
} from 'lucide-react'
import type { InterviewSession, SessionReport, SessionAnswer, TimelineAnnotation } from '@/types'

export default function Reports() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null)
  const [report, setReport] = useState<SessionReport | null>(null)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    async function loadSessions() {
      if (!profile) return
      const { data } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      setSessions(data || [])
      setLoading(false)
    }
    loadSessions()
  }, [profile])

  const loadReport = async (session: InterviewSession) => {
    setSelectedSession(session)
    setReportLoading(true)
    setReport(null)
    setAnswers([])

    const [reportRes, answersRes] = await Promise.all([
      supabase.from('session_reports').select('*').eq('session_id', session.id).single(),
      supabase.from('session_answers').select('*').eq('session_id', session.id).order('answered_at', { ascending: true }),
    ])

    if (reportRes.data) setReport(reportRes.data as SessionReport)
    if (answersRes.data) setAnswers(answersRes.data as SessionAnswer[])
    setReportLoading(false)
  }

  const exportPDF = () => {
    if (!report || !selectedSession) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 30

    // Title
    doc.setFontSize(22)
    doc.setTextColor(255, 94, 120)
    doc.text('SereneAI Interview Report', margin, y)
    y += 10

    doc.setFontSize(11)
    doc.setTextColor(100, 100, 100)
    doc.text(`${selectedSession.domain} — ${selectedSession.interview_type} — ${selectedSession.difficulty}`, margin, y)
    y += 6
    doc.text(`Date: ${new Date(selectedSession.created_at).toLocaleDateString()}`, margin, y)
    y += 10

    // Overall Score
    doc.setFontSize(14)
    doc.setTextColor(43, 31, 36)
    doc.text(`Overall Score: ${selectedSession.overall_score?.toFixed(0) || 'N/A'}/100`, margin, y)
    y += 6
    doc.text(`Readiness Level: ${report.readiness_level || 'N/A'}`, margin, y)
    y += 10

    // Summary
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Overall Summary', margin, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const summaryLines = doc.splitTextToSize(report.overall_summary || '', pageWidth - 2 * margin)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 5

    // Scores
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Scores', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const scores = [
      `Communication: ${selectedSession.communication_score?.toFixed(0) || 'N/A'}`,
      `Confidence: ${selectedSession.confidence_score?.toFixed(0) || 'N/A'}`,
      `Technical: ${selectedSession.technical_score?.toFixed(0) || 'N/A'}`,
      `Pronunciation: ${selectedSession.pronunciation_score?.toFixed(0) || 'N/A'}`,
      `Clarity: ${selectedSession.clarity_score?.toFixed(0) || 'N/A'}`,
      `Problem Solving: ${selectedSession.problem_solving_score?.toFixed(0) || 'N/A'}`,
    ]
    scores.forEach(s => { doc.text(s, margin, y); y += 5 })
    y += 5

    // Strengths
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Strengths', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    report.strengths?.forEach(s => {
      const lines = doc.splitTextToSize(`• ${s}`, pageWidth - 2 * margin)
      doc.text(lines, margin, y)
      y += lines.length * 5
    })
    y += 5

    // Weaknesses
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Areas for Improvement', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    report.weaknesses?.forEach(w => {
      const lines = doc.splitTextToSize(`• ${w}`, pageWidth - 2 * margin)
      doc.text(lines, margin, y)
      y += lines.length * 5
    })
    y += 5

    // Next 3 Fixes
    if (y > 250) { doc.addPage(); y = 30 }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Top 3 Immediate Fixes', margin, y)
    y += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    report.next_three_fixes?.forEach(fix => {
      doc.setFont('helvetica', 'bold')
      doc.text(`[${fix.impact}] ${fix.title}`, margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(fix.detail, pageWidth - 2 * margin)
      doc.text(lines, margin, y)
      y += lines.length * 5 + 3
    })

    // Question-wise analysis
    if (report.question_analyses && report.question_analyses.length > 0) {
      if (y > 230) { doc.addPage(); y = 30 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(43, 31, 36)
      doc.text('Question-wise Analysis', margin, y)
      y += 7
      doc.setFontSize(10)
      report.question_analyses.forEach((qa, i) => {
        if (y > 240) { doc.addPage(); y = 30 }
        doc.setFont('helvetica', 'bold')
        doc.text(`Q${i + 1}: [${qa.difficulty}] Score: ${qa.score}/100`, margin, y)
        y += 5
        const qLines = doc.splitTextToSize(qa.question, pageWidth - 2 * margin)
        doc.setFont('helvetica', 'italic')
        doc.text(qLines, margin, y)
        y += qLines.length * 5 + 3
        doc.setFont('helvetica', 'bold')
        doc.text('Candidate Answer:', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        const ansLines = doc.splitTextToSize(qa.answer_summary, pageWidth - 2 * margin)
        doc.text(ansLines, margin, y)
        y += ansLines.length * 5 + 2
        doc.setFont('helvetica', 'bold')
        doc.text('Expected:', margin, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        const expLines = doc.splitTextToSize(qa.expected_summary, pageWidth - 2 * margin)
        doc.text(expLines, margin, y)
        y += expLines.length * 5 + 6
      })
    }

    // Hiring Recommendation
    if (report.hiring_recommendation) {
      if (y > 230) { doc.addPage(); y = 30 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Hiring Recommendation', margin, y)
      y += 7
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const recLines = doc.splitTextToSize(report.hiring_recommendation, pageWidth - 2 * margin)
      doc.text(recLines, margin, y)
      y += recLines.length * 5 + 5
      if (report.estimated_interview_level) {
        doc.setFont('helvetica', 'bold')
        doc.text(`Estimated Level: ${report.estimated_interview_level}`, margin, y)
        y += 7
      }
    }

    // Final Remarks
    if (report.final_interviewer_remarks) {
      if (y > 230) { doc.addPage(); y = 30 }
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Final Interviewer Remarks', margin, y)
      y += 7
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      const remLines = doc.splitTextToSize(report.final_interviewer_remarks, pageWidth - 2 * margin)
      doc.text(remLines, margin, y)
      y += remLines.length * 5 + 5
    }

    doc.save(`SereneAI-Report-${selectedSession.domain}-${new Date(selectedSession.created_at).toLocaleDateString()}.pdf`)
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}><div className="spinner" /></div>
  }

  // No sessions
  if (sessions.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <FileText size={36} color="var(--color-primary)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>No Reports Yet</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
          Complete your first interview session to generate a detailed report with scores, feedback, and personalized recommendations.
        </p>
        <button className="btn-primary" onClick={() => navigate('/studio')}>
          Start Interview <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  // Session list view
  if (!selectedSession) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Saved Reports</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="glass-card"
              onClick={() => loadReport(s)}
              style={{ padding: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={22} color="var(--color-primary)" />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{s.domain}{s.topic ? ` · ${s.topic}` : ''} — {s.interview_type}</p>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                    {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {s.question_count} questions · {s.difficulty}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ScoreRing score={s.overall_score || 0} size={56} stroke={5} showLabel={false} />
                <ChevronRight size={20} color="var(--color-text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Report detail view
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn-ghost" onClick={() => { setSelectedSession(null); setReport(null) }}>
          <ArrowLeft size={18} /> Back to Reports
        </button>
      </div>

      {reportLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', height: '40vh', alignItems: 'center' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{selectedSession.domain}</span>
                {selectedSession.topic && <span className="badge badge-neutral">{selectedSession.topic}</span>}
                <span className="badge badge-metallic">{selectedSession.difficulty}</span>
                <span className="badge badge-neutral">{selectedSession.interview_type}</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Interview Report</h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                {new Date(selectedSession.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · {selectedSession.question_count} questions
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <ScoreRing score={selectedSession.overall_score || 0} size={100} stroke={7} showLabel={false} />
              <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={() => window.print()} style={{ padding: '10px 16px' }}>
                Print
              </button>
              <button className="btn-primary" onClick={exportPDF}>
                <Download size={18} /> Export PDF
              </button>
            </div>
            </div>
          </div>

          {/* Readiness Level */}
          <div className="glass-card-static" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={26} color="var(--color-primary)" />
            </div>
            <div>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>Interview Readiness Level</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>{report?.readiness_level || 'N/A'}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>Recruiter Impression Score</p>
              <p style={{ fontSize: 22, fontWeight: 700 }}>{report?.recruiter_impression_score?.toFixed(0) || 'N/A'}/100</p>
            </div>
          </div>

          {/* Score Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Communication', value: selectedSession.communication_score },
              { label: 'Confidence', value: selectedSession.confidence_score },
              { label: 'Technical', value: selectedSession.technical_score },
              { label: 'Pronunciation', value: selectedSession.pronunciation_score },
              { label: 'Clarity', value: selectedSession.clarity_score },
              { label: 'Problem Solving', value: selectedSession.problem_solving_score },
            ].map(m => (
              <div key={m.label} className="glass-card-static" style={{ padding: 16, textAlign: 'center' }}>
                <ScoreRing score={m.value || 0} size={80} stroke={6} label={m.label} />
              </div>
            ))}
          </div>

          {/* Summary */}
          {report?.overall_summary && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Overall Summary</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>{report.overall_summary}</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="glass-card-static" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle2 size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Strengths</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report?.strengths?.map((s, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,94,120,0.05)', border: '1px solid rgba(255,94,120,0.1)' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.5 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card-static" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertCircle size={20} color="#B8826A" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Areas for Improvement</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report?.weaknesses?.map((w, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(232,180,160,0.08)', border: '1px solid rgba(232,180,160,0.15)' }}>
                    <p style={{ fontSize: 14, lineHeight: 1.5 }}>{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {[
              { title: 'Communication Analysis', text: report?.communication_analysis, icon: MessageSquare },
              { title: 'Technical Analysis', text: report?.technical_analysis, icon: Target },
              { title: 'Confidence Analysis', text: report?.confidence_analysis, icon: TrendingUp },
              { title: 'Pronunciation Analysis', text: report?.pronunciation_analysis, icon: Volume2 },
            ].map((section) => (
              <div key={section.title} className="glass-card-static" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <section.icon size={18} color="var(--color-primary)" />
                  <h3 style={{ fontSize: 15, fontWeight: 600 }}>{section.title}</h3>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>{section.text || 'N/A'}</p>
              </div>
            ))}
          </div>

          {/* Next 3 Fixes */}
          {report?.next_three_fixes && report.next_three_fixes.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,94,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Next 3 Fixes</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Prioritized by impact — focus on these first</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {report.next_three_fixes.map((fix, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                    <div className={`badge badge-${fix.impact.toLowerCase()}`} style={{ flexShrink: 0, height: 'fit-content' }}>{fix.impact}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{fix.title}</p>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{fix.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional analysis sections */}
          {(report?.grammar_analysis || report?.vocabulary_analysis || report?.problem_solving_analysis || report?.professionalism_analysis) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {[
                { title: 'Grammar Analysis', text: report?.grammar_analysis },
                { title: 'Vocabulary Analysis', text: report?.vocabulary_analysis },
                { title: 'Problem Solving', text: report?.problem_solving_analysis },
                { title: 'Professionalism', text: report?.professionalism_analysis },
              ].filter(s => s.text).map((section) => (
                <div key={section.title} className="glass-card-static" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{section.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>{section.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Question-wise Analysis */}
          {report?.question_analyses && report.question_analyses.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,94,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={18} color="var(--color-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>Question-wise Analysis</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Detailed breakdown of each answer</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {report.question_analyses.map((qa, i) => (
                  <div key={i} style={{ padding: '18px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>Q{i + 1}</span>
                          <span className="badge badge-primary">{qa.domain}</span>
                          <span className="badge badge-metallic">{qa.difficulty}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{qa.question}</p>
                      </div>
                      <div style={{ textAlign: 'center', marginLeft: 20, flexShrink: 0 }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: qa.score >= 70 ? 'var(--color-primary)' : qa.score >= 50 ? '#B8826A' : '#C0503A' }}>{qa.score}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>/ 100</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,94,120,0.04)', border: '1px solid rgba(255,94,120,0.1)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>CANDIDATE ANSWER</p>
                        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{qa.answer_summary}</p>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(212,201,197,0.12)', border: '1px solid rgba(212,201,197,0.3)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>EXPECTED ANSWER</p>
                        <p style={{ fontSize: 13, lineHeight: 1.5 }}>{qa.expected_summary}</p>
                      </div>
                    </div>
                    {(qa.strengths?.length > 0 || qa.weaknesses?.length > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {qa.strengths?.length > 0 && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>STRENGTHS</p>
                            {qa.strengths.map((s, j) => <p key={j} style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 3, paddingLeft: 10, borderLeft: '2px solid rgba(255,94,120,0.3)' }}>{s}</p>)}
                          </div>
                        )}
                        {qa.weaknesses?.length > 0 && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>WEAKNESSES</p>
                            {qa.weaknesses.map((w, j) => <p key={j} style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 3, paddingLeft: 10, borderLeft: '2px solid rgba(232,180,160,0.5)' }}>{w}</p>)}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Keywords */}
                    {((qa.keywords_used?.length ?? 0) > 0 || (qa.keywords_missed?.length ?? 0) > 0) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                        {(qa.keywords_used?.length ?? 0) > 0 && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>KEYWORDS USED</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {qa.keywords_used!.map((kw, j) => <span key={j} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(255,94,120,0.07)', border: '1px solid rgba(255,94,120,0.2)', color: 'var(--color-primary)' }}>{kw}</span>)}
                            </div>
                          </div>
                        )}
                        {(qa.keywords_missed?.length ?? 0) > 0 && (
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>KEYWORDS MISSED</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {qa.keywords_missed!.map((kw, j) => <span key={j} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(232,180,160,0.1)', border: '1px solid rgba(232,180,160,0.3)', color: '#B8826A' }}>{kw}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Missing concepts */}
                    {qa.missing_concepts && qa.missing_concepts.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>MISSING CONCEPTS</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {qa.missing_concepts.map((mc, j) => <span key={j} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: 'rgba(180,160,232,0.1)', border: '1px solid rgba(180,160,232,0.3)', color: '#7B5CB8' }}>{mc}</span>)}
                        </div>
                      </div>
                    )}
                    {/* Speaking time */}
                    {(qa.speaking_time_seconds || qa.ideal_speaking_time) && (
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-border)' }}>
                        {qa.speaking_time_seconds && (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>SPEAKING TIME: </span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{qa.speaking_time_seconds}s</span>
                          </div>
                        )}
                        {qa.ideal_speaking_time && (
                          <div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>IDEAL: </span>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{qa.ideal_speaking_time}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Model answer */}
                    {qa.model_answer && (
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>MODEL ANSWER</p>
                        <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>{qa.model_answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hiring Recommendation */}
          {report?.hiring_recommendation && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Users size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Hiring Recommendation</h3>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7 }}>{report.hiring_recommendation}</p>
              {report.estimated_interview_level && (
                <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
                  <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,94,120,0.06)', border: '1px solid rgba(255,94,120,0.15)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4 }}>ESTIMATED LEVEL</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-primary)' }}>{report.estimated_interview_level}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top 5 Improvement Areas */}
          {report?.top_5_improvement_areas && report.top_5_improvement_areas.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Top 5 Improvement Areas</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.top_5_improvement_areas.map((area, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{i + 1}</div>
                    <p style={{ fontSize: 14, lineHeight: 1.5 }}>{area}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Practice Plan */}
          {report?.suggested_practice_plan && report.suggested_practice_plan.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>Suggested Practice Plan</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.suggested_practice_plan.map((week, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{i + 1}</div>
                    <p style={{ fontSize: 13, lineHeight: 1.5 }}>{week}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Interviewer Remarks */}
          {report?.final_interviewer_remarks && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Final Interviewer Remarks</h3>
              <p style={{ fontSize: 14, lineHeight: 1.75, fontStyle: 'italic', color: 'var(--color-text-muted)', borderLeft: '3px solid rgba(255,94,120,0.3)', paddingLeft: 16 }}>{report.final_interviewer_remarks}</p>
            </div>
          )}

          {/* Action Plan */}
          {report?.action_plan && report.action_plan.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Action Plan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.action_plan.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>{i + 1}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{action.action}</p>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{action.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Replay with Commentary - only for voice-mode answers */}
          {answers.length > 0 && answers.some(a => a.answer_mode === 'voice') && <InterviewReplay answers={answers.filter(a => a.answer_mode === 'voice')} />}
        </>
      )}
    </div>
  )
}

function InterviewReplay({ answers }: { answers: SessionAnswer[] }) {
  const [selectedAnswer, setSelectedAnswer] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  const current = answers[selectedAnswer]
  const annotations = current?.timeline_annotations || []
  const maxTime = current?.duration_seconds || 60

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= maxTime) {
          setPlaying(false)
          return maxTime
        }
        return prev + 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [playing, maxTime])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="glass-card-static" style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,94,120,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={18} color="var(--color-primary)" />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>Interview Replay with Commentary</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Director's commentary on your answers — timestamped insights</p>
        </div>
      </div>

      {/* Answer selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {answers.map((a, i) => (
          <button
            key={i}
            onClick={() => { setSelectedAnswer(i); setCurrentTime(0); setPlaying(false) }}
            style={{
              padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
              border: selectedAnswer === i ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: selectedAnswer === i ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
              color: selectedAnswer === i ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            Q{i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>Question {selectedAnswer + 1}</p>
        <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{current?.question_text}</p>
      </div>

      {/* Timeline scrubber */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => setPlaying(!playing)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255,94,120,0.25)',
            }}
          >
            {playing ? <Pause size={18} color="white" /> : <Play size={18} color="white" />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ position: 'relative', height: 6, background: 'rgba(255,94,120,0.08)', borderRadius: 100, overflow: 'hidden' }}>
              <div className="progress-bar-fill" style={{ width: `${(currentTime / maxTime) * 100}%`, height: '100%', borderRadius: 100 }} />
            </div>
            {/* Annotation markers */}
            {annotations.map((ann, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', top: -2,
                  left: `${(ann.time / maxTime) * 100}%`,
                  width: 10, height: 10, borderRadius: '50%',
                  background: ann.type === 'positive' ? '#FF5E78' : ann.type === 'negative' ? '#E8B4A0' : '#D4C9C5',
                  border: '2px solid white',
                  transform: 'translateX(-50%)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-text-muted)' }}>
            {formatTime(currentTime)} / {formatTime(maxTime)}
          </span>
        </div>
      </div>

      {/* Active annotations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {annotations.filter(a => a.time <= currentTime).map((ann, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{
              display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 12,
              background: ann.type === 'positive' ? 'rgba(255,94,120,0.06)' : ann.type === 'negative' ? 'rgba(232,180,160,0.08)' : 'rgba(212,201,197,0.08)',
              border: `1px solid ${ann.type === 'positive' ? 'rgba(255,94,120,0.15)' : ann.type === 'negative' ? 'rgba(232,180,160,0.2)' : 'rgba(212,201,197,0.2)'}`,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatTime(ann.time)}</span>
            <p style={{ fontSize: 14, lineHeight: 1.5 }}>{ann.text}</p>
          </div>
        ))}
        {annotations.filter(a => a.time <= currentTime).length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
            Press play to see timestamped commentary on your answer
          </p>
        )}
      </div>
    </div>
  )
}
