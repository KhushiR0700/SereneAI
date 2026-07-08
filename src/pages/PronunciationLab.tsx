import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { evaluatePronunciation } from '@/lib/api'
import { Mic, Volume2, ChevronLeft, ChevronRight, Search, Sparkles, TrendingUp, Plus, X } from 'lucide-react'
import type { PronunciationSession } from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface PracticeWord {
  word: string
  ipa: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  custom?: boolean
}

const PRACTICE_WORDS: PracticeWord[] = [
  // Core CS
  { word: 'Algorithm', ipa: '/ˈælɡərɪðəm/', difficulty: 'Hard' },
  { word: 'Synchronize', ipa: '/ˈsɪŋkrənaɪz/', difficulty: 'Hard' },
  { word: 'Asynchronous', ipa: '/eɪˈsɪŋkrənəs/', difficulty: 'Hard' },
  { word: 'Polymorphism', ipa: '/ˌpɒlɪˈmɔːfɪzəm/', difficulty: 'Hard' },
  { word: 'Encapsulation', ipa: '/ɪnˌkæpsjuˈleɪʃən/', difficulty: 'Hard' },
  { word: 'Inheritance', ipa: '/ɪnˈherɪtəns/', difficulty: 'Medium' },
  { word: 'Abstraction', ipa: '/æbˈstrækʃən/', difficulty: 'Medium' },
  { word: 'Recursion', ipa: '/rɪˈkɜːrʃən/', difficulty: 'Medium' },
  { word: 'Database', ipa: '/ˈdeɪtəbeɪs/', difficulty: 'Easy' },
  { word: 'Interface', ipa: '/ˈɪntərfeɪs/', difficulty: 'Easy' },
  { word: 'Framework', ipa: '/ˈfreɪmwɜːrk/', difficulty: 'Easy' },
  { word: 'Deployment', ipa: '/dɪˈplɔɪmənt/', difficulty: 'Medium' },
  { word: 'Authentication', ipa: '/ɔːˌθentɪˈkeɪʃən/', difficulty: 'Hard' },
  { word: 'Optimization', ipa: '/ˌɒptɪmaɪˈzeɪʃən/', difficulty: 'Medium' },
  { word: 'Virtualization', ipa: '/ˌvɜːrtʃuəlaɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Concurrency', ipa: '/kənˈkʌrənsi/', difficulty: 'Hard' },
  { word: 'Middleware', ipa: '/ˈmɪdəlweər/', difficulty: 'Medium' },
  { word: 'Repository', ipa: '/rɪˈpɒzɪtɔːri/', difficulty: 'Medium' },
  { word: 'Parameter', ipa: '/pəˈræmɪtər/', difficulty: 'Easy' },
  { word: 'Variable', ipa: '/ˈveəriəbəl/', difficulty: 'Easy' },
  // Networking
  { word: 'Latency', ipa: '/ˈleɪtənsi/', difficulty: 'Medium' },
  { word: 'Bandwidth', ipa: '/ˈbændwɪdθ/', difficulty: 'Easy' },
  { word: 'Protocol', ipa: '/ˈprəʊtəkɒl/', difficulty: 'Easy' },
  { word: 'Ethernet', ipa: '/ˈiːθərnet/', difficulty: 'Easy' },
  { word: 'Subnet', ipa: '/ˈsʌbnet/', difficulty: 'Medium' },
  { word: 'Firewall', ipa: '/ˈfaɪərwɔːl/', difficulty: 'Easy' },
  { word: 'Cryptography', ipa: '/krɪpˈtɒɡrəfi/', difficulty: 'Hard' },
  { word: 'Encryption', ipa: '/ɪnˈkrɪpʃən/', difficulty: 'Medium' },
  { word: 'Hypertext', ipa: '/ˈhaɪpərtekst/', difficulty: 'Easy' },
  { word: 'Throughput', ipa: '/ˈθruːpʊt/', difficulty: 'Medium' },
  // Architecture
  { word: 'Architecture', ipa: '/ˈɑːrkɪtektʃər/', difficulty: 'Medium' },
  { word: 'Microservices', ipa: '/ˈmaɪkrəʊˌsɜːrvɪsɪz/', difficulty: 'Hard' },
  { word: 'Scalability', ipa: '/ˌskeɪləˈbɪlɪti/', difficulty: 'Hard' },
  { word: 'Reliability', ipa: '/rɪˌlaɪəˈbɪlɪti/', difficulty: 'Medium' },
  { word: 'Availability', ipa: '/əˌveɪləˈbɪlɪti/', difficulty: 'Medium' },
  { word: 'Infrastructure', ipa: '/ˈɪnfrəˌstrʌktʃər/', difficulty: 'Hard' },
  { word: 'Repository', ipa: '/rɪˈpɒzɪtɔːri/', difficulty: 'Medium' },
  { word: 'Containerization', ipa: '/kənˌteɪnəraɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Orchestration', ipa: '/ˌɔːrkɪˈstreɪʃən/', difficulty: 'Hard' },
  { word: 'Idempotent', ipa: '/aɪˈdempətənt/', difficulty: 'Hard' },
  // Data
  { word: 'Schema', ipa: '/ˈskiːmə/', difficulty: 'Easy' },
  { word: 'Normalization', ipa: '/ˌnɔːrməlaɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Transaction', ipa: '/trænˈzækʃən/', difficulty: 'Medium' },
  { word: 'Serialization', ipa: '/ˌsɪəriəlaɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Deserialization', ipa: '/ˌdiːˌsɪəriəlaɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Aggregation', ipa: '/ˌæɡrɪˈɡeɪʃən/', difficulty: 'Medium' },
  { word: 'Pagination', ipa: '/ˌpædʒɪˈneɪʃən/', difficulty: 'Medium' },
  { word: 'Indexing', ipa: '/ˈɪndeksɪŋ/', difficulty: 'Medium' },
  { word: 'Partitioning', ipa: '/pɑːˈtɪʃənɪŋ/', difficulty: 'Hard' },
  { word: 'Replication', ipa: '/ˌreplɪˈkeɪʃən/', difficulty: 'Hard' },
  // Programming
  { word: 'Immutable', ipa: '/ɪˈmjuːtəbəl/', difficulty: 'Medium' },
  { word: 'Mutable', ipa: '/ˈmjuːtəbəl/', difficulty: 'Easy' },
  { word: 'Iterable', ipa: '/ˈɪtərəbəl/', difficulty: 'Medium' },
  { word: 'Callback', ipa: '/ˈkɔːlbæk/', difficulty: 'Easy' },
  { word: 'Singleton', ipa: '/ˈsɪŋɡəltən/', difficulty: 'Medium' },
  { word: 'Polymorphic', ipa: '/ˌpɒlɪˈmɔːfɪk/', difficulty: 'Hard' },
  { word: 'Declarative', ipa: '/dɪˈklærətɪv/', difficulty: 'Hard' },
  { word: 'Imperative', ipa: '/ɪmˈperətɪv/', difficulty: 'Medium' },
  { word: 'Functional', ipa: '/ˈfʌŋkʃənəl/', difficulty: 'Easy' },
  { word: 'Heuristic', ipa: '/hjʊˈrɪstɪk/', difficulty: 'Hard' },
  // DevOps
  { word: 'Kubernetes', ipa: '/kjuːbərˈneɪtɪz/', difficulty: 'Hard' },
  { word: 'Terraform', ipa: '/ˈterəfɔːrm/', difficulty: 'Medium' },
  { word: 'Continuous', ipa: '/kənˈtɪnjuəs/', difficulty: 'Medium' },
  { word: 'Integration', ipa: '/ˌɪntɪˈɡreɪʃən/', difficulty: 'Medium' },
  { word: 'Observability', ipa: '/əbˌzɜːrvəˈbɪlɪti/', difficulty: 'Hard' },
  { word: 'Telemetry', ipa: '/təˈlemɪtri/', difficulty: 'Hard' },
  { word: 'Provisioning', ipa: '/prəˈvɪʒənɪŋ/', difficulty: 'Hard' },
  { word: 'Containerize', ipa: '/kənˈteɪnəraɪz/', difficulty: 'Hard' },
  // ML/AI
  { word: 'Neural', ipa: '/ˈnjʊərəl/', difficulty: 'Easy' },
  { word: 'Gradient', ipa: '/ˈɡreɪdiənt/', difficulty: 'Medium' },
  { word: 'Regularization', ipa: '/ˌreɡjʊləraɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Hyperparameter', ipa: '/ˌhaɪpərˈpærəmɪtər/', difficulty: 'Hard' },
  { word: 'Transformer', ipa: '/trænsˈfɔːrmər/', difficulty: 'Medium' },
  { word: 'Embeddings', ipa: '/ɪmˈbedɪŋz/', difficulty: 'Medium' },
  { word: 'Tokenization', ipa: '/ˌtəʊkənaɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Stochastic', ipa: '/stəˈkæstɪk/', difficulty: 'Hard' },
  { word: 'Probabilistic', ipa: '/ˌprɒbəbɪˈlɪstɪk/', difficulty: 'Hard' },
  { word: 'Inference', ipa: '/ˈɪnfərəns/', difficulty: 'Medium' },
  // Security
  { word: 'Vulnerability', ipa: '/ˌvʌlnərəˈbɪlɪti/', difficulty: 'Hard' },
  { word: 'Authorization', ipa: '/ˌɔːθəraɪˈzeɪʃən/', difficulty: 'Hard' },
  { word: 'Certificate', ipa: '/səˈtɪfɪkɪt/', difficulty: 'Medium' },
  { word: 'Asymmetric', ipa: '/ˌeɪsɪˈmetrɪk/', difficulty: 'Hard' },
  { word: 'Cryptographic', ipa: '/ˌkrɪptəˈɡræfɪk/', difficulty: 'Hard' },
]

export default function PronunciationLab() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<PronunciationSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [allWords, setAllWords] = useState<PracticeWord[]>(PRACTICE_WORDS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState<{
    clarity_score: number
    word_accuracy: number
    problem_words: string[]
    mispronounced_words: string[]
    ai_feedback: string
    improvement_suggestions: string[]
  } | null>(null)
  const [customWordInput, setCustomWordInput] = useState('')
  const recognitionRef = useRef<unknown>(null)

  useEffect(() => {
    async function load() {
      if (!profile) return
      const { data } = await supabase
        .from('pronunciation_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setSessions(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  const filteredWords = allWords.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase())
  )

  const currentWord = filteredWords[currentIndex] || allWords[0]

  const speakWord = (word: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    const doSpeak = () => {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-US'
      utterance.rate = 0.75
      utterance.pitch = 1.0
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(v => v.name === 'Google US English')
        || voices.find(v => v.name.includes('Samantha'))
        || voices.find(v => v.lang === 'en-US' && !v.localService)
        || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'))
      if (preferred) utterance.voice = preferred

      window.speechSynthesis.speak(utterance)
    }

    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
      window.speechSynthesis.getVoices()
    } else {
      doSpeak()
    }
  }

  const addCustomWord = () => {
    const word = customWordInput.trim()
    if (!word) return
    if (allWords.some(w => w.word.toLowerCase() === word.toLowerCase())) {
      const idx = filteredWords.findIndex(w => w.word.toLowerCase() === word.toLowerCase())
      if (idx >= 0) setCurrentIndex(idx)
      setCustomWordInput('')
      return
    }
    const newWord: PracticeWord = {
      word: word.charAt(0).toUpperCase() + word.slice(1),
      ipa: '— (IPA not available for custom words)',
      difficulty: 'Medium',
      custom: true,
    }
    setAllWords(prev => [newWord, ...prev])
    setCurrentIndex(0)
    setSearch('')
    setCustomWordInput('')
    setResult(null)
    setTranscript('')
  }

  const removeCustomWord = (word: string) => {
    setAllWords(prev => prev.filter(w => w.word !== word))
    setCurrentIndex(0)
    setResult(null)
    setTranscript('')
  }

  const startRecording = () => {
    setTranscript('')
    setResult(null)
    setIsRecording(true)

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition() as { continuous: boolean; interimResults: boolean; lang: string; onresult: (e: Record<string, unknown>) => void; onend: () => void; start: () => void; stop: () => void; onerror: () => void }
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onresult = (e: Record<string, unknown>) => {
        const results = e.results as ArrayLike<{ 0: { transcript: string } }>
        const text = results[0][0].transcript
        setTranscript(text)
      }
      recognition.onend = () => setIsRecording(false)
      recognition.onerror = () => setIsRecording(false)
      recognition.start()
      recognitionRef.current = recognition
    } else {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    const recognition = recognitionRef.current as { stop?: () => void } | null
    if (recognition?.stop) recognition.stop()
    setIsRecording(false)
  }

  const evaluate = async () => {
    if (!transcript.trim() || !profile) return
    setEvaluating(true)

    try {
      const res = await evaluatePronunciation(
        currentWord.word,
        currentWord.ipa.startsWith('—') ? '' : currentWord.ipa,
        transcript,
        currentWord.difficulty
      )
      setResult(res)

      await supabase.from('pronunciation_sessions').insert({
        user_id: profile.id,
        word: currentWord.word,
        ipa_notation: currentWord.ipa.startsWith('—') ? null : currentWord.ipa,
        difficulty: currentWord.difficulty,
        clarity_score: res.clarity_score,
        word_accuracy: res.word_accuracy,
        problem_words: res.problem_words,
        mispronounced_words: res.mispronounced_words,
        ai_feedback: res.ai_feedback,
        improvement_suggestions: res.improvement_suggestions,
      })

      const { data } = await supabase
        .from('pronunciation_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      setSessions(data || [])
    } catch {
      // silent
    }

    setEvaluating(false)
  }

  const practicedToday = sessions.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length

  const progressData = [...sessions].reverse().map((s, i) => ({
    attempt: `A${i + 1}`,
    clarity: s.clarity_score || 0,
    accuracy: s.word_accuracy || 0,
  }))

  const navigateTo = (idx: number) => {
    setCurrentIndex(idx)
    setResult(null)
    setTranscript('')
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Pronunciation Lab</h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 15, marginBottom: 24 }}>
        Search any technical word, hear the correct pronunciation, record your attempt, and get AI feedback.
        Type any custom word to practice unlimited vocabulary.
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="glass-card-static" style={{ padding: 20, flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Practiced Today</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{practicedToday}</p>
        </div>
        <div className="glass-card-static" style={{ padding: 20, flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Total Words Practiced</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{sessions.length}</p>
        </div>
        <div className="glass-card-static" style={{ padding: 20, flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Average Clarity</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
            {sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + (x.clarity_score || 0), 0) / sessions.length) : '—'}
          </p>
        </div>
        <div className="glass-card-static" style={{ padding: 20, flex: 1 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Words Available</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{allWords.length}+</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Main Practice Card */}
        <div>
          <div className="glass-card-static" style={{ padding: 32, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <span className={`badge badge-${currentWord.difficulty === 'Easy' ? 'neutral' : currentWord.difficulty === 'Medium' ? 'metallic' : 'primary'}`}>{currentWord.difficulty}</span>
              {currentWord.custom && <span className="badge badge-neutral">Custom Word</span>}
            </div>

            <p style={{ fontSize: 42, fontWeight: 700, textAlign: 'center', marginBottom: 8, color: 'var(--color-text-primary)' }}>{currentWord.word}</p>

            {!currentWord.ipa.startsWith('—') && (
              <p style={{ fontSize: 18, textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 4, fontStyle: 'italic' }}>{currentWord.ipa}</p>
            )}

            {/* Syllable visualization */}
            <p style={{ fontSize: 15, textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 24, letterSpacing: 2 }}>
              {currentWord.word.split('').map((c, i) => {
                const isVowel = 'aeiouAEIOU'.includes(c)
                return isVowel
                  ? <span key={i} style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{c}</span>
                  : <span key={i}>{c}</span>
              })}
            </p>

            {/* Listen button */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <button className="btn-secondary" onClick={() => speakWord(currentWord.word)}>
                <Volume2 size={18} /> Listen to Correct Pronunciation
              </button>
            </div>

            {/* Mic button */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {isRecording ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 16, height: 40, alignItems: 'center' }}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.05}s`, height: `${20 + Math.random() * 20}px` }} />
                    ))}
                  </div>
                  <p style={{ color: 'var(--color-primary)', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recording... Say "{currentWord.word}"</p>
                  <button className="btn-secondary" onClick={stopRecording}>Stop Recording</button>
                </div>
              ) : (
                <button
                  onClick={startRecording}
                  style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)',
                    border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(255,94,120,0.3)',
                  }}
                >
                  <Mic size={30} color="white" />
                </button>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>You said:</p>
                <p style={{ fontSize: 16, fontWeight: 500 }}>{transcript}</p>
              </div>
            )}

            {/* Evaluate button */}
            {transcript && !result && (
              <div style={{ textAlign: 'center' }}>
                <button className="btn-primary" onClick={evaluate} disabled={evaluating}>
                  {evaluating
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Evaluating...</>
                    : <><Sparkles size={18} /> Evaluate Pronunciation</>}
                </button>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="animate-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,94,120,0.06)', border: '1px solid rgba(255,94,120,0.15)', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Clarity Score</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>{result.clarity_score}</p>
                  </div>
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(232,180,160,0.08)', border: '1px solid rgba(232,180,160,0.2)', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Word Accuracy</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: '#B8826A' }}>{result.word_accuracy}</p>
                  </div>
                </div>

                {result.problem_words.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Problem Words:</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.problem_words.map((w, i) => <span key={i} className="badge badge-medium">{w}</span>)}
                    </div>
                  </div>
                )}

                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-border)', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} color="var(--color-primary)" /> AI Feedback
                  </p>
                  <p style={{ fontSize: 14, lineHeight: 1.7 }}>{result.ai_feedback}</p>
                </div>

                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Improvement Suggestions:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.improvement_suggestions.map((s, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--color-text-muted)', paddingLeft: 16, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--color-primary)' }}>•</span> {s}
                      </p>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button className="btn-secondary" onClick={() => { setResult(null); setTranscript('') }} style={{ fontSize: 13 }}>
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
              <button className="btn-ghost" onClick={() => navigateTo(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
                <ChevronLeft size={18} /> Previous
              </button>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)', alignSelf: 'center' }}>{currentIndex + 1} / {filteredWords.length}</span>
              <button className="btn-ghost" onClick={() => navigateTo(Math.min(filteredWords.length - 1, currentIndex + 1))} disabled={currentIndex >= filteredWords.length - 1}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Progress Chart */}
          {progressData.length > 0 && (
            <div className="glass-card-static" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={18} color="var(--color-primary)" />
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Pronunciation Progress</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={progressData}>
                  <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,94,120,0.2)', borderRadius: 12, fontSize: 13 }} />
                  <Line type="monotone" dataKey="clarity" stroke="#FF5E78" strokeWidth={2.5} dot={{ fill: '#FF5E78', r: 4 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#E8B4A0" strokeWidth={2.5} dot={{ fill: '#E8B4A0', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="glass-card-static" style={{ padding: 20, position: 'sticky', top: 24 }}>
            {/* Custom Word Input */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 8 }}>ADD ANY WORD TO PRACTICE</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="glass-input"
                  placeholder="Type any word..."
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomWord()}
                  style={{ fontSize: 13, padding: '10px 14px', flex: 1 }}
                />
                <button
                  onClick={addCustomWord}
                  disabled={!customWordInput.trim()}
                  style={{
                    padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #FF5E78, #FF8FA3)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, opacity: customWordInput.trim() ? 1 : 0.5,
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>Press Enter or click + to add any technical word for unlimited practice</p>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                className="glass-input"
                placeholder="Search words..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentIndex(0); setResult(null); setTranscript('') }}
                style={{ paddingLeft: 38, fontSize: 13, padding: '10px 12px 10px 38px' }}
              />
            </div>

            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: 1, marginBottom: 12 }}>PRACTICE WORDS ({filteredWords.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 480, overflowY: 'auto' }}>
              {filteredWords.map((w, i) => (
                <div
                  key={`${w.word}-${i}`}
                  style={{
                    padding: '8px 12px', borderRadius: 10,
                    border: currentIndex === i ? '1px solid var(--color-primary)' : '1px solid transparent',
                    background: currentIndex === i ? 'rgba(255,94,120,0.06)' : 'transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <button
                    onClick={() => navigateTo(i)}
                    style={{
                      flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: currentIndex === i ? 'var(--color-primary)' : 'var(--color-text-primary)' }}>{w.word}</span>
                    <span className={`badge badge-${w.difficulty === 'Easy' ? 'neutral' : w.difficulty === 'Medium' ? 'metallic' : 'primary'}`} style={{ fontSize: 10, padding: '2px 6px', marginLeft: 8 }}>{w.difficulty}</span>
                  </button>
                  {w.custom && (
                    <button
                      onClick={() => removeCustomWord(w.word)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: 'var(--color-text-muted)' }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
