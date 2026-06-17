import pytest
from backend.app.core.safety.dnode import evaluate_message, DNodeResult, keyword_fallback
from backend.app.core.safety.semantic_gate import SemanticGateUnavailableError, SemanticAnalysis

# Mock analyze_message to control SemanticAnalysis output
from unittest.mock import patch

def make_analysis(distress_level=0, is_implicit=False, is_explicit=False, reasoning=""):
    return SemanticAnalysis(
        emotional_state="distressed",
        distress_level=distress_level,
        implied_intent="",
        crisis_indicators=[],
        is_implicit_crisis=is_implicit,
        is_explicit_crisis=is_explicit,
        reasoning=reasoning,
    )

@pytest.mark.parametrize(
    "msg,analysis,expected",
    [
        ("I want to hurt myself", make_analysis(distress_level=8, is_explicit=True, reasoning="explicit"), True),
        ("I just want everything to stop", make_analysis(distress_level=6, is_implicit=True, reasoning="implicit"), True),
        ("nobody would notice if I was gone", make_analysis(distress_level=5, is_implicit=True, reasoning="implicit"), True),
        ("I want to kill this exam", make_analysis(distress_level=0, reasoning="none"), False),
        ("I have a headache", make_analysis(distress_level=0, reasoning="none"), False),
    ],
)
def test_evaluate_message(msg, analysis, expected):
    with patch('backend.app.core.safety.dnode.analyze_message', return_value=analysis):
        result = evaluate_message(msg)
        assert isinstance(result, DNodeResult)
        assert result.is_crisis == expected
        if expected:
            assert result.response != ""
        else:
            assert result.response == ""

def test_fallback_on_gate_unavailable():
    # Simulate SemanticGateUnavailableError and ensure fallback triggers
    with patch('backend.app.core.safety.dnode.analyze_message', side_effect=SemanticGateUnavailableError('down')):
        result = evaluate_message('I want to kill myself')
        assert result.is_crisis
        assert "keyword 'kill myself'" in result.reasoning.lower()
