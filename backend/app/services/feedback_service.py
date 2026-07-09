def generate_feedback(answer: str, previous_summary: str = ""):
    context_prefix = (
        f"[{previous_summary}] "
        if previous_summary and previous_summary != "No past interactions."
        else ""
    )

    # Simple rule-based logic
    ans_len = len(answer)
    answer_length_score = min(100, ans_len * 2) if ans_len >= 0 else 0
    
    confidence_score = 50
    if any(kw in answer.lower() for kw in ["hardworking", "teamwork", "confident", "lead", "achieved"]):
        confidence_score += 30
        
    structure_score = 50
    if any(kw in answer.lower() for kw in ["for example", "firstly", "in addition", "because"]):
        structure_score += 30
        
    clarity_score = 60
    if ans_len > 50:
        clarity_score += 20
        
    # Negative impacts
    if ans_len < 20:
        clarity_score -= 20
        structure_score -= 20
        confidence_score -= 20
        
    overall_score = (confidence_score + structure_score + clarity_score + answer_length_score) // 4
    
    # Growth message logic from previous history
    growth_message = "Keep practicing to build your core skills."
    if previous_summary and previous_summary != "No past interactions.":
        if "Needs better clarity" in previous_summary and clarity_score >= 70:
            growth_message = "Great job improving your clarity from last time!"
        elif "gives short answers" in previous_summary and ans_len >= 20:
            growth_message = "Good improvement in your answer length compared to previous attempts."
        else:
            growth_message = "Steady progress, keep focusing on your key areas of improvement."

    # Standardize dictionary baseline
    feedback_dict = {
        "overall_score": max(0, min(100, overall_score)),
        "confidence_score": max(0, min(100, confidence_score)),
        "clarity_score": max(0, min(100, clarity_score)),
        "structure_score": max(0, min(100, structure_score)),
        "answer_length_score": max(0, min(100, answer_length_score)),
        "growth_message": growth_message
    }

    if ans_len < 20:
        feedback_dict.update({
            "strengths": "You attempted the answer.",
            "key_improvement": "Your answer is too short.",
            "suggestion": f"{context_prefix}Try to explain more with examples.",
            "improved_answer": "I am a dedicated individual who focuses on improving my skills through consistent effort."
        })

    elif "hardworking" in answer.lower():
        feedback_dict.update({
            "strengths": "You highlighted a strong personal trait.",
            "key_improvement": "Lacks real-life example.",
            "suggestion": f"{context_prefix}Add a situation where you showed this trait.",
            "improved_answer": "I am a hardworking student. For example, I consistently complete my projects before deadlines and revise topics regularly."
        })

    else:
        feedback_dict.update({
            "strengths": "Your answer is clear.",
            "key_improvement": "Needs better structure.",
            "suggestion": f"{context_prefix}Organize your thoughts in a more structured way.",
            "improved_answer": "I approach tasks with clarity and ensure I structure my responses to communicate effectively."
        })

    return feedback_dict