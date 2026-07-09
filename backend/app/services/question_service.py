import random
from app.data.question_banks import get_question_bank

_bank = get_question_bank()

# State for tracking history
_recent_ids = []
_last_topic = None
_last_style = None

def get_base_question(mode: str = "Mixed Interview", domain: str = "General") -> dict:
    """
    Returns a selected question object from the bank respecting rotation rules.
    """
    global _recent_ids, _last_topic, _last_style
    
    # 1. Filter by mode
    candidates = []
    if mode == "HR Round":
        candidates = [q for q in _bank if q["category"] == "HR"]
    elif mode == "Technical Round":
        candidates = [q for q in _bank if q["category"] == "Technical"]
        if domain != "General":
            mapped_topics = []
            d_lower = domain.lower()
            if "oop" in d_lower or "java" in d_lower or "c++" in d_lower: mapped_topics.append("OOP")
            if "dbms" in d_lower or "sql" in d_lower: mapped_topics.append("DBMS/SQL")
            if "os" in d_lower or "network" in d_lower: mapped_topics.append("OS/CN")
            if "html" in d_lower or "css" in d_lower or "javascript" in d_lower or "react" in d_lower or "mern" in d_lower: mapped_topics.append("Web")
            if "backend" in d_lower or "api" in d_lower: mapped_topics.append("Backend/APIs")
            if "cloud" in d_lower or "devops" in d_lower or "docker" in d_lower: mapped_topics.append("Cloud/DevOps")
            if "flutter" in d_lower or "dart" in d_lower: mapped_topics.append("Mobile")
            if "blockchain" in d_lower or "solidity" in d_lower: mapped_topics.append("Blockchain")
            
            domain_candidates = [q for q in candidates if q["topic"] in mapped_topics]
            if domain_candidates:
                candidates = domain_candidates
            else:
                candidates = [{
                    "id": f"dummy_{domain}",
                    "category": "Technical",
                    "topic": domain,
                    "difficulty": "medium",
                    "skill_tested": domain,
                    "question_length": "medium",
                    "style": "basic",
                    "question": f"What is your experience with {domain}, and can you explain a fundamental concept related to it?"
                }]
    elif mode == "Project Round":
        candidates = [q for q in _bank if q["category"] == "Project"]
    elif mode == "Pressure Round":
        candidates = [q for q in _bank if q["category"] == "Pressure"]
    elif mode == "Must-have Questions":
        candidates = [q for q in _bank if q["category"] == "Must-have Questions"]
    else: # Mixed Interview
        candidates = list(_bank)

    # If no candidates found for some reason, fallback to all
    if not candidates:
        candidates = list(_bank)

    # 2. Filter out last 15 questions
    unseen_candidates = [q for q in candidates if q["id"] not in _recent_ids]
    
    # If we run out of unseen questions for this mode, clear history (or just for this mode)
    if not unseen_candidates:
        unseen_candidates = candidates

    # 3. Filter out last topic
    topic_candidates = [q for q in unseen_candidates if q["topic"] != _last_topic]
    if not topic_candidates:
        topic_candidates = unseen_candidates
        
    # 4. Filter out last style
    style_candidates = [q for q in topic_candidates if q["style"] != _last_style]
    if not style_candidates:
        style_candidates = topic_candidates

    # 5. Pick randomly from the remaining
    selected = random.choice(style_candidates)
    
    # Update tracking
    _recent_ids.append(selected["id"])
    if len(_recent_ids) > 15:
        _recent_ids.pop(0)
        
    _last_topic = selected["topic"]
    _last_style = selected["style"]
    
    return dict(selected)

def get_next_question(mode: str = "Mixed Interview", domain: str = "General") -> dict:
    """
    Fallback function when Gemini fails. Just returns the base question.
    """
    return get_base_question(mode, domain)

def get_current_question() -> str:
    """
    Returns the most recently asked question.
    """
    if not _recent_ids:
        return "Tell me about yourself."
    last_id = _recent_ids[-1]
    for q in _bank:
        if q["id"] == last_id:
            return q["question"]
    return "Tell me about yourself."

