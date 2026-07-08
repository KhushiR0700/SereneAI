import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const NON_TECHNICAL_DOMAINS = new Set(["General", "HR", "Aptitude", "Behavioral"]);

// ── GEMINI MODEL CONFIGURATION (2026) ─────────────────────────────
// Current supported models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite
// DEPRECATED (DO NOT USE): gemini-1.5-flash (SHUT DOWN), gemini-2.0-flash (SHUT DOWN)
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiResult {
  text: string;
  error: { status: number; message: string } | null;
}

async function callGeminiWithFallback(
  prompt: string,
  temperature = 0.25,
  maxTokens = 7000
): Promise<GeminiResult> {
  if (!GEMINI_KEY) {
    console.error("GEMINI_API_KEY not configured");
    return { text: "", error: { status: 500, message: "API key not configured" } };
  }

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${GEMINI_KEY}`;
    try {
      console.log(`Trying Gemini model: ${model}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens, topP: 0.95, topK: 50 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Gemini ${model} returned ${res.status}:`, errText.slice(0, 200));
        if (res.status === 401 || res.status === 403) {
          return { text: "", error: { status: res.status, message: "Invalid API key" } };
        }
        continue; // Try next model
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (!text) {
        if (data?.candidates?.[0]?.finishReason === "SAFETY") {
          console.error(`Gemini ${model} blocked by safety`);
          continue;
        }
        console.error(`Gemini ${model} returned empty response`);
        continue;
      }

      console.log(`Gemini ${model} succeeded with ${text.length} chars`);
      return { text, error: null };
    } catch (err) {
      console.error(`Gemini ${model} fetch error:`, err);
      continue;
    }
  }

  return { text: "", error: { status: 500, message: "AI service temporarily unavailable. Please try again." } };
}

function parseJSON(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const cleaned = text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```$/im, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* fall through */ } }
  return null;
}

function isDontKnow(text: string): boolean {
  return /^\s*(i\s+don'?t\s+know|no\s+idea|idk|not\s+sure|i\s+have\s+no\s+idea|i'm?\s+not\s+sure|no\s+clue|can'?t\s+answer|i\s+don'?t\s+have\s+any)\s*[.!?]?\s*$/i.test(text.trim());
}

function isEmpty(text: string): boolean {
  return !text || text.trim().length < 10;
}

function estimateSpeakingTime(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words / 130) * 60);
}

function getIdealSpeakingTime(difficulty: string, interview_type: string): string {
  if (interview_type === "HR" || interview_type === "Behavioral") return "90-150 seconds";
  if (difficulty === "Hard") return "90-150 seconds";
  if (difficulty === "Medium") return "60-120 seconds";
  return "45-90 seconds";
}

function buildDontKnowResult(question: string, domain: string, difficulty: string): Record<string, unknown> {
  // Extract key concept from the question for more specific guidance
  const questionLower = question.toLowerCase();
  let conceptHint = "this concept";
  let exampleHint = "a specific real-world scenario";

  // Try to identify what the question is asking about
  if (questionLower.includes("what is") || questionLower.includes("explain")) {
    const parts = question.split(/\s+/).slice(0, 8).join(" ");
    conceptHint = parts.length > 20 ? parts.substring(0, 50) + "..." : parts;
  }

  return {
    scores: { communication: 5, confidence: 3, technical: 3, pronunciation: 20, clarity: 5, problem_solving: 3, overall: 5 },
    feedback: `Your Answer: 5/100 — Silence is the only wrong answer. Even saying "I'm not certain, but I believe it relates to..." gives us something to work with. A real interviewer wants to see your reasoning process, not just the correct answer.`,
    score_breakdown: {
      score: 5,
      what_you_did_well: [],
      what_was_missing: [
        "Any reasoning or attempt to work through the problem",
        "Acknowledgment of partial knowledge with related concepts",
        "Questions to clarify what you do understand",
      ],
      how_to_make_90: `Start with: "I'm not 100% certain, but let me reason through this..." Then share any related knowledge, ask clarifying questions, or work from first principles. We hire for problem-solving ability, not encyclopedic knowledge.`,
    },
    feedback_detail: {
      executive_summary: `"I don't know" ends the conversation. In a real interview, I'd probe: "Take a guess — what might this relate to?" Your ability to reason through uncertainty matters more than knowing the exact answer.`,
      strengths: [],
      weaknesses: [
        "No reasoning process demonstrated",
        "No attempt to connect to related concepts you might know",
        "Missed opportunity to show problem-solving under uncertainty",
      ],
      missing_concepts: ["The specific answer to this question — but more importantly, your reasoning approach"],
      what_interviewer_expected: `An honest attempt: "I'm not certain about ${conceptHint}, but based on my understanding of ${domain}, I would approach it by..." — This shows you can think on your feet.`,
      top_3_fixes: [
        "Replace 'I don't know' with 'Let me think through this...' — then share any related knowledge",
        `Before your next interview, practice the technique: when stuck, state what you DO know about the topic`,
        "For this specific question, study: the definition, how it works internally, and one concrete example",
      ],
      hiring_readiness: "Not ready — but this is fixable with practice. The skill is reasoning aloud, not memorizing answers.",
    },
    follow_up_question: `Let's try this differently: What ${domain} concept IS most familiar to you? Let's start there and work toward this.`,
    model_answer: `When asked "${question}", structure your response like this:

First, give a precise definition in one sentence. Then explain the internal mechanism — how it actually works step-by-step under the hood. Next, provide a concrete real-world example with specific names, numbers, or scenarios. Finally, mention one tradeoff, limitation, or edge case that shows depth of understanding.

For example, if asked about a networking concept: define what it is, explain the handshake or protocol steps, give an example with actual port numbers or timing, and mention a failure case. This pattern works for almost any technical question.`,
    ideal_answer: {
      full_answer: `Here's how a strong candidate would answer this type of question: "That's an interesting question about ${conceptHint}. Let me start with the definition: [precise technical definition]. Now, how does it actually work under the hood? Internally, [explain the mechanism step by step]. For a concrete example, [give ${exampleHint} with specifics like company names, metrics, or real scenarios]. One key tradeoff to consider is [mention a limitation or design decision]. Does that answer what you were looking for, or should I go deeper on any part?" This structure — definition, mechanism, example, tradeoff — works for nearly any technical interview question.`,
      why_strong: "This answer demonstrates: (1) precise technical knowledge, (2) understanding of internal workings not just surface-level definitions, (3) practical experience through specific examples, and (4) systems thinking by acknowledging tradeoffs. Interviewers look for all four.",
      short_answer: `Define precisely, explain the internal mechanism, give one concrete example with real specifics, and mention a tradeoff. The pattern works for any ${domain} question.`,
      common_mistakes: [
        "Saying 'I don't know' instead of reasoning through what you do know",
        "Giving a definition without explaining the internal mechanism",
        "Using a generic example instead of one with actual specifics",
        "Not mentioning any tradeoffs, edge cases, or limitations",
      ],
      interviewer_checklist: [
        "Precise technical definition",
        "Internal mechanism explained step-by-step",
        "Concrete real-world example with specifics",
        "Technical terminology used naturally",
        "Tradeoff, limitation, or edge case discussed",
      ],
      candidate_coverage: [
        { point: "Precise definition", covered: false },
        { point: "Internal mechanism", covered: false },
        { point: "Concrete real-world example", covered: false },
        { point: "Technical terminology", covered: false },
        { point: "Tradeoff or limitation", covered: false },
      ],
    },
    keywords_used: [],
    keywords_missed: [],
    expected_keywords: [],
    speaking_time_seconds: 0,
    ideal_speaking_time: getIdealSpeakingTime(difficulty, "Technical"),
    speaking_time_feedback: "No answer to evaluate. A typical strong answer runs 60-120 seconds for this difficulty level.",
  };
}

function enforceScoreIntegrity(parsed: Record<string, unknown>): void {
  const s = parsed.scores as Record<string, number> | undefined;
  if (!s) return;
  for (const k of ["communication", "confidence", "technical", "pronunciation", "clarity", "problem_solving"]) {
    s[k] = Math.min(100, Math.max(0, Math.round(s[k] ?? 50)));
  }
  const computed = Math.round(
    s.technical * 0.30 + s.communication * 0.20 + s.confidence * 0.15 +
    s.clarity * 0.15 + s.problem_solving * 0.15 + s.pronunciation * 0.05
  );
  if (!s.overall || s.overall > computed + 5) s.overall = computed;
  s.overall = Math.min(100, Math.max(0, s.overall));
}

function buildEvalPrompt(
  question: string, answerText: string, domain: string,
  difficulty: string, interview_type: string
): string {
  const wc = answerText.split(/\s+/).filter(Boolean).length;
  const spk = estimateSpeakingTime(answerText);
  const idealTime = getIdealSpeakingTime(difficulty, interview_type);

  // DETECT INTERVIEW TYPE - this is critical for using the right rubric
  const isHR = interview_type === "HR" || domain === "HR";
  const isBehavioral = interview_type === "Behavioral" || domain === "Behavioral";
  const isTechnical = !isHR && !isBehavioral;

  if (isHR) {
    return buildHREvalPrompt(question, answerText, wc, spk, difficulty, idealTime);
  }

  if (isBehavioral) {
    return buildBehavioralEvalPrompt(question, answerText, wc, spk, difficulty, idealTime);
  }

  // Technical interview rubric
  return buildTechnicalEvalPrompt(question, answerText, wc, spk, difficulty, idealTime, domain);
}

function buildHREvalPrompt(
  question: string, answerText: string, wc: number, spk: number,
  difficulty: string, idealTime: string
): string {
  return `You are an experienced HR recruiter evaluating a candidate's response in a job interview.

EXACT QUESTION ASKED: "${question}"

CANDIDATE'S ANSWER (${wc} words, ~${spk}s spoken):
"""
${answerText}
"""

DIFFICULTY: ${difficulty} | INTERVIEW TYPE: HR

━━━ HR INTERVIEW EVALUATION RULES ━━━

You are evaluating SOFT SKILLS and PROFESSIONAL COMPETENCIES, NOT technical knowledge:

Evaluate based on:
1. CLARITY — Is the answer easy to follow? Well-organized?
2. SELF-AWARENESS — Does the candidate show insight into their own strengths/weaknesses?
3. MOTIVATION & FIT — Does the answer show genuine interest and alignment with career goals?
4. PROFESSIONALISM — Is the tone appropriate? Language professional?
5. CONFIDENCE — Does the candidate speak with assurance without arrogance?
6. AUTHENTICITY — Does the answer feel genuine, not rehearsed or fake?
7. COMMUNICATION — Is the message delivered clearly and effectively?
8. RELEVANCE — Does the answer directly address what was asked?

SCORING FOR HR QUESTIONS:
- 0–15: No answer, completely off-topic, or inappropriate response
- 16–35: Vague, avoids the question, lacks self-awareness
- 36–50: Addresses question but generic, lacks depth or specific examples
- 51–70: Good answer with some specifics, could be more compelling
- 71–85: Strong answer with clear examples, good self-awareness, professional tone
- 86–100: Excellent — engaging, specific examples, shows maturity and self-insight

COMPONENT WEIGHTS FOR HR: communication 30%, confidence 20%, professionalism 15%, clarity 20%, problem_solving 10%, pronunciation 5%. Technical score should be set to 50 (neutral for HR).

DO NOT ask for: technical definitions, mechanisms, technical terminology, tradeoffs.
Instead evaluate: clarity of thought, career motivation, teamwork stories, leadership examples, self-awareness.

━━━ IDEAL HR RESPONSE ━━━

Write an ideal HR interview answer to THIS question as a strong candidate would respond.

Requirements:
- Natural, conversational tone (not scripted)
- Specific, real examples from experience (or hypothetical if no experience)
- Shows self-awareness and growth mindset
- Professional but authentic
- Length: 60-120 words for basic questions, 100-180 words for complex questions

━━━ JSON OUTPUT (return ONLY this JSON) ━━━

{
  "scores": {"communication":N,"confidence":N,"technical":50,"pronunciation":N,"clarity":N,"problem_solving":N,"overall":N},
  "feedback": "Your Answer: X/100 — [specific observation about their HR response]",
  "score_breakdown": {
    "score": X,
    "what_you_did_well": ["specific positive aspects of their HR response"],
    "what_was_missing": ["what a stronger HR answer would include"],
    "how_to_make_90": "Reference THEIR answer and give specific improvement for HR context"
  },
  "feedback_detail": {
    "executive_summary": "1-2 sentences about how they came across in this HR question",
    "strengths": ["specific strengths shown in this HR response"],
    "weaknesses": ["areas where their HR response could improve"],
    "missing_concepts": ["HR competencies not demonstrated"],
    "what_interviewer_expected": "What a strong HR candidate would cover",
    "top_3_fixes": ["HR-specific improvements"],
    "hiring_readiness": "Not ready / Needs work / Borderline / Ready"
  },
  "follow_up_question": "Natural HR follow-up based on their response",
  "model_answer": "An ideal HR candidate response to this question. Natural, specific, authentic.",
  "expected_keywords": ["relevant HR keywords: team, leadership, challenge, growth, example, experience"],
  "keywords_used": ["HR-related terms that appeared in their answer"],
  "keywords_missed": ["HR concepts missing from their response"],
  "speaking_time_seconds": ${spk},
  "ideal_speaking_time": "${idealTime}",
  "speaking_time_feedback": "Assessment of response length for an HR question",
  "ideal_answer": {
    "full_answer": "A natural, spoken HR interview response with specific examples and self-awareness",
    "why_strong": "What makes this HR response effective",
    "short_answer": "Brief version for quick reference",
    "common_mistakes": ["HR answer pitfalls for this question"],
    "interviewer_checklist": ["Clear communication", "Self-awareness shown", "Specific example included", "Professional tone", "Answered the actual question"],
    "candidate_coverage": [
      {"point": "Clear communication", "covered": BOOLEAN},
      {"point": "Self-awareness", "covered": BOOLEAN},
      {"point": "Specific example", "covered": BOOLEAN},
      {"point": "Professional tone", "covered": BOOLEAN},
      {"point": "Direct answer", "covered": BOOLEAN}
    ]
  }
}`;
}

function buildBehavioralEvalPrompt(
  question: string, answerText: string, wc: number, spk: number,
  difficulty: string, idealTime: string
): string {
  return `You are an experienced interviewer evaluating a behavioral interview response using the STAR framework.

EXACT QUESTION ASKED: "${question}"

CANDIDATE'S ANSWER (${wc} words, ~${spk}s spoken):
"""
${answerText}
"""

DIFFICULTY: ${difficulty} | INTERVIEW TYPE: Behavioral

━━━ BEHAVIORAL INTERVIEW EVALUATION RULES ━━━

Evaluate using the STAR FRAMEWORK:
- SITUATION: Did they clearly set up the context? (team, company, project)
- TASK: Did they explain what they needed to accomplish?
- ACTION: Did they describe THEIR specific actions (not "we")? Most important part!
- RESULT: Did they share the outcome with specific impact/numbers?

Also evaluate:
1. OWNERSHIP — Do they say "I did X" instead of just "we did X"?
2. IMPACT — Is the result quantified or clearly meaningful?
3. CLARITY — Is the story easy to follow?
4. REFLECTION — Do they show what they learned?
5. AUTHENTICITY — Does it sound genuine?
6. RELEVANCE — Does the story directly answer the question?

SCORING FOR BEHAVIORAL QUESTIONS:
- 0–15: No relevant story, completely off-topic
- 16–35: Vague story, missing STAR components, no personal action
- 36–50: Has STAR but weak action section, lacks specific details
- 51–70: Complete STAR with some "I" statements, could be more impactful
- 71–85: Strong STAR with clear "I" actions, good result, shows growth
- 86–100: Excellent STAR — compelling story, quantified impact, clear learning

COMPONENT WEIGHTS FOR BEHAVIORAL: communication 25%, confidence 15%, problem_solving 25%, clarity 20%, professionalism 10%, pronunciation 5%. Technical = 50 (neutral).

DO NOT ask for: technical definitions, mechanisms, technical terminology, tradeoffs.
Instead evaluate: STAR structure, personal accountability, story clarity, outcome impact.

━━━ IDEAL BEHAVIORAL RESPONSE ━━━

Write an ideal behavioral answer using complete STAR structure.

Requirements:
- Situation: Brief context (company, team, project)
- Task: What you needed to accomplish
- Action: YOUR specific actions (multiple "I" statements) — this is the most important
- Result: Specific outcome with numbers/impact if possible
- Reflection: What you learned or would do differently

━━━ JSON OUTPUT (return ONLY this JSON) ━━━

{
  "scores": {"communication":N,"confidence":N,"technical":50,"pronunciation":N,"clarity":N,"problem_solving":N,"overall":N},
  "feedback": "Your Answer: X/100 — [STAR analysis of their behavioral response]",
  "score_breakdown": {
    "score": X,
    "what_you_did_well": ["specific STAR components present"],
    "what_was_missing": ["STAR elements that were weak or missing"],
    "how_to_make_90": "Specific improvements for their STAR structure"
  },
  "feedback_detail": {
    "executive_summary": "Analysis of their behavioral story structure",
    "strengths": ["STAR strengths in their response"],
    "weaknesses": ["STAR weaknesses or gaps"],
    "missing_concepts": ["Behavioral competencies not shown"],
    "what_interviewer_expected": "Complete STAR story with personal accountability",
    "top_3_fixes": ["STAR-specific improvements"],
    "hiring_readiness": "Not ready / Needs work / Borderline / Ready"
  },
  "follow_up_question": "Follow-up probing for more detail in their story",
  "model_answer": "Complete STAR response with Situation, Task, Action (multiple I statements), Result.",
  "expected_keywords": ["situation", "task", "action", "result", "I", "my role", "outcome", "learned"],
  "keywords_used": ["STAR elements present in their answer"],
  "keywords_missed": ["Missing STAR elements"],
  "speaking_time_seconds": ${spk},
  "ideal_speaking_time": "${idealTime}",
  "speaking_time_feedback": "Assessment of story length",
  "ideal_answer": {
    "full_answer": "A complete STAR behavioral answer with Situation, Task, multiple Action items (I did...), and quantified Result",
    "why_strong": "Why this STAR structure is effective",
    "short_answer": "Brief STAR outline",
    "common_mistakes": ["Behavioral answer pitfalls for this question type"],
    "interviewer_checklist": ["Clear Situation", "Defined Task", "Specific Actions (I statements)", "Measurable Result", "Reflection/Growth"],
    "candidate_coverage": [
      {"point": "Situation clear", "covered": BOOLEAN},
      {"point": "Task defined", "covered": BOOLEAN},
      {"point": "Actions (I did)", "covered": BOOLEAN},
      {"point": "Result shown", "covered": BOOLEAN},
      {"point": "Reflection shared", "covered": BOOLEAN}
    ]
  }
}`;
}

function buildTechnicalEvalPrompt(
  question: string, answerText: string, wc: number, spk: number,
  difficulty: string, idealTime: string, domain: string
): string {
  return `You are a senior technical interviewer with 15+ years of experience. Evaluate this TECHNICAL answer rigorously and honestly.

EXACT QUESTION ASKED: "${question}"

CANDIDATE'S ANSWER (${wc} words, ~${spk}s spoken):
"""
${answerText}
"""

DOMAIN: ${domain} | DIFFICULTY: ${difficulty} | TYPE: Technical

━━━ TECHNICAL EVALUATION RULES ━━━

Analyze the candidate's technical answer against EXACTLY what was asked.

Check each criterion:
1. Does the answer address the specific question asked (not a related topic)?
2. Are the technical facts accurate and correct?
3. Did they explain HOW it works (mechanism), not just WHAT it is (definition)?
4. Did they give a concrete, specific example (company name, numbers, actual scenario)?
5. Did they naturally use domain-specific terminology?
6. Is the answer well-structured and clear?
7. Did they mention any tradeoff, limitation, or edge case?

SCORING FOR TECHNICAL QUESTIONS:
- 0–15: No attempt, completely wrong, or major misconceptions throughout
- 16–35: Fundamental errors, wrong definition, missing core mechanism
- 36–50: Partially correct — definition only, no mechanism, no example, vague
- 51–70: Correct basics but incomplete — missing mechanism OR example OR depth
- 71–85: Good — correct definition + mechanism + example, minor gaps remain
- 86–100: Excellent — precise, complete, example with specifics, tradeoff mentioned

Component weights: technical 30%, communication 20%, confidence 15%, clarity 15%, problem_solving 15%, pronunciation 5%.

━━━ IDEAL TECHNICAL RESPONSE ━━━

Write the complete ideal technical interview answer to THIS EXACT question.

Requirements for full_answer:
- Written in first person, natural spoken English
- MUST contain: precise definition → internal mechanism step by step → specific real example → key technical terms → one tradeoff or limitation
- Length: ${difficulty === "Hard" ? "250-350 words" : difficulty === "Medium" ? "180-250 words" : "120-180 words"}

━━━ JSON OUTPUT (return ONLY this JSON) ━━━

{
  "scores": {"communication":N,"confidence":N,"technical":N,"pronunciation":N,"clarity":N,"problem_solving":N,"overall":N},
  "feedback": "Your Answer: X/100 — [one sentence referencing what they specifically said]",
  "score_breakdown": {
    "score": X,
    "what_you_did_well": ["specific correct content from their answer"],
    "what_was_missing": ["specific technical gaps for this question"],
    "how_to_make_90": "Reference their answer: 'You mentioned X. To score 90+ explain Y and give example Z'"
  },
  "feedback_detail": {
    "executive_summary": "1-2 sentences about their technical answer",
    "strengths": ["technical strengths in their answer"],
    "weaknesses": ["technical gaps with evidence"],
    "missing_concepts": ["technical concepts absent from the answer"],
    "what_interviewer_expected": "What a passing technical answer covers",
    "top_3_fixes": ["technical improvements"],
    "hiring_readiness": "Not ready / Needs work / Borderline / Ready"
  },
  "follow_up_question": "Technical follow-up based on what was missing",
  "model_answer": "Complete technical answer with definition, mechanism, example, tradeoff.",
  "expected_keywords": ["5-10 technical terms this question requires"],
  "keywords_used": ["technical terms that appeared"],
  "keywords_missed": ["technical terms missing"],
  "speaking_time_seconds": ${spk},
  "ideal_speaking_time": "${idealTime}",
  "speaking_time_feedback": "Assessment of answer length",
  "ideal_answer": {
    "full_answer": "Complete technical answer: definition → mechanism → example → tradeoff",
    "why_strong": "What makes this technical answer strong",
    "short_answer": "60-80 word summary",
    "common_mistakes": ["Technical pitfalls for this question"],
    "interviewer_checklist": ["Precise definition", "Internal mechanism", "Real-world example", "Technical terminology", "Tradeoff or limitation"],
    "candidate_coverage": [
      {"point": "Precise definition", "covered": BOOLEAN},
      {"point": "Internal mechanism", "covered": BOOLEAN},
      {"point": "Real-world example", "covered": BOOLEAN},
      {"point": "Technical terminology", "covered": BOOLEAN},
      {"point": "Tradeoff or limitation", "covered": BOOLEAN}
    ]
  }
}`;
}

interface EvalError {
  status: number;
  message: string;
}

async function evaluateWithRetry(prompt: string): Promise<{ result: Record<string, unknown> | null; lastError: EvalError | null }> {
  const temperatures = [0.25, 0.2, 0.15];
  let lastError: EvalError | null = null;

  for (const temp of temperatures) {
    const response = await callGeminiWithFallback(prompt, temp, 7000);
    if (response.error) {
      lastError = { status: response.error.status, message: response.error.message };
      console.error(`Gemini attempt at temp ${temp} failed:`, response.error.message);
      continue;
    }
    const parsed = parseJSON(response.text);
    if (parsed && parsed.scores && parsed.feedback) {
      return { result: parsed, lastError: null };
    }
    lastError = { status: 500, message: "Failed to parse valid JSON from response" };
  }
  return { result: null, lastError };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { question, answer, domain, difficulty, interview_type, voice_transcript } = body;
    const answerText = ((voice_transcript || answer) ?? "").trim();
    const safeDomain = (domain || "General").trim();
    const safeDifficulty = (difficulty || "Medium").trim();
    const safeType = (interview_type || "Technical").trim();

    if (isEmpty(answerText) || isDontKnow(answerText)) {
      return new Response(JSON.stringify(buildDontKnowResult(question ?? "", safeDomain, safeDifficulty)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildEvalPrompt(question, answerText, safeDomain, safeDifficulty, safeType);
    const { result: parsed, lastError } = await evaluateWithRetry(prompt);

    if (parsed) {
      enforceScoreIntegrity(parsed);

      if (!Array.isArray(parsed.keywords_used)) parsed.keywords_used = [];
      if (!Array.isArray(parsed.keywords_missed)) parsed.keywords_missed = [];
      if (!Array.isArray(parsed.expected_keywords)) parsed.expected_keywords = [];

      if (!parsed.score_breakdown) {
        const overall = (parsed.scores as Record<string, number>)?.overall ?? 50;
        parsed.score_breakdown = {
          score: overall,
          what_you_did_well: [],
          what_was_missing: ["Complete breakdown unavailable"],
          how_to_make_90: "Structure: define precisely → explain mechanism → give specific example → mention tradeoff.",
        };
      }

      const spk = estimateSpeakingTime(answerText);
      if (!parsed.speaking_time_seconds) parsed.speaking_time_seconds = spk;
      if (!parsed.ideal_speaking_time) parsed.ideal_speaking_time = getIdealSpeakingTime(safeDifficulty, safeType);
      if (!parsed.speaking_time_feedback) {
        parsed.speaking_time_feedback = spk < 30 ? "Very short — expand your answer." : spk < 60 ? "Could be more detailed." : "Good length.";
      }

      if (!parsed.feedback_detail) {
        parsed.feedback_detail = {
          executive_summary: `Score: ${(parsed.scores as Record<string, number>)?.overall ?? 50}/100.`,
          strengths: [],
          weaknesses: ["Detailed feedback unavailable — retry for full analysis"],
          missing_concepts: [],
          what_interviewer_expected: "Complete answer with definition, example, and depth.",
          top_3_fixes: ["Structure your answer clearly", "Add a concrete example", "Include technical terminology"],
          hiring_readiness: "Needs work",
        };
      }

      if (!parsed.ideal_answer) {
        parsed.ideal_answer = null;
      } else {
        const ia = parsed.ideal_answer as Record<string, unknown>;
        if (!Array.isArray(ia.candidate_coverage)) ia.candidate_coverage = [];
        if (!Array.isArray(ia.interviewer_checklist)) {
          ia.interviewer_checklist = ["Precise definition", "Internal mechanism", "Real-world example", "Technical terminology", "Tradeoff or limitation"];
        }
        if (!Array.isArray(ia.common_mistakes)) ia.common_mistakes = [];
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All retries failed — return error with details for debugging
    const spk = estimateSpeakingTime(answerText);
    const errorMsg = lastError?.message || "Unknown error";
    console.error(`Evaluation failed after all retries. Last error: ${errorMsg}`);

    return new Response(JSON.stringify({
      scores: { communication: 0, confidence: 0, technical: 0, pronunciation: 0, clarity: 0, problem_solving: 0, overall: 0 },
      feedback: `Evaluation failed: ${errorMsg}. Please try again.`,
      score_breakdown: {
        score: 0,
        what_you_did_well: [],
        what_was_missing: [`Evaluation error: ${errorMsg}`],
        how_to_make_90: "Please retry evaluation for personalized feedback.",
      },
      feedback_detail: {
        executive_summary: `Evaluation failed: ${errorMsg}`,
        strengths: [],
        weaknesses: [errorMsg],
        missing_concepts: [],
        what_interviewer_expected: "Evaluation could not be completed due to API error.",
        top_3_fixes: ["Retry the evaluation", "Check your network connection", "If problem persists, contact support"],
        hiring_readiness: "Evaluation pending",
      },
      follow_up_question: "",
      model_answer: "Please retry evaluation.",
      ideal_answer: null,
      keywords_used: [],
      keywords_missed: [],
      expected_keywords: [],
      speaking_time_seconds: spk,
      ideal_speaking_time: getIdealSpeakingTime(safeDifficulty, safeType),
      speaking_time_feedback: "Evaluation failed.",
      error: errorMsg,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
