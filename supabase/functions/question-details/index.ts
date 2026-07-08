import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const NON_TECHNICAL_DOMAINS = new Set(["General", "HR", "Aptitude", "Behavioral"]);

// ── GEMINI MODEL CONFIGURATION (2026) ─────────────────────────────
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

async function callGemini(prompt: string): Promise<string> {
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
          generationConfig: { temperature: 0.5, maxOutputTokens: 2200 },
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

function buildFallback(question: string, domain: string, difficulty: string, interview_type: string, topic?: string) {
  const isNonTechnical = NON_TECHNICAL_DOMAINS.has(domain);
  const topicCtx = topic ? ` (topic: ${topic})` : "";
  return {
    question,
    domain,
    difficulty,
    expected_concepts: isNonTechnical
      ? ["Core idea", "How it applies in practice", "Real-world example", "Tradeoffs or considerations"]
      : [`Core ${domain} concept`, "How it works", "Real-world use case", "Tradeoffs or edge cases"],
    key_points: [
      "Define the concept clearly",
      "Explain the mechanism or process",
      "Provide a concrete example",
      "Mention tradeoffs or when not to use it",
    ],
    model_answer: `A strong answer defines what ${question.replace('?','').toLowerCase()} means within ${domain}${topicCtx}, explains how it works at an appropriate level of detail, gives a real example from practice, and discusses any key tradeoffs. The answer should demonstrate applied knowledge, not just a definition recited from memory.`,
    alternative_answer: `An alternative approach is to answer from a practical experience angle: describe a project or scenario where you encountered this concept in ${domain}, explain how you handled it, and what you learned. This works well for ${interview_type || "behavioral"} interview types.`,
    common_mistakes: [
      "Giving a definition without explaining the mechanism",
      "Describing the concept in isolation without a real-world example",
      "Confusing related terms or similar concepts",
      "Missing edge cases or when the concept breaks down",
    ],
    follow_up_questions: [
      `How have you used this in a real ${domain} project?`,
      `What are the tradeoffs or downsides in ${domain}?`,
      `How does this compare to the alternative approach in ${domain}?`,
    ],
    tips: [
      "Define → Explain → Example is the safest structure",
      "Mention the 'why' — when and why you would use this over alternatives",
      "If you're unsure of exact details, explain the concept and acknowledge the gap",
      "Speak at a pace that sounds thoughtful, not rushed",
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { question, domain, difficulty, interview_type, topic } = await req.json();
    const safeDomain = (domain || "General").trim();
    const safeDifficulty = (difficulty || "Medium").trim();
    const safeType = (interview_type || "Technical").trim();
    const safeTopic = topic ? String(topic).trim() : undefined;
    const isNonTechnical = NON_TECHNICAL_DOMAINS.has(safeDomain);

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify(buildFallback(question, safeDomain, safeDifficulty, safeType, safeTopic)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domainLock = isNonTechnical
      ? `DOMAIN: ${safeDomain} (non-technical). Keep all content within the scope of ${safeDomain}. Do NOT demand code or technical depth.`
      : `DOMAIN: ${safeDomain} (technical). All content MUST be specific to ${safeDomain}. Do NOT mention concepts from other technical domains. The model answer, concepts, mistakes, follow-ups, and tips must all be about ${safeDomain} only.`;

    const topicLine = safeTopic ? `\nTOPIC: ${safeTopic}` : "";

    const prompt = `You are a senior interviewer preparing a professional interview study guide entry.

QUESTION: "${question}"
${domainLock}${topicLine}
DIFFICULTY: ${safeDifficulty}
INTERVIEW TYPE: ${safeType}

Generate a complete JSON response with ALL fields below. Be specific, accurate, and professional. No generic filler. Every field must be specific to ${safeDomain} and THIS question.

{
  "question": "${question}",
  "domain": "${safeDomain}",
  "difficulty": "${safeDifficulty}",
  "expected_concepts": ["array of 4-6 specific ${safeDomain} concepts the interviewer expects the candidate to demonstrate"],
  "key_points": ["array of 4-6 specific key points the answer MUST include to pass — all within ${safeDomain}"],
  "model_answer": "A complete, accurate model answer (5-8 sentences) specific to ${safeDomain}. Covers all key concepts, uses precise ${safeDomain} terminology, includes a real-world example. This is what a 90/100 answer looks like.",
  "alternative_answer": "An alternative valid approach to answering the same question (3-5 sentences) within ${safeDomain}. Could be from a different angle, framework, or perspective.",
  "common_mistakes": ["array of 4-5 specific mistakes candidates commonly make on this ${safeDomain} question"],
  "follow_up_questions": ["array of 3 sharp follow-up questions an interviewer would ask after this one — all within ${safeDomain}"],
  "tips": ["array of 4 specific practical tips for answering this question confidently within ${safeDomain}"]
}

Return ONLY valid JSON, no markdown, no code fences.`;

    const text = await callGemini(prompt);

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = buildFallback(question, safeDomain, safeDifficulty, safeType, safeTopic) as unknown as Record<string, unknown>;
    }

    // Ensure required fields
    parsed.question = question;
    parsed.domain = safeDomain;
    parsed.difficulty = safeDifficulty;

    // Ensure arrays exist
    for (const f of ["expected_concepts", "key_points", "common_mistakes", "follow_up_questions", "tips"]) {
      if (!Array.isArray(parsed[f])) {
        parsed[f] = (buildFallback(question, safeDomain, safeDifficulty, safeType, safeTopic) as unknown as Record<string, unknown>)[f];
      }
    }
    if (!parsed.model_answer) parsed.model_answer = buildFallback(question, safeDomain, safeDifficulty, safeType, safeTopic).model_answer;
    if (!parsed.alternative_answer) parsed.alternative_answer = buildFallback(question, safeDomain, safeDifficulty, safeType, safeTopic).alternative_answer;

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
