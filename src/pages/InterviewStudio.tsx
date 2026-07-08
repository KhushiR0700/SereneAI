import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateQuestion, evaluateAnswer, generateReport } from '@/lib/api'
import { ScoreRing } from '@/components/ScoreRing'
import { DOMAINS, DIFFICULTIES, INTERVIEW_TYPES, getReadinessLevel, getTopicsForDomain } from '@/types'
import type { QuestionFeedback, ScoreSet, TimelineAnnotation } from '@/types'
import {
  Mic2, Search, ArrowRight, ArrowLeft, SkipForward, RefreshCw, FileText,
  CheckCircle2, ChevronDown, ChevronUp, Clock, X, MessageSquare, Sparkles,
  Lightbulb, BookOpen, Volume2, Square, AlertCircle, Target,
} from 'lucide-react'

type Phase = 'config' | 'interview' | 'feedback'

interface AnswerRecord {
  question: string
  answer: string
  scores: ScoreSet
  feedback: string
  feedback_detail?: QuestionFeedback['feedback_detail']
  score_breakdown?: QuestionFeedback['score_breakdown']
  follow_up_question: string
  model_answer: string
  example_answer?: string
  keywords_used?: string[]
  keywords_missed?: string[]
  speaking_time_seconds?: number
  ideal_speaking_time?: string
  ideal_answer?: QuestionFeedback['ideal_answer']
  domain: string
  difficulty: string
  type: string
  topic: string | null
  duration: number
  timeline_annotations: TimelineAnnotation[]
}

export default function InterviewStudio() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [phase, setPhase] = useState<Phase>('config')
  const [domain, setDomain] = useState('General')
  const [difficulty, setDifficulty] = useState<string>('Medium')
  const [interviewType, setInterviewType] = useState<string>('Technical')
  const [topic, setTopic] = useState<string>('')
  const [domainSearch, setDomainSearch] = useState('')

  // Interview state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null)
  const [questionMeta, setQuestionMeta] = useState<{ domain: string; difficulty: string; type: string; topic: string | null } | null>(null)
  const [answer, setAnswer] = useState('')
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([])
  const previousQuestionsRef = useRef<string[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionStart, setSessionStart] = useState<number>(0)
  const [elapsed, setElapsed] = useState(0)
  const [answerStart, setAnswerStart] = useState<number>(0)
  const [expandedSection, setExpandedSection] = useState<string | null>('feedback')
  const [showExampleAnswer, setShowExampleAnswer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDuration, setCurrentDuration] = useState(0)

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const recognitionRef = useRef<unknown>(null)
  const timerRef = useRef<unknown>(null)

  const filteredDomains = DOMAINS.filter(d => d.toLowerCase().includes(domainSearch.toLowerCase()))

  // Timer
  useEffect(() => {
    if (phase === 'interview' && sessionStart) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - sessionStart) / 1000))
      }, 1000)
      return () => clearInterval(timerRef.current as number)
    }
  }, [phase, sessionStart])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const startInterview = async () => {
    if (!profile) return
    setError(null)

    // Create session in DB
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: profile.id,
        domain,
        difficulty,
        interview_type: interviewType,
        topic: topic || null,
        status: 'in_progress',
      })
      .select()
      .single()

    if (sessionError) {
      setError('Failed to start session. Please try again.')
      return
    }

    setSessionId(session.id)
    setSessionStart(Date.now())
    setPhase('interview')
    await loadNextQuestion()
  }

  const loadNextQuestion = useCallback(async (overridePrev?: string[]) => {
    setLoadingQuestion(true)
    setFeedback(null)
    setAnswer('')
    setVoiceTranscript('')
    setAnswerStart(Date.now())
    setExpandedSection('feedback')
    setShowExampleAnswer(false)

    try {
      const prevQs = overridePrev ?? previousQuestionsRef.current
      const q = await generateQuestion(domain, difficulty, interviewType, topic || undefined, prevQs)
      setCurrentQuestion(q.question)
      setQuestionMeta({ domain: q.domain, difficulty: q.difficulty, type: q.type, topic: q.topic ?? null })
      const updated = [...prevQs, q.question]
      previousQuestionsRef.current = updated
      setPreviousQuestions(updated)
    } catch {
      setError('Failed to generate question. Please try again.')
    }

    setLoadingQuestion(false)
  }, [domain, difficulty, interviewType, topic])

  const skipQuestion = async () => {
    setQuestionCount(prev => prev + 1)
    await loadNextQuestion()
  }

  const generateNewQuestion = async () => {
    // Remove last question from previous list to allow regeneration
    const updated = previousQuestionsRef.current.slice(0, -1)
    previousQuestionsRef.current = updated
    setPreviousQuestions(updated)
    await loadNextQuestion(updated)
  }

  const submitAnswer = async () => {
    if (!currentQuestion || (!answer.trim() && !voiceTranscript.trim())) return
    setSubmitting(true)
    setError(null)

    const answerText = voiceMode ? voiceTranscript : answer
    const duration = Math.floor((Date.now() - answerStart) / 1000)

    try {
      const result = await evaluateAnswer(
        currentQuestion,
        answerText,
        questionMeta?.domain || domain,
        questionMeta?.difficulty || difficulty,
        questionMeta?.type || interviewType,
        questionMeta?.topic || topic || undefined,
        voiceMode ? voiceTranscript : undefined,
        voiceMode ? { mode: 'voice' } : undefined,
      )

      setFeedback(result)

      // Generate timeline annotations
      const annotations: TimelineAnnotation[] = []
      if (voiceMode) {
        annotations.push({ time: 0, text: 'Answer started', type: 'neutral' })
        if (answerText.match(/\b(um|uh|like|you know|basically|actually)\b/gi)) {
          const fillerCount = (answerText.match(/\b(um|uh|like|you know|basically|actually)\b/gi) || []).length
          annotations.push({ time: Math.floor(duration * 0.3), text: `You used filler words ${fillerCount} times in this answer`, type: 'negative' })
        }
        if (answerText.length < 100) {
          annotations.push({ time: Math.floor(duration * 0.5), text: 'This answer was quite short — interviewers expect more detail', type: 'negative' })
        }
        if (result.scores.technical >= 70) {
          annotations.push({ time: Math.floor(duration * 0.7), text: 'Good technical knowledge demonstrated here', type: 'positive' })
        }
        annotations.push({ time: duration, text: 'Answer completed', type: 'neutral' })
      }

      setCurrentDuration(duration)

      const record: AnswerRecord = {
        question: currentQuestion,
        answer: answerText,
        scores: result.scores,
        feedback: result.feedback,
        feedback_detail: result.feedback_detail,
        score_breakdown: result.score_breakdown,
        follow_up_question: result.follow_up_question,
        model_answer: result.model_answer,
        example_answer: result.example_answer,
        keywords_used: result.keywords_used,
        keywords_missed: result.keywords_missed,
        speaking_time_seconds: result.speaking_time_seconds,
        ideal_speaking_time: result.ideal_speaking_time,
        ideal_answer: result.ideal_answer,
        domain: questionMeta?.domain || domain,
        difficulty: questionMeta?.difficulty || difficulty,
        type: questionMeta?.type || interviewType,
        topic: questionMeta?.topic ?? topic ?? null,
        duration,
        timeline_annotations: annotations,
      }

      setAnswers(prev => [...prev, record])
      setQuestionCount(prev => prev + 1)

      // Save answer to DB
      if (sessionId) {
        await supabase.from('session_answers').insert({
          session_id: sessionId,
          user_id: profile?.id,
          question_text: currentQuestion,
          question_domain: questionMeta?.domain || domain,
          question_difficulty: questionMeta?.difficulty || difficulty,
          question_type: questionMeta?.type || interviewType,
          question_topic: questionMeta?.topic ?? topic ?? null,
          answer_text: answerText,
          answer_mode: voiceMode ? 'voice' : 'text',
          communication_score: result.scores.communication,
          confidence_score: result.scores.confidence,
          technical_score: result.scores.technical,
          pronunciation_score: result.scores.pronunciation,
          clarity_score: result.scores.clarity,
          problem_solving_score: result.scores.problem_solving,
          overall_score: result.scores.overall,
          ai_feedback: result.feedback,
          ai_feedback_detail: result.feedback_detail,
          follow_up_question: result.follow_up_question,
          model_answer: result.model_answer,
          example_answer: result.example_answer,
          timeline_annotations: annotations,
          duration_seconds: duration,
          keywords_used: result.keywords_used,
          keywords_missed: result.keywords_missed,
          speaking_time_seconds: result.speaking_time_seconds,
        })
      }
    } catch {
      setError('Failed to evaluate answer. Please try again.')
    }

    setSubmitting(false)
  }

  const finishInterview = async () => {
    if (!sessionId || answers.length === 0) {
      navigate('/dashboard')
      return
    }

    setSubmitting(true)
    setError(null)

    // Calculate average scores
    const avg = (key: keyof ScoreSet) => Math.round(answers.reduce((sum, a) => sum + a.scores[key], 0) / answers.length)
    const avgScores = {
      communication: avg('communication'),
      confidence: avg('confidence'),
      technical: avg('technical'),
      pronunciation: avg('pronunciation'),
      clarity: avg('clarity'),
      problem_solving: avg('problem_solving'),
      overall: avg('overall'),
    }

    const readinessLevel = getReadinessLevel(avgScores.overall)
    const duration = Math.floor((Date.now() - sessionStart) / 1000)

    try {
      // Update session
      const { error: sessionUpdateError } = await supabase.from('interview_sessions').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        overall_score: avgScores.overall,
        communication_score: avgScores.communication,
        confidence_score: avgScores.confidence,
        technical_score: avgScores.technical,
        pronunciation_score: avgScores.pronunciation,
        clarity_score: avgScores.clarity,
        problem_solving_score: avgScores.problem_solving,
        readiness_level: readinessLevel,
        question_count: answers.length,
        duration_seconds: duration,
      }).eq('id', sessionId)

      if (sessionUpdateError) {
        console.error('Session update error:', sessionUpdateError)
        setError('Failed to save session. Please try again.')
        setSubmitting(false)
        return
      }

      // Generate report
      try {
        const report = await generateReport(
          { overall_score: avgScores.overall, question_count: answers.length },
          answers.map(a => ({ question: a.question, answer: a.answer, scores: a.scores, domain: a.domain, difficulty: a.difficulty, topic: a.topic, model_answer: a.model_answer, keywords_used: a.keywords_used, keywords_missed: a.keywords_missed, speaking_time_seconds: a.speaking_time_seconds, ideal_speaking_time: a.ideal_speaking_time })),
          domain, difficulty, interviewType, topic || undefined,
        )

        const { error: reportError } = await supabase.from('session_reports').insert({
          session_id: sessionId,
          user_id: profile?.id,
          overall_summary: report.overall_summary,
          strengths: report.strengths,
          weaknesses: report.weaknesses,
          communication_analysis: report.communication_analysis,
          technical_analysis: report.technical_analysis,
          confidence_analysis: report.confidence_analysis,
          pronunciation_analysis: report.pronunciation_analysis,
          areas_for_improvement: report.areas_for_improvement,
          action_plan: report.action_plan,
          readiness_level: report.readiness_level,
          recruiter_impression_score: report.recruiter_impression_score,
          next_three_fixes: report.next_three_fixes,
          question_analyses: report.question_analyses,
          top_5_improvement_areas: report.top_5_improvement_areas,
          hiring_recommendation: report.hiring_recommendation,
          estimated_interview_level: report.estimated_interview_level,
          suggested_practice_plan: report.suggested_practice_plan,
          final_interviewer_remarks: report.final_interviewer_remarks,
          grammar_analysis: report.grammar_analysis,
          vocabulary_analysis: report.vocabulary_analysis,
          problem_solving_analysis: report.problem_solving_analysis,
          professionalism_analysis: report.professionalism_analysis,
        })

        if (reportError) {
          console.error('Report insert error:', reportError)
        }
      } catch (reportErr) {
        console.error('Report generation failed:', reportErr)
        // Continue to reports page even if report generation fails
      }

      navigate('/reports')
    } catch (err) {
      console.error('Finish interview error:', err)
      setError('Failed to complete interview. Please try again.')
      setSubmitting(false)
    }
  }

  // Voice recording
  const startRecording = () => {
    setVoiceTranscript('')
    setIsRecording(true)

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition() as {
        continuous: boolean
        interimResults: boolean
        lang: string
        maxAlternatives: number
        onresult: (e: Record<string, unknown>) => void
        onend: () => void
        onerror: (e: Record<string, unknown>) => void
        start: () => void
        stop: () => void
      }
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onresult = (e: Record<string, unknown>) => {
        const event = e as { resultIndex: number; results: ArrayLike<{ isFinal: boolean; length: number; 0: { transcript: string; confidence: number } }> }
        let fullTranscript = ''

        // Build complete transcript from all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result[0]?.transcript) {
            fullTranscript += result[0].transcript + ' '
          }
        }

        // Also get the latest addition
        const latestIndex = event.resultIndex
        if (event.results[latestIndex]?.[0]?.transcript) {
          const latestTranscript = event.results[latestIndex][0].transcript
          if (event.results[latestIndex].isFinal) {
            setVoiceTranscript(prev => (prev + ' ' + latestTranscript).trim())
          } else {
            // Interim result - show in real-time
            setVoiceTranscript(fullTranscript.trim())
          }
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        // Ensure transcript is captured
        setVoiceTranscript(prev => prev.trim())
      }

      recognition.onerror = (e: Record<string, unknown>) => {
        const event = e as { error?: string }
        console.error('Speech recognition error:', event.error)
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try speaking louder or closer to your microphone.')
        } else if (event.error === 'audio-capture') {
          setError('Could not capture audio. Please check your microphone permissions.')
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access and try again.')
        } else {
          setError('Speech recognition error. Please try again or use text mode.')
        }
        setIsRecording(false)
      }

      try {
        recognition.start()
        recognitionRef.current = recognition
      } catch {
        setError('Failed to start voice recognition. Please use text mode.')
        setIsRecording(false)
      }
    } else {
      setError('Voice recognition is not supported in your browser. Please use Chrome or Edge for voice mode.')
      setIsRecording(false)
      setVoiceMode(false)
    }
  }

  const stopRecording = () => {
    const recognition = recognitionRef.current as { stop?: () => void } | null
    if (recognition?.stop) recognition.stop()
    setIsRecording(false)
  }

  // ===== CONFIG PHASE =====
  if (phase === 'config') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Interview Studio</h1>
        </div>

        {/* Step 1: Domain */}
        <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>1</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Choose Domain</h2>
          </div>

          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="glass-input"
              placeholder="Search domains..."
              value={domainSearch}
              onChange={(e) => setDomainSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {filteredDomains.map((d) => (
              <button
                key={d}
                onClick={() => setDomain(d)}
                style={{
                  padding: '10px 18px', borderRadius: 100, fontSize: 14, fontWeight: 500,
                  border: domain === d ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: domain === d ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
                  color: domain === d ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'var(--font-body)',
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Difficulty */}
        <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>2</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Select Difficulty</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  padding: 20, borderRadius: 16, textAlign: 'left',
                  border: difficulty === d ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: difficulty === d ? 'rgba(255,94,120,0.06)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'var(--font-body)',
                }}
              >
                <p style={{ fontSize: 16, fontWeight: 600, color: difficulty === d ? 'var(--color-primary)' : 'var(--color-text-primary)', marginBottom: 6 }}>{d}</p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {d === 'Easy' ? 'Basic concepts and definitions' : d === 'Medium' ? 'Applied knowledge and scenarios' : 'Complex problem-solving and deep dives'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Interview Type */}
        <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>3</div>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Interview Type</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {INTERVIEW_TYPES.map((t) => {
              const icons = { Technical: CodeIcon, HR: UserIcon, Behavioral: UsersIcon, Mixed: ShuffleIcon }
              const Icon = icons[t]
              return (
                <button
                  key={t}
                  onClick={() => setInterviewType(t)}
                  style={{
                    padding: 20, borderRadius: 16, textAlign: 'center',
                    border: interviewType === t ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: interviewType === t ? 'rgba(255,94,120,0.06)' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <Icon size={20} color="var(--color-primary)" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: interviewType === t ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{t}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Step 4: Topic (optional) */}
        {getTopicsForDomain(domain).length > 0 && (
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>4</div>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Choose Topic <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>(optional)</span></h2>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Focus on a specific concept within {domain}, or leave unselected for a random topic.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              <button
                onClick={() => setTopic('')}
                style={{
                  padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                  border: topic === '' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: topic === '' ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
                  color: topic === '' ? 'var(--color-primary)' : 'var(--color-text-primary)',
                  cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'var(--font-body)',
                }}
              >
                Any topic
              </button>
              {getTopicsForDomain(domain).map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                    border: topic === t ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: topic === t ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
                    color: topic === t ? 'var(--color-primary)' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.25s ease', fontFamily: 'var(--font-body)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary + Start */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="glass-card-static" style={{ padding: '16px 24px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Domain</span><p style={{ fontSize: 14, fontWeight: 600 }}>{domain}</p></div>
            <div><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Difficulty</span><p style={{ fontSize: 14, fontWeight: 600 }}>{difficulty}</p></div>
            <div><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Type</span><p style={{ fontSize: 14, fontWeight: 600 }}>{interviewType}</p></div>
            {topic && <div><span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Topic</span><p style={{ fontSize: 14, fontWeight: 600 }}>{topic}</p></div>}
          </div>

          <button className="btn-primary" onClick={startInterview}>
            Start Interview <ArrowRight size={18} />
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,94,120,0.08)', border: '1px solid rgba(255,94,120,0.2)', fontSize: 13, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>
    )
  }

  // ===== INTERVIEW PHASE =====
  const scoreMetrics = feedback ? [
    { label: 'Communication', value: feedback.scores.communication },
    { label: 'Confidence', value: feedback.scores.confidence },
    { label: 'Technical', value: feedback.scores.technical },
    ...(voiceMode ? [{ label: 'Pronunciation', value: feedback.scores.pronunciation }] : []),
    { label: 'Clarity', value: feedback.scores.clarity },
    { label: 'Problem Solving', value: feedback.scores.problem_solving },
  ] : []

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={() => { if (confirm('Exit interview? Your progress will be saved.')) { finishInterview() } }}>
            <X size={18} /> Exit
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Interview Session</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.6)', border: '1px solid var(--color-border)' }}>
          <Clock size={16} color="var(--color-primary)" />
          <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        {/* Main Area */}
        <div>
          {/* Question Card */}
          <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{questionMeta?.domain || domain}</span>
              {(questionMeta?.topic || topic) && <span className="badge badge-neutral">{questionMeta?.topic || topic}</span>}
              <span className="badge badge-metallic">{questionMeta?.difficulty || difficulty}</span>
              <span className="badge badge-neutral">{questionMeta?.type || interviewType}</span>
            </div>
            {loadingQuestion ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
                <div className="spinner" />
                <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Generating question...</span>
              </div>
            ) : (
              <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>
                {currentQuestion}
              </p>
            )}
          </div>

          {/* Answer Area */}
          {!feedback && !loadingQuestion && (
            <>
              {/* Mode Toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={() => setVoiceMode(false)}
                  style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                    border: !voiceMode ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: !voiceMode ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
                    color: !voiceMode ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)',
                  }}
                >
                  <MessageSquare size={15} /> Text Mode
                </button>
                <button
                  onClick={() => setVoiceMode(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                    border: voiceMode ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: voiceMode ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
                    color: voiceMode ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)',
                  }}
                >
                  <Mic2 size={15} /> Voice Mode
                </button>
              </div>

              {voiceMode ? (
                <div className="glass-card-static" style={{ padding: 28, marginBottom: 20 }}>
                  {isRecording ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 20, height: 40, alignItems: 'center' }}>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="waveform-bar"
                            style={{ animationDelay: `${i * 0.05}s`, height: `${20 + Math.random() * 20}px` }}
                          />
                        ))}
                      </div>
                      <p style={{ color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Recording... Speak your answer</p>
                      {voiceTranscript && (
                        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginBottom: 16, textAlign: 'left' }}>
                          <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{voiceTranscript}</p>
                        </div>
                      )}
                      <button className="btn-secondary" onClick={stopRecording}>
                        <Square size={16} /> Stop Recording
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <button
                        onClick={startRecording}
                        style={{
                          width: 80, height: 80, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)',
                          border: 'none', cursor: 'pointer', margin: '0 auto 16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 20px rgba(255,94,120,0.3)',
                        }}
                      >
                        <Mic2 size={32} color="white" />
                      </button>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Click to start recording your answer</p>
                      {voiceTranscript && (
                        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginTop: 16, textAlign: 'left' }}>
                          <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{voiceTranscript}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  className="glass-textarea"
                  placeholder="Type your answer here... Take your time and be as detailed as you can."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  style={{ minHeight: 200, marginBottom: 20 }}
                />
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  onClick={submitAnswer}
                  disabled={submitting || (!answer.trim() && !voiceTranscript.trim())}
                >
                  {submitting ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Evaluating...</> : <><CheckCircle2 size={18} /> Submit Answer</>}
                </button>
                <button className="btn-secondary" onClick={skipQuestion} disabled={loadingQuestion}>
                  <SkipForward size={16} /> Skip
                </button>
                <button className="btn-secondary" onClick={generateNewQuestion} disabled={loadingQuestion}>
                  <RefreshCw size={16} /> New Question
                </button>
              </div>
            </>
          )}

          {/* Feedback Display */}
          {feedback && (
            <>
              {/* Score Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {scoreMetrics.map((m) => (
                  <div key={m.label} className="glass-card-static" style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>{m.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8 }}>{m.value}</p>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Score Breakdown - Why X/100 */}
              {feedback.score_breakdown && (
                <div className="glass-card-static" style={{ padding: 20, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: feedback.score_breakdown.score >= 70 ? 'rgba(76,175,80,0.15)' : feedback.score_breakdown.score >= 50 ? 'rgba(255,193,7,0.15)' : 'rgba(255,94,120,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: feedback.score_breakdown.score >= 70 ? '#4CAF50' : feedback.score_breakdown.score >= 50 ? '#FFC107' : 'var(--color-primary)' }}>{feedback.score_breakdown.score}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 600 }}>Your Answer: {feedback.score_breakdown.score}/100</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{feedback.score_breakdown.score >= 70 ? 'Good answer with minor gaps' : feedback.score_breakdown.score >= 50 ? 'Partial understanding shown' : 'Needs significant improvement'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ padding: 14, borderRadius: 10, background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.15)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#4CAF50', marginBottom: 8, letterSpacing: 0.5 }}>WHAT YOU DID WELL</p>
                      {feedback.score_breakdown.what_you_did_well.length > 0 ? (
                        feedback.score_breakdown.what_you_did_well.map((s, i) => (
                          <p key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{s}</p>
                        ))
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Nothing significant identified</p>
                      )}
                    </div>
                    <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,94,120,0.06)', border: '1px solid rgba(255,94,120,0.15)' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8, letterSpacing: 0.5 }}>WHAT WAS MISSING</p>
                      {feedback.score_breakdown.what_was_missing.map((s, i) => (
                        <p key={i} style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{s}</p>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(33,150,243,0.06)', border: '1px solid rgba(33,150,243,0.15)' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#2196F3', marginBottom: 8, letterSpacing: 0.5 }}>HOW TO MAKE IT A 90+ ANSWER</p>
                    <p style={{ fontSize: 13, lineHeight: 1.6 }}>{feedback.score_breakdown.how_to_make_90}</p>
                  </div>
                </div>
              )}

              {/* Expandable Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {/* AI Feedback */}
                <ExpandableSection
                  title="AI Feedback"
                  icon={<Sparkles size={18} color="var(--color-primary)" />}
                  expanded={expandedSection === 'feedback'}
                  onToggle={() => setExpandedSection(expandedSection === 'feedback' ? null : 'feedback')}
                >
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)', marginBottom: feedback.feedback_detail ? 16 : 0 }}>{feedback.feedback}</p>
                  {feedback.feedback_detail && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {feedback.feedback_detail.executive_summary && (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,94,120,0.04)', border: '1px solid rgba(255,94,120,0.12)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>EXECUTIVE SUMMARY</p>
                          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{feedback.feedback_detail.executive_summary}</p>
                        </div>
                      )}
                      {feedback.feedback_detail.strengths && feedback.feedback_detail.strengths.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>STRENGTHS</p>
                          {feedback.feedback_detail.strengths.map((s, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid rgba(255,94,120,0.3)' }}>{s}</p>)}
                        </div>
                      )}
                      {feedback.feedback_detail.weaknesses && feedback.feedback_detail.weaknesses.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>WEAKNESSES</p>
                          {feedback.feedback_detail.weaknesses.map((w, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid rgba(232,180,160,0.5)' }}>{w}</p>)}
                        </div>
                      )}
                      {feedback.feedback_detail.missing_concepts && feedback.feedback_detail.missing_concepts.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>MISSING CONCEPTS</p>
                          {feedback.feedback_detail.missing_concepts.map((c, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid rgba(180,160,232,0.5)' }}>{c}</p>)}
                        </div>
                      )}
                      {feedback.feedback_detail.incorrect_statements && feedback.feedback_detail.incorrect_statements.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>INCORRECT STATEMENTS</p>
                          {feedback.feedback_detail.incorrect_statements.map((s, i) => <p key={i} style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 4, paddingLeft: 12, borderLeft: '2px solid rgba(255,140,60,0.5)' }}>{s}</p>)}
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {feedback.feedback_detail.confidence_analysis && <FeedbackMeta label="Confidence" value={feedback.feedback_detail.confidence_analysis} />}
                        {feedback.feedback_detail.communication_analysis && <FeedbackMeta label="Communication" value={feedback.feedback_detail.communication_analysis} />}
                        {feedback.feedback_detail.grammar_review && <FeedbackMeta label="Grammar" value={feedback.feedback_detail.grammar_review} />}
                        {feedback.feedback_detail.vocabulary_review && <FeedbackMeta label="Vocabulary" value={feedback.feedback_detail.vocabulary_review} />}
                      </div>
                      {feedback.feedback_detail.interviewer_notes && (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(212,201,197,0.12)', border: '1px solid rgba(212,201,197,0.3)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: 0.5 }}>INTERVIEWER NOTES</p>
                          <p style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>{feedback.feedback_detail.interviewer_notes}</p>
                        </div>
                      )}
                      {feedback.feedback_detail.top_3_fixes && feedback.feedback_detail.top_3_fixes.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>TOP 3 IMMEDIATE FIXES</p>
                          {feedback.feedback_detail.top_3_fixes.map((fix, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>{i + 1}</div>
                              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{fix}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {feedback.feedback_detail.hiring_readiness && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5 }}>HIRING READINESS</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{feedback.feedback_detail.hiring_readiness}</span>
                        </div>
                      )}
                    </div>
                  )}
                </ExpandableSection>

                {/* Keywords Analysis */}
                {(feedback.keywords_used?.length || feedback.keywords_missed?.length) && (
                  <ExpandableSection
                    title="Keywords Analysis"
                    icon={<Target size={18} color="var(--color-primary)" />}
                    expanded={expandedSection === 'keywords'}
                    onToggle={() => setExpandedSection(expandedSection === 'keywords' ? null : 'keywords')}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>KEYWORDS USED</p>
                        {feedback.keywords_used && feedback.keywords_used.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {feedback.keywords_used.map((kw, i) => (
                              <span key={i} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'rgba(255,94,120,0.08)', border: '1px solid rgba(255,94,120,0.2)', color: 'var(--color-primary)' }}>{kw}</span>
                            ))}
                          </div>
                        ) : <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>None identified</p>}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, letterSpacing: 0.5 }}>IMPORTANT KEYWORDS MISSED</p>
                        {feedback.keywords_missed && feedback.keywords_missed.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {feedback.keywords_missed.map((kw, i) => (
                              <span key={i} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: 'rgba(232,180,160,0.1)', border: '1px solid rgba(232,180,160,0.35)', color: '#B8826A' }}>{kw}</span>
                            ))}
                          </div>
                        ) : <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>All key terms covered!</p>}
                      </div>
                    </div>
                  </ExpandableSection>
                )}

                {/* Time Analysis */}
                <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Clock size={16} color="var(--color-text-muted)" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{voiceMode ? 'Speaking Time' : 'Thinking & Writing Time'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    {voiceMode && feedback.ideal_speaking_time && (
                      <>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>EXPECTED</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>{feedback.ideal_speaking_time}</div>
                        </div>
                        <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} />
                      </>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
                        {voiceMode ? 'YOUR SPOKEN TIME' : 'TIME TAKEN'}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                        {voiceMode ? `${feedback.speaking_time_seconds ?? 0}s` : `${currentDuration}s`}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', width: '100%', marginTop: 2 }}>
                    {voiceMode
                      ? (feedback.speaking_time_feedback || '')
                      : currentDuration < 30
                        ? 'Very quick response — consider taking more time to structure a complete answer.'
                        : currentDuration < 90
                          ? 'Good response time. In a real interview, aim for 60–120 seconds for a thorough answer.'
                          : 'You took time to compose your answer — a thoughtful approach interviewers appreciate.'}
                  </p>
                </div>

                {/* Follow-up Question */}
                <ExpandableSection
                  title="Follow-up Question"
                  icon={<MessageSquare size={18} color="var(--color-primary)" />}
                  expanded={expandedSection === 'followup'}
                  onToggle={() => setExpandedSection(expandedSection === 'followup' ? null : 'followup')}
                >
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-text-primary)', fontStyle: 'italic' }}>{feedback.follow_up_question}</p>
                </ExpandableSection>

                {/* Example Answer — collapsed by default, shown only after user interacts */}
                {feedback.example_answer && (
                  !showExampleAnswer ? (
                    <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <MessageSquare size={18} color="var(--color-text-muted)" />
                        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)' }}>Example Answer</span>
                      </div>
                      <button
                        onClick={() => setShowExampleAnswer(true)}
                        style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--color-primary)', background: 'rgba(255,94,120,0.06)', color: 'var(--color-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                      >
                        Show Example Answer
                      </button>
                    </div>
                  ) : (
                    <ExpandableSection
                      title="Example Answer"
                      icon={<MessageSquare size={18} color="var(--color-primary)" />}
                      expanded={expandedSection === 'example'}
                      onToggle={() => setExpandedSection(expandedSection === 'example' ? null : 'example')}
                    >
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 10, fontStyle: 'italic' }}>How a well-prepared candidate might naturally answer this:</p>
                      <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-text-primary)' }}>{feedback.example_answer}</p>
                    </ExpandableSection>
                  )
                )}

                {/* Model Answer */}
                <ExpandableSection
                  title="Model Answer"
                  icon={<BookOpen size={18} color="var(--color-primary)" />}
                  expanded={expandedSection === 'model'}
                  onToggle={() => setExpandedSection(expandedSection === 'model' ? null : 'model')}
                >
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>{feedback.model_answer}</p>
                </ExpandableSection>

                {/* Ideal Interview Answer */}
                {feedback.ideal_answer && (
                  <ExpandableSection
                    title="Ideal Interview Answer"
                    icon={<Sparkles size={18} color="#B8826A" />}
                    expanded={expandedSection === 'ideal'}
                    onToggle={() => setExpandedSection(expandedSection === 'ideal' ? null : 'ideal')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Interviewer Expected Points Checklist + Coverage */}
                      {feedback.ideal_answer.interviewer_checklist && feedback.ideal_answer.interviewer_checklist.length > 0 && (
                        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 12 }}>INTERVIEWER EXPECTED POINTS</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                            {feedback.ideal_answer.candidate_coverage && feedback.ideal_answer.candidate_coverage.length > 0
                              ? feedback.ideal_answer.candidate_coverage.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{
                                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                    background: item.covered ? 'rgba(76,175,80,0.12)' : 'rgba(255,94,120,0.1)',
                                    border: `1px solid ${item.covered ? 'rgba(76,175,80,0.3)' : 'rgba(255,94,120,0.25)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700,
                                    color: item.covered ? '#4CAF50' : 'var(--color-primary)',
                                  }}>
                                    {item.covered ? '✓' : '✗'}
                                  </div>
                                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{item.point}</span>
                                </div>
                              ))
                              : feedback.ideal_answer.interviewer_checklist.map((point, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: 'rgba(212,201,197,0.2)', border: '1px solid rgba(212,201,197,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--color-text-muted)' }}>—</div>
                                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{point}</span>
                                </div>
                              ))
                            }
                          </div>
                          {feedback.ideal_answer.candidate_coverage && feedback.ideal_answer.candidate_coverage.length > 0 && (() => {
                            const covered = feedback.ideal_answer!.candidate_coverage.filter(c => c.covered).length
                            const total = feedback.ideal_answer!.candidate_coverage.length
                            const pct = Math.round((covered / total) * 100)
                            return (
                              <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>YOUR COVERAGE</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 80 ? '#4CAF50' : pct >= 60 ? '#FFC107' : 'var(--color-primary)' }}>{covered}/{total} ({pct}%)</span>
                                </div>
                                <div className="progress-bar">
                                  <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct >= 80 ? 'linear-gradient(90deg,#4CAF50,#66BB6A)' : pct >= 60 ? 'linear-gradient(90deg,#FFC107,#FFD54F)' : 'linear-gradient(90deg,#FF5E78,#FF8FA3)' }} />
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* Full ideal answer */}
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 10 }}>COMPLETE INTERVIEW-READY ANSWER</p>
                        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(232,180,160,0.06)', border: '1px solid rgba(232,180,160,0.2)', lineHeight: 1.8, fontSize: 14, color: 'var(--color-text-primary)' }}>
                          {feedback.ideal_answer.full_answer}
                        </div>
                      </div>

                      {/* Why it's strong */}
                      {feedback.ideal_answer.why_strong && (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(76,175,80,0.06)', border: '1px solid rgba(76,175,80,0.2)' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#4CAF50', marginBottom: 6, letterSpacing: 0.5 }}>WHY THIS ANSWER IS STRONG</p>
                          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{feedback.ideal_answer.why_strong}</p>
                        </div>
                      )}

                      {/* Short answer */}
                      {feedback.ideal_answer.short_answer && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>SHORT ANSWER (30–45 SECONDS)</p>
                          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(33,150,243,0.05)', border: '1px solid rgba(33,150,243,0.15)', fontSize: 13, lineHeight: 1.7 }}>
                            {feedback.ideal_answer.short_answer}
                          </div>
                        </div>
                      )}

                      {/* Common mistakes */}
                      {feedback.ideal_answer.common_mistakes && feedback.ideal_answer.common_mistakes.length > 0 && (
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>COMMON MISTAKES TO AVOID</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {feedback.ideal_answer.common_mistakes.map((m, i) => (
                              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{m}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ExpandableSection>
                )}
              </div>

              {/* Next Question */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn-primary" onClick={() => loadNextQuestion()} disabled={loadingQuestion}>
                  {loadingQuestion ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</> : <><ArrowRight size={18} /> Next Question</>}
                </button>
                <button className="btn-primary" onClick={finishInterview} disabled={submitting} style={{ background: 'linear-gradient(135deg, #E8B4A0, #FF8FA3)' }}>
                  <FileText size={18} /> Finish & Get Report
                </button>
              </div>
            </>
          )}

          {error && (
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,94,120,0.08)', border: '1px solid rgba(255,94,120,0.2)', fontSize: 13, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Session Sidebar */}
        <div>
          <div className="glass-card-static" style={{ padding: 20, position: 'sticky', top: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-muted)', letterSpacing: 1 }}>SESSION PROGRESS</h3>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Questions Answered</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>{questionCount}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${Math.min(questionCount * 10, 100)}%` }} />
              </div>
            </div>

            <div style={{ marginBottom: 20, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Clock size={15} color="var(--color-primary)" />
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Session Time</span>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatTime(elapsed)}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="btn-secondary" onClick={skipQuestion} disabled={loadingQuestion || !!feedback} style={{ justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}>
                <SkipForward size={15} /> Skip Question
              </button>
              <button className="btn-secondary" onClick={generateNewQuestion} disabled={loadingQuestion || !!feedback} style={{ justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}>
                <RefreshCw size={15} /> New Question
              </button>
              <button className="btn-primary" onClick={finishInterview} disabled={submitting || answers.length === 0} style={{ justifyContent: 'center', fontSize: 13, padding: '10px 16px' }}>
                <FileText size={15} /> Finish & Get Report
              </button>
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {domain}{topic ? ` · ${topic}` : ''} · {difficulty} · {interviewType}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExpandableSection({ title, icon, expanded, onToggle, children }: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="glass-card-static" style={{ overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</span>
        </div>
        {expanded ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
      </button>
      {expanded && (
        <div style={{ padding: '0 20px 20px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FeedbackMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.4)', border: '1px solid var(--color-border)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 12, lineHeight: 1.5 }}>{value}</p>
    </div>
  )
}

function CodeIcon({ size, color }: { size: number; color: string }) {
  return <Sparkles size={size} color={color} />
}
function UserIcon({ size, color }: { size: number; color: string }) {
  return <MessageSquare size={size} color={color} />
}
function UsersIcon({ size, color }: { size: number; color: string }) {
  return <Lightbulb size={size} color={color} />
}
function ShuffleIcon({ size, color }: { size: number; color: string }) {
  return <RefreshCw size={size} color={color} />
}
