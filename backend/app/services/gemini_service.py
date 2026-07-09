import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

# ✅ Load .env (force correct path for Windows)
load_dotenv(dotenv_path="D:/Sereneai/backend/.env")

# ✅ Debug: check if API key is loaded
print("🔥 GEMINI KEY LOADED:", os.getenv("GEMINI_API_KEY"))


def get_gemini_model():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("❌ Gemini API key not found")
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        return model
    except Exception as e:
        print("❌ Gemini config error:", e)
        return None


def clean_json_response(text: str) -> dict:
    """Safely extract JSON from Gemini response"""
    try:
        cleaned = re.sub(r'```(?:json)?\n|```', '', text).strip()
        return json.loads(cleaned)
    except Exception as e:
        print("❌ JSON parse error:", e)
        return {}


_recent_questions = []

def generate_dynamic_question(mode: str, base_question: dict = None, domain: str = "General") -> dict:
    global _recent_questions
    print("GEMINI QUESTION MODE:", mode)
    model = get_gemini_model()

    if not model:
        raise ValueError("GEMINI_API_KEY not configured")

    if base_question is None:
        base_question = {"question": "Tell me about yourself.", "category": "HR", "topic": "General", "style": "basic"}
        
    base_q_text = base_question.get("question", "")
    base_cat = base_question.get("category", "")
    base_topic = base_question.get("topic", "")
    base_style = base_question.get("style", "")
    base_diff = base_question.get("difficulty", "medium")
    base_skill = base_question.get("skill_tested", "General")
    base_len = base_question.get("question_length", "medium")

    domain_instruction = ""
    if domain != "General":
        domain_instruction = f"\nCRITICAL INSTRUCTION: The user selected the technical domain '{domain}'. You MUST ensure the enhanced question strictly stays within the domain of {domain}. Do not ask questions from unrelated domains."

    prompt = f"""You are SereneAI, a realistic interview simulator for engineering students.

Your goal is to simulate REAL interview behavior. We have selected a base question from our validated question bank. 
Your job is to ENHANCE and REPHRASE it slightly so it sounds natural, conversational, and non-repetitive, while keeping the EXACT SAME core meaning, topic, and intent.

Base Question: "{base_q_text}"
Category: {base_cat}
Topic: {base_topic}
Style: {base_style}{domain_instruction}

IMPORTANT RULES:
1. Do not completely change the question. Rephrase it to sound like a real human interviewer asking it.
2. If it's a technical question, keep it precise and direct.
3. If it's a pressure question, make it sharp but professional, not abusive.
4. If it's an HR question, make it sound like an open-ended conversation starter.
5. Keep the vocabulary student-friendly (no overly corporate or archaic words).

RETURN ONLY JSON. Do not use markdown blocks.

{{
  "id": "{base_question.get('id', 'q_123')}",
  "category": "{base_cat}",
  "topic": "{base_topic}",
  "difficulty": "{base_diff}",
  "skill_tested": "{base_skill}",
  "question_length": "{base_len}",
  "style": "{base_style}",
  "question": "Your enhanced/rephrased version of the question"
}}
"""

    try:
        response = model.generate_content(prompt)
        data = clean_json_response(response.text)
        if data and "question" in data:
            _recent_questions.append(data["question"])
            # Keep history short (although main history is tracked in question_service now)
            if len(_recent_questions) > 15:
                _recent_questions.pop(0)
        return data
    except Exception as e:
        print("❌ Gemini question error:", e)
        raise ValueError("Gemini failed")


def generate_dynamic_feedback(question: str, answer: str, previous_summary: str = "") -> dict:
    model = get_gemini_model()

    if not model:
        raise ValueError("GEMINI_API_KEY not configured")

    context = (
        f"Previous Session Context: {previous_summary}"
        if previous_summary and previous_summary != "No past interactions."
        else "No previous sessions."
    )

    prompt = f"""You are SereneAI, a realistic interview simulator.

Evaluate the student's answer.

Question: {question}
Answer: {answer}
{context}

Rules:
- Be honest and realistic (like a real interviewer).
- DO NOT overpraise weak answers.
- If answer is short or weak → give low score (0–30).
- Improved answer MUST be: concise, natural, 3–5 lines max, spoken-style (not paragraph essay).
- Avoid long robotic paragraphs.
- Give only ONE key improvement.
- Follow-up question must feel like a real interviewer probing deeper.

Tone: Supportive but realistic.

RETURN ONLY JSON:

{{
  "strengths": "...",
  "key_improvement": "...",
  "suggestion": "...",
  "improved_answer": "...",
  "overall_score": 0,
  "confidence_score": 0,
  "clarity_score": 0,
  "structure_score": 0,
  "answer_length_score": 0,
  "relevance_score": 0,
  "follow_up_question": "...",
  "growth_message": "..."
}}
"""

    try:
        response = model.generate_content(prompt)
        return clean_json_response(response.text)
    except Exception as e:
        print("❌ Gemini feedback error:", e)
        raise ValueError("Gemini failed")

def generate_voice_feedback(question: str, audio_bytes: bytes, mime_type: str, previous_summary: str = "") -> dict:
    model = get_gemini_model()

    if not model:
        raise ValueError("GEMINI_API_KEY not configured")

    context = (
        f"Previous Session Context: {previous_summary}"
        if previous_summary and previous_summary != "No past interactions."
        else "No previous sessions."
    )

    prompt = f"""You are SereneAI, a realistic interview simulator.

First, accurately transcribe the provided audio answer. 
Then, evaluate the student's answer (the transcription) to the following Question: {question}
{context}

Rules:
- Be honest and realistic (like a real interviewer).
- DO NOT overpraise weak answers.
- If answer is short or weak → give low score (0–30).
- Improved answer MUST be: concise, natural, 3–5 lines max, spoken-style.
- Avoid long robotic paragraphs.
- Give only ONE key improvement.
- Follow-up question must feel like a real interviewer probing deeper.

Tone: Supportive but realistic.

RETURN ONLY JSON:

{{
  "transcript": "...",
  "strengths": "...",
  "key_improvement": "...",
  "suggestion": "...",
  "improved_answer": "...",
  "overall_score": 0,
  "confidence_score": 0,
  "clarity_score": 0,
  "structure_score": 0,
  "answer_length_score": 0,
  "relevance_score": 0,
  "follow_up_question": "...",
  "growth_message": "..."
}}
"""

    try:
        audio_part = {
            "mime_type": mime_type,
            "data": audio_bytes
        }
        response = model.generate_content([audio_part, prompt])
        return clean_json_response(response.text)
    except Exception as e:
        print("❌ Gemini voice feedback error:", e)
        raise ValueError("Gemini failed")