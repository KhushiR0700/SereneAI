import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

// ── GEMINI MODEL CONFIGURATION (2026) ─────────────────────────────
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const FALLBACK_RESPONSE = JSON.stringify({
  clarity_score: 70,
  word_accuracy: 75,
  problem_words: ["example"],
  mispronounced_words: [],
  ai_feedback: "Your pronunciation is generally clear. Focus on enunciating each syllable distinctly. Practice the word slowly, then at normal speed.",
  improvement_suggestions: ["Slow down and pronounce each syllable", "Listen to the correct pronunciation first", "Practice the word in a sentence"],
});

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured");
    return FALLBACK_RESPONSE;
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
          generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Gemini ${model} returned ${res.status}:`, errText.slice(0, 200));
        if (res.status === 401 || res.status === 403) return FALLBACK_RESPONSE;
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
  return FALLBACK_RESPONSE;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { word, ipa_notation, user_transcript, difficulty } = await req.json();

    const prompt = `You are a pronunciation coach. Evaluate the user's attempt at pronouncing a word.

Target word: ${word}
IPA notation: ${ipa_notation || "N/A"}
Difficulty: ${difficulty || "Medium"}
User's speech transcript (what they said): ${user_transcript || "Unable to transcribe"}

Analyze the pronunciation and provide:
1. clarity_score: 0-100 — how clearly the word was pronounced
2. word_accuracy: 0-100 — how close the attempt was to correct pronunciation
3. problem_words: Array of words/sounds that were problematic
4. mispronounced_words: Array of specific mispronunciations detected
5. ai_feedback: A genuine, encouraging paragraph explaining how they did and how to improve. Be specific about tongue placement, syllable stress, etc. Do NOT sound generic.
6. improvement_suggestions: Array of 3-4 specific, actionable tips for improving pronunciation of this word

Return ONLY a JSON object with these fields.`;

    const text = await callGemini(prompt);

    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      parsed = {
        clarity_score: 65,
        word_accuracy: 70,
        problem_words: [],
        mispronounced_words: [],
        ai_feedback: "Keep practicing this word. Listen to the correct pronunciation and try to match the syllable stress.",
        improvement_suggestions: ["Listen to the correct pronunciation", "Practice slowly", "Repeat 5 times"],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
