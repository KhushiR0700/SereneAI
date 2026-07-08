import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { generateQuestion, getQuestionDetails } from '@/lib/api'
import type { QuestionDetails } from '@/lib/api'
import {
  Search, Bookmark, BookmarkCheck, ArrowRight, Library, Sparkles,
  ChevronDown, ChevronUp, X, Target, Lightbulb, AlertCircle,
  CheckCircle2, MessageSquare, RefreshCw, Filter,
} from 'lucide-react'
import type { SavedQuestion } from '@/types'
import { DOMAINS, DIFFICULTIES, INTERVIEW_TYPES } from '@/types'

interface LibraryQuestion {
  id: string
  question: string
  domain: string
  difficulty: string
  type: string
  saved: boolean
  savedId?: string
  is_favorite?: boolean
}

const BATCH_SIZE = 12

export default function QuestionLibrary() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [questions, setQuestions] = useState<LibraryQuestion[]>([])
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [generating, setGenerating] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [details, setDetails] = useState<QuestionDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailSection, setDetailSection] = useState<string>('model')

  const allGeneratedRef = useRef<string[]>([]) // tracks all generated question texts to avoid repeats

  // Load saved questions from DB
  useEffect(() => {
    if (!profile) return
    supabase
      .from('saved_questions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSavedQuestions(data as SavedQuestion[])
      })
  }, [profile])

  // Merge saved questions into questions list
  const savedAsLibrary: LibraryQuestion[] = savedQuestions.map(sq => ({
    id: sq.id,
    question: sq.question_text,
    domain: sq.domain || 'General',
    difficulty: sq.difficulty || 'Medium',
    type: sq.question_type || 'Technical',
    saved: true,
    savedId: sq.id,
    is_favorite: sq.is_favorite,
  }))

  const generateBatch = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true)
    else setGenerating(true)

    const domain = filterDomain || ''
    const difficulty = filterDifficulty || ''
    const type = filterType || ''

    // Rotate across domains when no filter set
    const domainsToUse = domain
      ? [domain]
      : ['React', 'Python', 'DSA', 'JavaScript', 'Java', 'SQL', 'System Design', 'OOP', 'DBMS', 'Computer Networks', 'Operating Systems', 'Machine Learning', 'C++', 'Node.js', 'TypeScript']
    const diffsToUse = difficulty ? [difficulty] : ['Easy', 'Medium', 'Hard', 'Medium', 'Hard', 'Easy', 'Medium', 'Hard', 'Easy', 'Medium', 'Hard', 'Medium']
    const typesToUse = type ? [type] : ['Technical', 'Technical', 'Technical', 'Behavioral', 'Technical', 'Technical', 'Technical', 'HR', 'Technical', 'Technical', 'Technical', 'Technical']

    const prev = allGeneratedRef.current

    const newBatch: LibraryQuestion[] = []
    for (let i = 0; i < BATCH_SIZE; i++) {
      const d = domainsToUse[i % domainsToUse.length]
      const diff = diffsToUse[i % diffsToUse.length]
      const t = typesToUse[i % typesToUse.length]
      try {
        const q = await generateQuestion(d, diff, t, undefined, [...prev, ...newBatch.map(nb => nb.question)])
        if (q.question && !prev.includes(q.question)) {
          newBatch.push({
            id: `gen-${Date.now()}-${i}`,
            question: q.question,
            domain: q.domain || d,
            difficulty: q.difficulty || diff,
            type: q.type || t,
            saved: false,
          })
        }
      } catch { /* continue */ }
    }

    allGeneratedRef.current = [...prev, ...newBatch.map(nb => nb.question)]

    if (isLoadMore) {
      setQuestions(prev => [...prev, ...newBatch])
    } else {
      setQuestions(newBatch)
    }

    if (isLoadMore) setLoadingMore(false)
    else setGenerating(false)
  }, [filterDomain, filterDifficulty, filterType])

  // Initial load
  useEffect(() => {
    generateBatch(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-generate when filters change (only domain/difficulty/type, not search)
  const prevFilters = useRef({ filterDomain, filterDifficulty, filterType })
  useEffect(() => {
    const prev = prevFilters.current
    if (prev.filterDomain !== filterDomain || prev.filterDifficulty !== filterDifficulty || prev.filterType !== filterType) {
      prevFilters.current = { filterDomain, filterDifficulty, filterType }
      allGeneratedRef.current = []
      generateBatch(false)
    }
  }, [filterDomain, filterDifficulty, filterType, generateBatch])

  const allQuestions: LibraryQuestion[] = [
    ...questions,
    // Add saved questions that aren't already in generated list
    ...savedAsLibrary.filter(sq => !questions.some(q => q.question === sq.question)),
  ]

  const filtered = allQuestions.filter(q => {
    if (showFavorites && !q.is_favorite) return false
    if (search) {
      const s = search.toLowerCase()
      if (!q.question.toLowerCase().includes(s) && !q.domain.toLowerCase().includes(s)) return false
    }
    if (filterDomain && q.domain !== filterDomain) return false
    if (filterDifficulty && q.difficulty !== filterDifficulty) return false
    if (filterType && q.type !== filterType) return false
    return true
  })

  const loadDetails = async (q: LibraryQuestion) => {
    if (selectedId === q.id) {
      setSelectedId(null)
      setDetails(null)
      return
    }
    setSelectedId(q.id)
    setDetails(null)
    setDetailsLoading(true)
    setDetailSection('model')
    try {
      const d = await getQuestionDetails(q.question, q.domain, q.difficulty, q.type, undefined)
      setDetails(d)
    } catch { setDetails(null) }
    setDetailsLoading(false)
  }

  const saveQuestion = async (q: LibraryQuestion) => {
    if (!profile) return
    const existing = savedQuestions.find(sq => sq.question_text === q.question)
    if (existing) return

    const { data } = await supabase.from('saved_questions').insert({
      user_id: profile.id,
      question_text: q.question,
      domain: q.domain,
      difficulty: q.difficulty,
      question_type: q.type,
      is_favorite: false,
      practice_later: true,
    }).select().single()

    if (data) {
      setSavedQuestions(prev => [data as SavedQuestion, ...prev])
      setQuestions(prev => prev.map(pq => pq.id === q.id ? { ...pq, saved: true, savedId: data.id } : pq))
    }
  }

  const toggleFavorite = async (savedId: string, current: boolean) => {
    await supabase.from('saved_questions').update({ is_favorite: !current }).eq('id', savedId)
    setSavedQuestions(prev => prev.map(sq => sq.id === savedId ? { ...sq, is_favorite: !current } : sq))
    setQuestions(prev => prev.map(q => q.savedId === savedId ? { ...q, is_favorite: !current } : q))
  }

  const removeSaved = async (savedId: string) => {
    await supabase.from('saved_questions').delete().eq('id', savedId)
    setSavedQuestions(prev => prev.filter(sq => sq.id !== savedId))
    setQuestions(prev => prev.map(q => q.savedId === savedId ? { ...q, saved: false, savedId: undefined, is_favorite: false } : q))
  }

  const diffColor = (d: string) => d === 'Hard' ? 'badge-primary' : d === 'Medium' ? 'badge-metallic' : 'badge-neutral'

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Question Library</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
            {filtered.length} questions · Search any topic · Browse by domain, difficulty, or type
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => { allGeneratedRef.current = []; generateBatch(false) }}
            disabled={generating}
          >
            <RefreshCw size={16} style={{ animation: generating ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => generateBatch(true)}
            disabled={loadingMore || generating}
          >
            {loadingMore
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</>
              : <><Sparkles size={16} /> Load More Questions</>}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card-static" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
            <Search size={17} color="var(--color-text-muted)" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              className="glass-input"
              placeholder="Search questions, topics, keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 40 }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <X size={15} color="var(--color-text-muted)" />
              </button>
            )}
          </div>

          <select className="glass-input" style={{ width: 'auto', flex: '0 0 auto' }} value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
            <option value="">All Domains</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="glass-input" style={{ width: 'auto', flex: '0 0 auto' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="glass-input" style={{ width: 'auto', flex: '0 0 auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button
            onClick={() => setShowFavorites(!showFavorites)}
            style={{
              padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500,
              border: showFavorites ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: showFavorites ? 'rgba(255,94,120,0.08)' : 'rgba(255,255,255,0.5)',
              color: showFavorites ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-body)', flexShrink: 0,
            }}
          >
            <Filter size={14} /> Favorites
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {generating && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-static" style={{ padding: 20, borderRadius: 16 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[60, 70, 50].map((w, j) => (
                  <div key={j} style={{ width: w, height: 22, borderRadius: 20, background: 'rgba(212,201,197,0.3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
              <div style={{ height: 20, borderRadius: 4, background: 'rgba(212,201,197,0.25)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 20, width: '70%', borderRadius: 4, background: 'rgba(212,201,197,0.2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      )}

      {/* Questions list */}
      {!generating && (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Library size={44} color="var(--color-text-muted)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                {search ? `No questions match "${search}"` : 'No questions yet'}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                {search ? 'Try a different keyword or clear the search filter.' : 'Click "Refresh" to generate questions.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map(q => {
                const isOpen = selectedId === q.id
                return (
                  <div
                    key={q.id}
                    className="glass-card"
                    style={{
                      padding: 20,
                      border: isOpen ? '1px solid rgba(255,94,120,0.35)' : undefined,
                      background: isOpen ? 'rgba(255,94,120,0.015)' : undefined,
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    {/* Question header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                          <span className={`badge ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
                          <span className="badge badge-primary">{q.domain}</span>
                          <span className="badge badge-neutral">{q.type}</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.6, marginBottom: 12 }}>{q.question}</p>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <button
                            className="btn-ghost"
                            onClick={() => navigate('/studio')}
                            style={{ color: 'var(--color-primary)', padding: '4px 0', fontSize: 13 }}
                          >
                            Practice this <ArrowRight size={14} />
                          </button>
                          <button
                            className="btn-ghost"
                            onClick={() => loadDetails(q)}
                            style={{ padding: '4px 0', fontSize: 13, color: isOpen ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                          >
                            {isOpen ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> View Details</>}
                          </button>
                        </div>
                      </div>

                      {/* Save / favorite */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {q.saved && q.savedId ? (
                          <>
                            <button
                              onClick={() => toggleFavorite(q.savedId!, q.is_favorite || false)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}
                              title={q.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              {q.is_favorite
                                ? <BookmarkCheck size={20} color="var(--color-primary)" />
                                : <Bookmark size={20} color="var(--color-text-muted)" />}
                            </button>
                            <button
                              onClick={() => removeSaved(q.savedId!)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, fontSize: 12, color: 'var(--color-text-muted)' }}
                            >
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => saveQuestion(q)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}
                            title="Save question"
                          >
                            <Bookmark size={20} color="var(--color-text-muted)" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable details panel */}
                    {isOpen && (
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                        {detailsLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                            <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading question details...</span>
                          </div>
                        ) : details ? (
                          <QuestionDetailView
                            details={details}
                            openSection={detailSection}
                            onToggle={s => setDetailSection(detailSection === s ? '' : s)}
                          />
                        ) : (
                          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Could not load details. Please try again.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Load more */}
              <div style={{ textAlign: 'center', paddingTop: 12 }}>
                <button
                  className="btn-secondary"
                  onClick={() => generateBatch(true)}
                  disabled={loadingMore}
                  style={{ minWidth: 180 }}
                >
                  {loadingMore
                    ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
                    : <><Sparkles size={16} /> Load More Questions</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Question Detail View ─────────────────────────────────────────────────────

function QuestionDetailView({
  details,
  openSection,
  onToggle,
}: {
  details: QuestionDetails
  openSection: string
  onToggle: (s: string) => void
}) {
  const sections = [
    {
      key: 'model',
      title: 'Model Interview Answer',
      icon: <CheckCircle2 size={15} color="var(--color-primary)" />,
      content: (
        <div>
          <p style={{ fontSize: 14, lineHeight: 1.75, marginBottom: details.alternative_answer ? 16 : 0 }}>{details.model_answer}</p>
          {details.alternative_answer && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 8 }}>ALTERNATIVE APPROACH</p>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>{details.alternative_answer}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'concepts',
      title: 'Key Concepts & What Interviewers Expect',
      icon: <Target size={15} color="var(--color-primary)" />,
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 10 }}>KEY CONCEPTS</p>
            {(details.expected_concepts || []).map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0, marginTop: 7 }} />
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{c}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: 0.5, marginBottom: 10 }}>WHAT INTERVIEWER EXPECTS</p>
            {(details.key_points || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,94,120,0.5)', flexShrink: 0, marginTop: 7 }} />
                <p style={{ fontSize: 13, lineHeight: 1.5 }}>{p}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'mistakes',
      title: 'Common Mistakes to Avoid',
      icon: <AlertCircle size={15} color="#B8826A" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(details.common_mistakes || []).map((m, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(232,180,160,0.07)', border: '1px solid rgba(232,180,160,0.2)', fontSize: 13, lineHeight: 1.6 }}>
              {m}
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'related',
      title: 'Related Follow-up Questions',
      icon: <MessageSquare size={15} color="var(--color-primary)" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(details.follow_up_questions || []).map((fq, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,94,120,0.04)', border: '1px solid rgba(255,94,120,0.1)', fontSize: 13, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
              "{fq}"
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'tips',
      title: 'Tips from Interviewer',
      icon: <Lightbulb size={15} color="var(--color-primary)" />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(details.tips || []).map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(255,94,120,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{i + 1}</div>
              <p style={{ fontSize: 13, lineHeight: 1.6 }}>{tip}</p>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sections.map(s => (
        <div key={s.key} style={{ borderRadius: 10, border: '1px solid var(--color-border)', overflow: 'hidden', background: 'rgba(255,255,255,0.3)' }}>
          <button
            onClick={() => onToggle(s.key)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.icon}
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
            </div>
            {openSection === s.key
              ? <ChevronUp size={14} color="var(--color-text-muted)" />
              : <ChevronDown size={14} color="var(--color-text-muted)" />}
          </button>
          {openSection === s.key && (
            <div style={{ padding: '0 14px 14px' }}>{s.content}</div>
          )}
        </div>
      ))}
    </div>
  )
}
