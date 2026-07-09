import datetime

_memory = []

def save_interaction(question: str, answer: str, feedback: dict, timestamp: str = None):
    """
    Saves an interaction (question, answer, and feedback, plus timestamp) in memory.
    """
    if timestamp is None:
        timestamp = datetime.datetime.now().isoformat()
        
    _memory.append({
        "question": question,
        "answer": answer,
        "feedback": feedback,
        "timestamp": timestamp
    })

def get_previous_summary() -> str:
    """
    Returns a short coaching summary based on past responses.
    """
    if not _memory:
        return "No past interactions."
    
    needs_improvement = []
    short_answers = 0
    for entry in _memory:
        improvement = entry.get("feedback", {}).get("key_improvement", "")
        if improvement:
            needs_improvement.append(improvement)
            
        if len(entry.get("answer", "")) < 20:
            short_answers += 1
            
    summary_parts = []
    if short_answers > 0:
        summary_parts.append("Student usually gives short answers.")
    
    if needs_improvement:
        unique_improvements = list(set(needs_improvement))
        summary_parts.append("Needs better clarity on: " + ", ".join(unique_improvements) + ".")
        
    if not summary_parts:
        return "Good progress in structured responses."
        
    return " ".join(summary_parts)

def get_session_history() -> list:
    """
    Returns the full history of the current session.
    """
    return _memory

def clear_session_history():
    """
    Clears the session history.
    """
    global _memory
    _memory.clear()
