import { supabase } from '@/lib/supabase'
import type { QuestionFeedback, ReportData, ScoreSet } from '@/types'
import { DOMAIN_TOPICS } from '@/types'

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL

const VARIETY_ANGLES = [
  'definition', 'comparison', 'tradeoffs', 'debugging', 'scenario',
  'optimization', 'coding', 'behavioral', 'case study', 'architecture',
  'edge case', 'best practice', 'common mistake', 'performance', 'security',
  'scalability', 'real-world application', 'design decision', 'troubleshooting',
  'implementation detail', 'conceptual depth', 'practical experience',
  'failure scenario', 'integration', 'testing', 'maintenance', 'evolution',
  'when to use', 'when not to use', 'alternatives',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getClientFallbackQuestion(
  domain: string,
  difficulty: string,
  interviewType: string,
  topic: string | undefined,
  previousQuestions: string[],
): string {
  const topics = DOMAIN_TOPICS[domain]
  const angle = pickRandom(VARIETY_ANGLES)

  let chosenTopic: string
  if (topic) {
    chosenTopic = topic
  } else if (topics && topics.length > 0) {
    const available = topics.filter(t => !previousQuestions.some(q => q.toLowerCase().includes(t)))
    chosenTopic = available.length > 0 ? pickRandom(available) : pickRandom(topics)
  } else {
    chosenTopic = domain
  }

  const diffPrefix = difficulty === 'Hard' ? 'advanced' : difficulty === 'Easy' ? 'fundamental' : 'intermediate'

  const templates: Record<string, string> = {
    definition: `Explain ${chosenTopic} in ${domain}. What problem does it solve and why is it important?`,
    comparison: `Compare two common approaches to ${chosenTopic} in ${domain}. When would you choose each?`,
    tradeoffs: `What are the key tradeoffs when working with ${chosenTopic} in ${domain}? How do you decide which approach to take?`,
    debugging: `Walk me through how you would debug a complex issue related to ${chosenTopic} in ${domain}.`,
    scenario: `You encounter a ${diffPrefix} problem involving ${chosenTopic} in ${domain}. How do you approach it step by step?`,
    optimization: `How would you optimize a solution that relies on ${chosenTopic} in ${domain}? What metrics would you track?`,
    coding: `Write and explain code that demonstrates ${chosenTopic} in ${domain}. Walk through your implementation choices.`,
    behavioral: `Tell me about a time you had to apply ${chosenTopic} in a real ${domain} project. What challenges did you face?`,
    'case study': `Given a real-world scenario in ${domain} involving ${chosenTopic}, walk me through your analysis and solution.`,
    architecture: `How does ${chosenTopic} fit into the overall architecture of a ${domain} system? What role does it play?`,
    'edge case': `What are the most important edge cases to handle when working with ${chosenTopic} in ${domain}?`,
    'best practice': `What are the best practices for using ${chosenTopic} effectively in ${domain}?`,
    'common mistake': `What are the most common mistakes developers make with ${chosenTopic} in ${domain}, and how do you avoid them?`,
    performance: `How does ${chosenTopic} impact performance in ${domain}? What optimization strategies would you apply?`,
    security: `What security considerations should you keep in mind when working with ${chosenTopic} in ${domain}?`,
    scalability: `How does ${chosenTopic} affect the scalability of a ${domain} system? What would you do at scale?`,
    'real-world application': `Describe a real-world use case for ${chosenTopic} in ${domain}. How did you or would you implement it?`,
    'design decision': `What design decisions are involved when incorporating ${chosenTopic} into a ${domain} project?`,
    troubleshooting: `How would you troubleshoot a production issue related to ${chosenTopic} in ${domain}?`,
    'implementation detail': `Walk me through the implementation details of ${chosenTopic} in ${domain}. What are the key internals?`,
    'conceptual depth': `Demonstrate deep conceptual understanding of ${chosenTopic} in ${domain}. Go beyond surface-level definitions.`,
    'practical experience': `Share your practical experience with ${chosenTopic} in ${domain}. What did you learn from working with it?`,
    'failure scenario': `Describe a scenario where ${chosenTopic} could fail in ${domain}. How would you prevent or mitigate it?`,
    integration: `How does ${chosenTopic} integrate with other components in a ${domain} system?`,
    testing: `How would you test functionality related to ${chosenTopic} in ${domain}? What test strategies work best?`,
    maintenance: `What maintenance challenges does ${chosenTopic} introduce in a ${domain} codebase?`,
    evolution: `How has ${chosenTopic} evolved in ${domain}? What has changed and why?`,
    'when to use': `When should you use ${chosenTopic} in ${domain}? What signals tell you it is the right choice?`,
    'when not to use': `When should you avoid ${chosenTopic} in ${domain}? What are the alternatives?`,
    alternatives: `What are the alternatives to ${chosenTopic} in ${domain}? Compare them and explain when each is better.`,
  }

  let question = templates[angle] || templates.definition

  if (interviewType === 'HR' || interviewType === 'Behavioral') {
    question = `Tell me about your experience with ${chosenTopic} in ${domain}. What did you learn and how has it shaped your approach?`
  }

  if (previousQuestions.includes(question)) {
    const altTopics = topics?.filter(t => t !== chosenTopic) || [domain]
    const altTopic = pickRandom(altTopics)
    const altAngle = pickRandom(VARIETY_ANGLES.filter(a => a !== angle))
    question = templates[altAngle]?.replace(chosenTopic, altTopic) || `Explain ${altTopic} in ${domain}. What problem does it solve?`
  }

  return question
}

async function callFunction(name: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await fetch(`${FUNCTION_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Function ${name} failed: ${errText}`)
  }

  return res.json()
}

export async function generateQuestion(
  domain: string,
  difficulty: string,
  interviewType: string,
  topic: string | undefined,
  previousQuestions: string[] = [],
): Promise<{ question: string; domain: string; difficulty: string; type: string; topic: string | null }> {
  try {
    const data = await callFunction('generate-question', {
      domain,
      difficulty,
      interview_type: interviewType,
      topic,
      previous_questions: previousQuestions,
    })

    // Clean the question - handle JSON-in-JSON, escaped quotes, raw braces
    let question: string = String(data.question ?? '')
    if (question.startsWith('{')) {
      try {
        const parsed = JSON.parse(question)
        if (parsed.question) question = String(parsed.question)
      } catch { /* ignore */ }
    }
    // Remove any remaining JSON artifacts
    question = question.replace(/\\"/g, '"').replace(/\\n/g, ' ')
    // Remove leading/trailing quotes
    question = question.replace(/^["']+|["']+$/g, '').trim()

    if (!question || question.length < 15) {
      throw new Error('Invalid question in response')
    }

    // Validate it ends with ? or . (complete sentence)
    if (!/[?.]$/.test(question)) {
      question = question + '?'
    }

    return { question, domain, difficulty, type: interviewType, topic: topic ?? null }
  } catch {
    return {
      question: getClientFallbackQuestion(domain, difficulty, interviewType, topic, previousQuestions),
      domain,
      difficulty,
      type: interviewType,
      topic: topic ?? null,
    }
  }
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  domain: string,
  difficulty: string,
  interviewType: string,
  topic: string | undefined,
  voiceTranscript?: string,
  voiceMetrics?: Record<string, unknown>,
): Promise<QuestionFeedback> {
  const data = await callFunction('evaluate-answer', {
    question, answer, domain, difficulty, interview_type: interviewType,
    topic,
    voice_transcript: voiceTranscript, voice_metrics: voiceMetrics,
  })

  const scores = data.scores as ScoreSet
  return {
    scores,
    feedback: data.feedback as string,
    feedback_detail: data.feedback_detail as QuestionFeedback['feedback_detail'],
    score_breakdown: data.score_breakdown as QuestionFeedback['score_breakdown'],
    follow_up_question: data.follow_up_question as string,
    model_answer: data.model_answer as string,
    example_answer: data.example_answer as string | undefined,
    keywords_used: data.keywords_used as string[] | undefined,
    keywords_missed: data.keywords_missed as string[] | undefined,
    expected_keywords: data.expected_keywords as string[] | undefined,
    speaking_time_seconds: data.speaking_time_seconds as number | undefined,
    ideal_speaking_time: data.ideal_speaking_time as string | undefined,
    speaking_time_feedback: data.speaking_time_feedback as string | undefined,
    ideal_answer: data.ideal_answer as QuestionFeedback['ideal_answer'],
  }
}

export async function generateReport(
  sessionData: Record<string, unknown>,
  answers: Record<string, unknown>[],
  domain: string,
  difficulty: string,
  interviewType: string,
  topic: string | undefined,
): Promise<ReportData> {
  const data = await callFunction('generate-report', {
    session_data: sessionData, answers, domain, difficulty, interview_type: interviewType,
    topic,
  })
  return data as unknown as ReportData
}

export interface QuestionDetails {
  question: string
  domain: string
  difficulty: string
  expected_concepts: string[]
  key_points: string[]
  model_answer: string
  alternative_answer: string
  common_mistakes: string[]
  follow_up_questions: string[]
  tips: string[]
}

export async function getQuestionDetails(
  question: string,
  domain: string,
  difficulty: string,
  interview_type: string,
  topic: string | undefined,
): Promise<QuestionDetails> {
  const data = await callFunction('question-details', { question, domain, difficulty, interview_type, topic })
  return data as unknown as QuestionDetails
}

export async function evaluatePronunciation(
  word: string,
  ipaNotation: string,
  userTranscript: string,
  difficulty: string,
): Promise<{
  clarity_score: number
  word_accuracy: number
  problem_words: string[]
  mispronounced_words: string[]
  ai_feedback: string
  improvement_suggestions: string[]
}> {
  const data = await callFunction('evaluate-pronunciation', {
    word, ipa_notation: ipaNotation, user_transcript: userTranscript, difficulty,
  })
  return data as {
    clarity_score: number
    word_accuracy: number
    problem_words: string[]
    mispronounced_words: string[]
    ai_feedback: string
    improvement_suggestions: string[]
  }
}
