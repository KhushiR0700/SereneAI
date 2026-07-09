from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.question_service import get_next_question
from app.services.gemini_service import generate_dynamic_question
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class QuestionResponse(BaseModel):
    id: Optional[str] = None
    mode: Optional[str] = None
    category: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    skill_tested: Optional[str] = None
    question_length: Optional[str] = None
    style: Optional[str] = None
    domain: Optional[str] = None
    question: str

@router.get("/question", response_model=QuestionResponse, status_code=200)
def get_interview_question(mode: str = "Mixed Interview", domain: str = "General"):
    """
    Returns a dynamic interview question from Gemini based on a robust fallback base.
    """
    print("QUESTION MODE:", mode)
    print("TECHNICAL DOMAIN:", domain)
    # 1. Always get a high-quality base question first
    base_question = get_next_question(mode, domain)
    base_question["mode"] = mode
    base_question["domain"] = domain
    print("QUESTION TOPIC:", base_question.get("topic", "Unknown"))
    
    try:
        # 2. Ask Gemini to enhance/rephrase it
        data = generate_dynamic_question(mode, base_question, domain)
        data["mode"] = mode
        data["domain"] = domain
        # Ensure fallback properties exist if Gemini misses them
        for key in ["category", "topic", "difficulty", "skill_tested", "question_length", "style"]:
            if key not in data or not data[key]:
                data[key] = base_question.get(key)
        print("CATEGORY GENERATED:", data.get("category", "Unknown"))
        return data
    except Exception as e:
        logger.warning(f"Gemini dynamic question failed, using fallback. Error: {e}")
        # 3. Fallback to predefined list (which is now huge and categorized)
        print("CATEGORY FALLBACK:", base_question.get("category", "Unknown"))
        return base_question
