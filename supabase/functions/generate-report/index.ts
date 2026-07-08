import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const NON_TECHNICAL_DOMAINS = new Set(["General", "HR", "Aptitude", "Behavioral"]);

// ── GEMINI MODEL CONFIGURATION (2026) ─────────────────────────────
const GEMINI_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt: string, maxTokens = 4000): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured");
    return "";
  }

  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      console.log(`Trying Gemini model: ${model}`);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: maxTokens },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Gemini ${model} returned ${res.status}:`, errText.slice(0, 200));
        if (res.status === 401 || res.status === 403) return "";
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) {
        if (data?.candidates?.[0]?.finishReason === "SAFETY") continue;
        continue;
      }
      console.log(`Gemini ${model} succeeded`);
      return text;
    } catch (err) {
      console.error(`Gemini ${model} fetch error:`, err);
      continue;
    }
  }
  return "";
}

function computeReadinessLevel(score: number): string {
  if (score >= 88) return "Excellent Candidate";
  if (score >= 75) return "Strong Candidate";
  if (score >= 60) return "Interview Ready";
  if (score >= 45) return "Developing";
  if (score >= 30) return "Needs Significant Work";
  return "Not Ready";
}

function computeInterviewLevel(score: number, difficulty: string): string {
  if (difficulty === "Hard") {
    if (score >= 80) return "Senior / Lead level";
    if (score >= 60) return "Mid-level";
    return "Junior / Entry level";
  }
  if (difficulty === "Medium") {
    if (score >= 80) return "Mid to Senior level";
    if (score >= 60) return "Entry to Mid level";
    return "Below entry level — needs more preparation";
  }
  if (score >= 80) return "Comfortably entry level";
  if (score >= 60) return "Basic entry level";
  return "Below entry level — fundamentals need work";
}

function buildFallbackReport(avg: Record<string, number>, answers: Record<string, unknown>[], domain: string, difficulty: string, interview_type: string) {
  const readiness = computeReadinessLevel(avg.overall);
  const level = computeInterviewLevel(avg.overall, difficulty);
  const isNonTechnical = NON_TECHNICAL_DOMAINS.has(domain);

  const questionAnalyses = answers.map((a: Record<string, unknown>, i: number) => {
    const scores = a.scores as Record<string, number> | undefined;
    return {
      question: a.question as string,
      answer_summary: ((a.answer as string) || "").substring(0, 200),
      expected_summary: `A complete answer would cover the core ${domain} concept, its mechanism, and a practical example.`,
      model_answer: (a.model_answer as string) || `A strong model answer defines the ${domain} concept, explains how it works, and gives a real-world example.`,
      strengths: scores && scores.overall >= 70 ? ["Shows some domain knowledge"] : [],
      weaknesses: scores && scores.overall < 60 ? ["Answer lacked depth and specific examples"] : ["Minor gaps in completeness"],
      missing_concepts: [`Core ${domain} concepts relevant to this question`],
      keywords_used: Array.isArray(a.keywords_used) ? a.keywords_used as string[] : [],
      keywords_missed: Array.isArray(a.keywords_missed) ? a.keywords_missed as string[] : [],
      score: scores?.overall || 50,
      domain: a.domain as string || domain,
      difficulty: a.difficulty as string || difficulty,
      speaking_time_seconds: a.speaking_time_seconds as number | undefined,
      ideal_speaking_time: a.ideal_speaking_time as string | undefined,
    };
  });

  return {
    overall_summary: `The session covered ${answers.length} question(s) in ${domain} at ${difficulty} difficulty (${interview_type} type). The candidate's overall performance reflects a score of ${avg.overall}/100, placing them at the "${readiness}" level. Focused preparation in the identified weak areas is recommended before applying for roles requiring ${domain} expertise.`,
    strengths: avg.technical >= 60 ? [`Shows foundational ${domain} knowledge`, "Attempts all questions"] : ["Willingness to engage with questions"],
    weaknesses: [`Answers lack sufficient ${isNonTechnical ? "" : "technical "}depth in ${domain}`, "Missing specific examples and concrete demonstrations", "Needs more structured responses"],
    communication_analysis: avg.communication >= 70
      ? "Communication is generally clear and follows a logical flow."
      : "Communication lacks structure. Responses appear unorganized and are difficult to follow. Practice framing answers with a clear opening statement, explanation, and example.",
    technical_analysis: isNonTechnical
      ? (avg.technical >= 70 ? `Understanding of ${domain} is solid. Some responses could go deeper.` : `Depth in ${domain} is insufficient for this level. Core ideas are either missing or imprecisely described.`)
      : (avg.technical >= 70 ? `Technical knowledge in ${domain} is solid. Some concepts could be explained with more depth.` : `Technical depth in ${domain} is insufficient for this level. Core concepts are either missing or imprecisely described. Revisit ${domain} fundamentals before attempting interviews.`),
    confidence_analysis: avg.confidence >= 65
      ? "The candidate presents with reasonable confidence."
      : "Confidence is noticeably low. Answers are heavily hedged and tentative. Practice mock interviews to build delivery confidence.",
    pronunciation_analysis: avg.pronunciation >= 65
      ? "Verbal clarity is acceptable."
      : "Verbal delivery needs work. Technical terms should be practiced until they can be stated clearly and confidently.",
    grammar_analysis: "Grammar is functional but could be more precise. Avoid run-on sentences when explaining concepts.",
    vocabulary_analysis: avg.technical >= 65
      ? `${domain}-specific vocabulary is present but could be more precise.`
      : `${domain}-specific vocabulary is weak. The candidate uses generic language where domain-specific terms are expected.`,
    problem_solving_analysis: avg.problem_solving >= 65
      ? "Some analytical thinking is evident."
      : "Problem-solving approach is unclear. Answers do not demonstrate systematic breakdown of problems.",
    professionalism_analysis: "Engagement level is acceptable. Working on delivery confidence and answer completeness will significantly improve overall impression.",
    areas_for_improvement: [
      `Provide concrete examples from ${domain} projects or experience in every answer`,
      "Use structured formats (define → explain → example → real-world use)",
      `Deepen knowledge of core ${domain} concepts`,
      "Practice articulating concepts without reading from memory",
      "Work on eliminating filler phrases and hedging language",
    ],
    action_plan: [
      { action: `Daily ${domain} review`, detail: `Spend 45 minutes reviewing core ${domain} concepts. Focus on depth, not breadth.` },
      { action: "Mock interview practice", detail: "Record yourself answering 5 questions per day. Review for structure and clarity." },
      { action: "Build an answer bank", detail: `Write out complete answers to 20 common ${domain} interview questions. Practice delivering them.` },
      { action: "Study practical examples", detail: `For every ${domain} concept, find a real-world application or project where it is used.` },
    ],
    readiness_level: readiness,
    recruiter_impression_score: Math.max(avg.overall - 5, 10),
    next_three_fixes: [
      { title: "Structure every answer: define → explain → example", detail: "Interviewers expect a clear definition first, followed by how it works, then a concrete example. Answers without examples are incomplete by default.", impact: "High" },
      { title: "Eliminate 'I think' and 'maybe' from answers", detail: "Hedging signals lack of preparation. State facts confidently or say you'll reason through it — don't speculate without signaling that you're speculating.", impact: "High" },
      { title: `Deepen knowledge of ${domain} core concepts`, detail: "Review the foundational concepts that appeared in this session. For each weak area identified, read the official documentation and build a sample project around it.", impact: "Medium" },
    ],
    question_analyses: questionAnalyses,
    top_5_improvement_areas: [
      `${domain} fundamentals`,
      "Answer structure and organization",
      "Use of specific examples and real-world context",
      "Confidence and delivery without hedging",
      "Vocabulary precision and domain-specific terminology",
    ],
    hiring_recommendation: avg.overall >= 75
      ? `Proceed to next round. The candidate demonstrates solid ${domain} knowledge with manageable gaps. Recommended for ${level} roles.`
      : avg.overall >= 55
      ? `Borderline. Consider for junior ${domain} positions or re-interview after 4-6 weeks of focused preparation on the identified weak areas.`
      : `Do not proceed. Insufficient ${domain} depth for this role. Recommend a structured preparation plan of 6-8 weeks minimum before re-evaluation.`,
    estimated_interview_level: level,
    suggested_practice_plan: [
      `Week 1-2: Review all foundational ${domain} concepts. Write summaries for each.`,
      `Week 3-4: Solve 30 ${domain}-specific interview questions. Write answers, then practice delivering them.`,
      "Week 5-6: 3 mock interviews per week. Record and review each session.",
      "Week 7-8: Target company-specific preparation. Revisit weak areas from this report.",
    ],
    final_interviewer_remarks: avg.overall >= 75
      ? `This candidate demonstrates a reasonable grasp of ${domain}. With targeted work on the identified weak areas, they are a viable candidate for ${level} positions.`
      : `This candidate needs significant preparation before being interview-ready for ${domain} roles. The gaps identified are addressable with focused study, but the current level does not meet the bar for the roles evaluated.`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { session_data, answers, domain, difficulty, interview_type } = await req.json();
    const safeDomain = (domain || "General").trim();
    const safeDifficulty = (difficulty || "Medium").trim();
    const safeType = (interview_type || "Technical").trim();
    const isNonTechnical = NON_TECHNICAL_DOMAINS.has(safeDomain);

    const avgScores = answers.reduce((acc: Record<string, number>, a: Record<string, unknown>) => {
      const s = a.scores as Record<string, number>;
      if (s) {
        for (const key of ["communication", "confidence", "technical", "pronunciation", "clarity", "problem_solving", "overall"]) {
          acc[key] = (acc[key] || 0) + (s[key] || 0);
        }
      }
      return acc;
    }, {});
    const count = answers.length || 1;
    const avg: Record<string, number> = {};
    for (const key in avgScores) avg[key] = Math.round(avgScores[key] / count);

    const readinessLevel = computeReadinessLevel(avg.overall || 0);
    const interviewLevel = computeInterviewLevel(avg.overall || 0, safeDifficulty);

    const answerDetails = answers.map((a: Record<string, unknown>, i: number) => {
      const scores = a.scores as Record<string, number> | undefined;
      const kwUsed = Array.isArray(a.keywords_used) ? (a.keywords_used as string[]).join(", ") : "";
      const kwMissed = Array.isArray(a.keywords_missed) ? (a.keywords_missed as string[]).join(", ") : "";
      const spk = a.speaking_time_seconds ? `${a.speaking_time_seconds}s` : "N/A";
      const modelAns = a.model_answer ? "Yes" : "No";
      return `--- Question ${i + 1} ---
Question: ${a.question}
Domain: ${a.domain || safeDomain}
Difficulty: ${a.difficulty || safeDifficulty}
Candidate Answer (first 400 chars): ${((a.answer as string) || "").substring(0, 400)}
Model Answer Available: ${modelAns}
Scores: Technical=${scores?.technical ?? "N/A"}, Communication=${scores?.communication ?? "N/A"}, Confidence=${scores?.confidence ?? "N/A"}, Clarity=${scores?.clarity ?? "N/A"}, Problem Solving=${scores?.problem_solving ?? "N/A"}, Overall=${scores?.overall ?? "N/A"}
Keywords Used: ${kwUsed || "None identified"}
Keywords Missed: ${kwMissed || "None identified"}
Speaking Time: ${spk}`;
    }).join("\n\n");

    const domainLock = isNonTechnical
      ? `DOMAIN: ${safeDomain} (non-technical). All analysis must stay within the scope of ${safeDomain}. Do NOT demand technical depth or code.`
      : `DOMAIN: ${safeDomain} (technical). All analysis, model answers, keywords, and recommendations MUST be specific to ${safeDomain}. Do NOT mention concepts from other technical domains. Never reference HR or unrelated topics while evaluating ${safeDomain}.`;

    const prompt = `You are a senior interview assessor at a top-tier company. You write interview assessment reports used by hiring managers to make decisions. Your reports are professional, honest, specific, and never contain generic filler.

${domainLock}

SESSION DATA:
- Domain: ${safeDomain}
- Difficulty: ${safeDifficulty}
- Interview Type: ${safeType}
- Questions Answered: ${answers.length}
- Session Overall Score: ${session_data?.overall_score ?? avg.overall}
- Average Scores: Communication=${avg.communication}, Confidence=${avg.confidence}, Technical=${avg.technical}, Pronunciation=${avg.pronunciation}, Clarity=${avg.clarity}, Problem Solving=${avg.problem_solving}, Overall=${avg.overall}
- Computed Readiness Level: ${readinessLevel}
- Estimated Interview Level: ${interviewLevel}

DETAILED ANSWER RECORDS:
${answerDetails}

REPORT REQUIREMENTS:
- Write like a senior assessor, not a motivational coach.
- Every statement must be specific to THIS session and THESE answers.
- No generic phrases like "keep up the good work" or "you have great potential."
- Weaknesses must be named specifically.
- Hiring recommendation must be direct.
- All model answers, keywords, and recommendations must be specific to ${safeDomain}.

Generate a complete JSON report with ALL of these fields:

1. overall_summary (string): 3-4 sentence professional verdict on this session. Include the domain, score, and what it means for job readiness.

2. strengths (array of strings): 3-5 specific strengths demonstrated. Only list things actually evidenced in the answers. Empty array if none.

3. weaknesses (array of strings): 3-5 specific weaknesses. Name the exact deficiencies.

4. communication_analysis (string): 2-3 sentences on structure, clarity, and delivery of answers.

5. technical_analysis (string): 2-3 sentences on ${safeDomain} knowledge, accuracy, and depth.

6. confidence_analysis (string): 2-3 sentences on how confident the answers sounded.

7. pronunciation_analysis (string): 2 sentences on verbal delivery and clarity.

8. grammar_analysis (string): 2 sentences on grammar quality across answers.

9. vocabulary_analysis (string): 2 sentences on ${safeDomain}-specific vocabulary usage.

10. problem_solving_analysis (string): 2-3 sentences on analytical reasoning and methodology.

11. professionalism_analysis (string): 2 sentences on professionalism and interview conduct.

12. areas_for_improvement (array of strings): 5 specific improvement areas within ${safeDomain}.

13. action_plan (array of {action, detail}): 4 concrete weekly actions specific to ${safeDomain}.

14. readiness_level (string): Use exactly "${readinessLevel}".

15. recruiter_impression_score (number 0-100): What a recruiter would score this candidate based on overall impression.

16. next_three_fixes (array of 3 {title, detail, impact}): Top 3 priorities. impact must be "High", "Medium", or "Low".

17. question_analyses (array): One entry per question. Each entry MUST include:
{
  question: "the question text",
  answer_summary: "1-2 sentence summary of what the candidate said",
  expected_summary: "1-2 sentence summary of what a good ${safeDomain} answer covers",
  model_answer: "a complete ${safeDomain} model answer for this question (3-6 sentences)",
  strengths: ["specific strength in this answer"],
  weaknesses: ["specific gap in this answer"],
  missing_concepts: ["specific ${safeDomain} concepts missing"],
  keywords_used: ["${safeDomain} keywords the candidate used"],
  keywords_missed: ["${safeDomain} keywords the candidate missed"],
  score: (use the overall score from the scores object),
  domain: "${safeDomain}",
  difficulty: "${safeDifficulty}",
  speaking_time_seconds: (from answer data if available),
  ideal_speaking_time: (from answer data if available)
}

18. top_5_improvement_areas (array of 5 strings): Most critical ${safeDomain} skills to develop.

19. hiring_recommendation (string): Direct hire/no-hire recommendation with specific reasoning tied to ${safeDomain}. One paragraph.

20. estimated_interview_level (string): Use exactly "${interviewLevel}".

21. suggested_practice_plan (array of 4 strings): Week-by-week ${safeDomain} practice plan.

22. final_interviewer_remarks (string): 2-3 sentences of closing assessment. Direct and professional, specific to ${safeDomain}.

Return ONLY a valid JSON object. No markdown, no code fences, no explanation.`;

    const text = await callGemini(prompt, 4000);

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = buildFallbackReport(avg, answers, safeDomain, safeDifficulty, safeType) as unknown as Record<string, unknown>;
    }

    // Ensure required fields exist
    if (!parsed.readiness_level) parsed.readiness_level = readinessLevel;
    if (!parsed.estimated_interview_level) parsed.estimated_interview_level = interviewLevel;
    if (!parsed.recruiter_impression_score) parsed.recruiter_impression_score = Math.max((avg.overall || 50) - 5, 10);

    // Ensure question_analyses has model_answer and keywords for each entry
    if (Array.isArray(parsed.question_analyses)) {
      parsed.question_analyses = (parsed.question_analyses as Record<string, unknown>[]).map((qa, i) => {
        const original = answers[i] as Record<string, unknown> | undefined;
        return {
          question: qa.question || (original?.question as string) || "",
          answer_summary: qa.answer_summary || ((original?.answer as string) || "").substring(0, 200),
          expected_summary: qa.expected_summary || `A complete ${safeDomain} answer would cover the core concept, its mechanism, and a practical example.`,
          model_answer: qa.model_answer || (original?.model_answer as string) || `A strong ${safeDomain} model answer defines the concept, explains how it works, and gives a real-world example.`,
          strengths: Array.isArray(qa.strengths) ? qa.strengths : [],
          weaknesses: Array.isArray(qa.weaknesses) ? qa.weaknesses : [],
          missing_concepts: Array.isArray(qa.missing_concepts) ? qa.missing_concepts : [],
          keywords_used: Array.isArray(qa.keywords_used) ? qa.keywords_used : (Array.isArray(original?.keywords_used) ? original?.keywords_used : []),
          keywords_missed: Array.isArray(qa.keywords_missed) ? qa.keywords_missed : (Array.isArray(original?.keywords_missed) ? original?.keywords_missed : []),
          score: qa.score || (original?.scores as Record<string, number>)?.overall || 50,
          domain: qa.domain || safeDomain,
          difficulty: qa.difficulty || safeDifficulty,
          speaking_time_seconds: qa.speaking_time_seconds ?? original?.speaking_time_seconds,
          ideal_speaking_time: qa.ideal_speaking_time ?? original?.ideal_speaking_time,
        };
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
