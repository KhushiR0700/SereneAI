from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional
import logging

from app.services.feedback_service import generate_feedback as fallback_feedback
from app.services.gemini_service import generate_dynamic_feedback, generate_voice_feedback
from app.services.memory_service import get_previous_summary, save_interaction
from app.services.question_service import get_current_question

logger = logging.getLogger(__name__)

router = APIRouter()

class FeedbackRequest(BaseModel):
    answer: str = Field(..., description="The user's given answer to process")
    question: Optional[str] = Field(None, description="The current question being answered")

class FeedbackResponse(BaseModel):
    transcript: Optional[str] = None
    strengths: str
    key_improvement: str
    suggestion: str
    improved_answer: str
    overall_score: int
    confidence_score: int
    clarity_score: int
    structure_score: int
    answer_length_score: int
    relevance_score: Optional[int] = 50
    follow_up_question: Optional[str] = None
    growth_message: str

@router.post("/feedback", response_model=FeedbackResponse, status_code=200)
def submit_feedback(request: FeedbackRequest):
    """
    Submits user's interview answer to generate dynamic Gemini feedback or fallback.
    """
    try:
        previous_summary = get_previous_summary()
        current_question = request.question or get_current_question() or "Tell me about yourself."

        try:
            result = generate_dynamic_feedback(current_question, request.answer, previous_summary)
        except Exception as e:
            logger.warning(f"Gemini feedback failed, using fallback. Error: {e}")
            result = fallback_feedback(request.answer, previous_summary)
            result["relevance_score"] = 50
            result["follow_up_question"] = "Can you elaborate more on your experience?"
            result["growth_message"] += " (AI service unavailable, showing basic feedback.)"

        save_interaction(current_question, request.answer, result)
        return result

    except Exception as e:
        logger.error(f"Failed to generate feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate feedback")

@router.post("/voice-feedback", response_model=FeedbackResponse, status_code=200)
async def submit_voice_feedback(
    audio: UploadFile = File(...),
    question: Optional[str] = Form(None)
):
    """
    Submits user's audio interview answer to generate transcript and dynamic feedback.
    """
    try:
        previous_summary = get_previous_summary()
        current_question = question or get_current_question() or "Tell me about yourself."

        audio_bytes = await audio.read()
        mime_type = audio.content_type or "audio/wav"

        try:
            result = generate_voice_feedback(current_question, audio_bytes, mime_type, previous_summary)
            transcript = result.get("transcript", "[Transcript unavailable]")
        except Exception as e:
            logger.warning(f"Gemini voice feedback failed. Error: {e}")
            raise HTTPException(status_code=500, detail="Voice processing failed. Please try typing your answer.")

        # Save interaction using the generated transcript as the answer
        save_interaction(current_question, transcript, result)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process voice feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to process voice feedback")