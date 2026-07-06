from .semantic_gate import SemanticAnalysis, SemanticGateUnavailableError, analyze_message
import json
from pathlib import Path
from typing import Dict

class DNodeResult:
    def __init__(self, is_crisis: bool, level: int, reasoning: str, response: str):
        self.is_crisis = is_crisis
        self.level = level
        self.reasoning = reasoning
        self.response = response

# Fallback crisis lexicon
LEXICON_PATH = Path(__file__).with_name("crisis_lexicon.json")

with LEXICON_PATH.open("r") as f:
    CRISIS_LEXICON = json.load(f)

def keyword_fallback(query: str) -> DNodeResult:
    lowered = query.lower()
    for risk, terms in CRISIS_LEXICON.items():
        if not isinstance(terms, list):
            continue
        for term in terms:
            if term in lowered:
                # assign level based on risk tier
                level = 9 if risk == "high_risk" else 7 if risk == "medium_risk" else 5
                reasoning = f"Detected keyword '{term}' in {risk} list"
                response = (
                    "We are deeply concerned about your safety. "
                    "Please consider reaching out to immediate help lines: iCall (tel: 9152988222) "
                    "or Vandrevala Foundation (tel: 8421837141)."
                )
                return DNodeResult(True, level, reasoning, response)
    # No crisis detected
    return DNodeResult(False, 0, "No crisis indicators found.", "")

def evaluate_message(query: str) -> DNodeResult:
    """Run semantic gate then DNode logic.
    Crisis if distress_level >=7 or implicit/explicit crisis flags.
    On SemanticGateUnavailableError fallback to keyword check.
    """
    try:
        analysis: SemanticAnalysis = analyze_message(query)
    except SemanticGateUnavailableError:
        return keyword_fallback(query)

    is_crisis = (
        analysis.distress_level >= 7
        or analysis.is_implicit_crisis
        or analysis.is_explicit_crisis
    )
    level = analysis.distress_level if is_crisis else 0
    response = ""
    if is_crisis:
        response = (
            "We understand you're in distress. "
            "Please consider contacting immediate help lines: iCall (tel: 9152988222) "
            "or Vandrevala Foundation (tel: 8421837141)."
        )
    return DNodeResult(is_crisis, level, analysis.reasoning, response)
