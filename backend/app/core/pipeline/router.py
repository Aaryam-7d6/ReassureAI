"""Physical health router for the three-chain pipeline.

This module decides which model chains (modern, ayurvedic, or both) should be active
based on the incoming user query. It returns a :class:`RouteResult` containing the
chosen strategy, the list of active chain identifiers, and optional weighting for
each chain.

The router currently implements a very simple heuristic based on keyword
matching. In a real system this would be driven by a trained classifier or a
LLM prompt, but for the purpose of the prototype we keep it lightweight.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Dict
from pydantic import BaseModel


class Strategy(str, Enum):
    """Routing strategy identifiers.

    * ``DUAL_PARALLEL`` – run modern and ayurvedic chains in parallel.
    * ``MODERN_HEAVY`` – prioritize modern chain, ayurvedic as fallback.
    * ``AYUR_HEAVY`` – prioritize ayurvedic chain, modern as fallback.
    * ``MODERN_ONLY`` – only modern chain is active.
    * ``AYUR_ONLY`` – only ayurvedic chain is active.
    """

    DUAL_PARALLEL = "DUAL_PARALLEL"
    MODERN_HEAVY = "MODERN_HEAVY"
    AYUR_HEAVY = "AYUR_HEAVY"
    MODERN_ONLY = "MODERN_ONLY"
    AYUR_ONLY = "AYUR_ONLY"


class RouteResult(BaseModel):
    """Result of routing a physical‑health query.

    Attributes
    ----------
    strategy: Strategy
        The overall routing strategy.
    active_chains: List[str]
        Names of the chains that should be executed. Typical values are
        ``"modern"`` and ``"ayurvedic"``.
    weights: Dict[str, float] | None
        Optional per‑chain weighting (0.0‑1.0). ``None`` means equal weighting.
    """

    strategy: Strategy
    active_chains: List[str]
    weights: Dict[str, float] | None = None


# Simple keyword based router – can be extended later
_KEYWORDS_MODERN = {"exercise", "diet", "sleep", "cardio", "strength", "fitness"}
_KEYWORDS_AYUR = {"ayurveda", "dosha", "pitta", "kapha", "vata", "herb", "pranayama"}


def route_physical_query(query: str) -> RouteResult:
    """Route a user query to the appropriate health model chain.

    The function performs a case‑insensitive keyword search. The decision matrix
    is:

    * If both modern and ayurvedic keywords are present → ``DUAL_PARALLEL``.
    * If only modern keywords → ``MODERN_ONLY``.
    * If only ayurvedic keywords → ``AYUR_ONLY``.
    * If none match → ``MODERN_ONLY`` as a safe default.
    """
    lowered = query.lower()
    has_modern = any(word in lowered for word in _KEYWORDS_MODERN)
    has_ayur = any(word in lowered for word in _KEYWORDS_AYUR)

    if has_modern and has_ayur:
        return RouteResult(
            strategy=Strategy.DUAL_PARALLEL,
            active_chains=["modern", "ayurvedic"],
            weights=None,
        )
    if has_modern:
        return RouteResult(
            strategy=Strategy.MODERN_ONLY,
            active_chains=["modern"],
            weights=None,
        )
    if has_ayur:
        return RouteResult(
            strategy=Strategy.AYUR_ONLY,
            active_chains=["ayurvedic"],
            weights=None,
        )
    # Default fallback – modern chain only
    return RouteResult(
        strategy=Strategy.MODERN_ONLY,
        active_chains=["modern"],
        weights=None,
    )
