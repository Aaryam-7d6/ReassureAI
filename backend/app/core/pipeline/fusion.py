"""SEC2 Query Fusion + Post-safety module for TASK-013.

Fuses responses from Chain 1 (Modern Medical) and Chain 3 (General Guidance)
with optional Chain 2 (Ayurvedic) perspective based on chain2_confidence.
Provides contradiction checking, herb-drug interaction flagging, and mandatory disclaimer.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class FusionResult(BaseModel):
    """Result of fusing chain responses with post-safety checks."""
    modern_perspective: str
    ayurvedic_perspective: Optional[str] = None
    common_ground: str
    key_differences: List[str]
    disclaimer: str
    contradiction_warning: Optional[str] = None
    herb_drug_interaction_flag: bool = False
    chain2_used: bool = False
    chain2_confidence: float = 0.0
    overall_confidence: float = Field(ge=0.0, le=1.0)


@dataclass
class ChainResponse:
    """Standardized chain response format."""
    perspective: str
    confidence: float
    source: str
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class FusionNode:
    """Handles fusion of chain responses with safety checks."""

    def __init__(self):
        # Common medical disclaimer - always injected
        self.disclaimer = (
            "ReassureAI can make mistakes. Cross-verify important health information "
            "with a qualified healthcare professional. This information is for educational "
            "purposes only and not a substitute for professional medical advice."
        )

        # Known herb-drug interactions (simplified for prototype)
        self.herb_drug_interactions = {
            # Blood thinners
            "warfarin": ["garlic", "ginger", "ginkgo", "turmeric", "vitamin e"],
            "aspirin": ["garlic", "ginger", "ginkgo", "turmeric"],
            "clopidogrel": ["garlic", "ginger", "ginkgo"],
            
            # Diabetes medications
            "insulin": ["aloe vera", "fenugreek", "bitter melon", "gymnema"],
            "metformin": ["aloe vera", "fenugreek", "gymnema"],
            
            # Blood pressure medications
            "ace inhibitors": ["potassium supplements", "licorice"],
            "diuretics": ["licorice"],
            
            # Immunosuppressants
            "cyclosporine": ["st john's wort"],
            "tacrolimus": ["st john's wort"],
            
            # Antidepressants
            "ssri": ["st john's wort", "tryptophan"],
            "maoi": ["tyramine-rich foods", "st john's wort"],
        }

    def fuse_responses(
        self,
        chain1_response: ChainResponse,  # Modern medical/OpenBioLLM
        chain2_response: Optional[ChainResponse],  # Ayurvedic/AyurParam
        chain3_response: ChainResponse,  # General guidance/Mistral
        query: str,
    ) -> FusionResult:
        """
        Fuse responses from three chains with post-safety processing.
        
        Args:
            chain1_response: Modern medical perspective (Chain 1)
            chain2_response: Ayurvedic perspective (Chain 2) - may be None
            chain3_response: General guidance perspective (Chain 3)
            query: Original user query for context
            
        Returns:
            FusionResult with fused perspectives and safety checks
        """
        logger.info(f"Fusing responses: chain1={chain1_response.source}, "
                   f"chain2={'present' if chain2_response else 'None'}, "
                   f"chain3={chain3_response.source}")

        # Use chain2 confidence to weight Ayurvedic perspective
        chain2_used = False
        if chain2_response and chain2_response.confidence > 0.3:  # Minimum threshold
            chain2_used = True
            logger.info(f"Using Chain 2 with confidence {chain2_response.confidence}")
        else:
            logger.info("Chain 2 confidence too low or None, skipping Ayurvedic perspective")
            chain2_response = None

        # Extract perspectives
        modern_perspective = chain1_response.perspective
        ayurvedic_perspective = chain2_response.perspective if chain2_response else None
        general_perspective = chain3_response.perspective

        # Find common ground and differences
        common_ground, key_differences = self._analyze_perspectives(
            modern_perspective, ayurvedic_perspective, general_perspective
        )

        # Check for contradictions
        contradiction_warning = self._check_contradictions(
            modern_perspective, ayurvedic_perspective
        )

        # Check for herb-drug interactions
        herb_drug_interaction_flag = self._check_herb_drug_interactions(
            query, modern_perspective, ayurvedic_perspective
        )

        # Calculate overall confidence
        confidences = [chain1_response.confidence, chain3_response.confidence]
        if chain2_response:
            confidences.append(chain2_response.confidence)
        overall_confidence = sum(confidences) / len(confidences)

        return FusionResult(
            modern_perspective=modern_perspective,
            ayurvedic_perspective=ayurvedic_perspective,
            common_ground=common_ground,
            key_differences=key_differences,
            disclaimer=self.disclaimer,
            contradiction_warning=contradiction_warning,
            herb_drug_interaction_flag=herb_drug_interaction_flag,
            chain2_used=chain2_used,
            chain2_confidence=chain2_response.confidence if chain2_response else 0.0,
            overall_confidence=min(0.95, overall_confidence),  # Cap at 0.95 for safety
        )

    def _analyze_perspectives(
        self,
        modern: str,
        ayurvedic: Optional[str],
        general: str
    ) -> tuple[str, List[str]]:
        """Analyze perspectives to find common ground and key differences."""
        # Simple implementation - in production would use NLP/semantic analysis
        common_ground = (
            "Both modern and Ayurvedic approaches emphasize holistic wellness, "
            "lifestyle modifications, and addressing root causes rather than just symptoms."
        )
        
        if ayurvedic:
            key_differences = [
                "Modern medicine focuses on evidence-based pharmaceutical interventions "
                "and surgical procedures when necessary.",
                "Ayurvedic approach emphasizes herbal remedies, dietary modifications, "
                "and balancing bodily energies (doshas) through personalized regimens.",
                "Integration potential: Modern diagnostics can guide Ayurvedic preventive care."
            ]
        else:
            key_differences = [
                "Modern medical perspective provides evidence-based treatment options.",
                "General guidance offers supportive lifestyle and wellness recommendations."
            ]

        return common_ground, key_differences

    def _check_contradictions(
        self,
        modern: str,
        ayurvedic: Optional[str]
    ) -> Optional[str]:
        """Check for contradictory advice between modern and Ayurvedic perspectives."""
        if not ayurvedic:
            return None

        # Simplified contradiction detection - in production would use medical NLP
        modern_lower = modern.lower()
        ayurvedic_lower = ayurvedic.lower()

        # Check for potentially contradictory statements
        contradiction_indicators = [
            ("avoid", "take"),  # One says avoid, other says take
            ("stop", "continue"),  # One says stop, other says continue
            ("dangerous", "safe"),  # Safety assessments conflict
            ("harmful", "beneficial"),  # Benefit/risk assessments conflict
        ]

        for modern_term, ayur_term in contradiction_indicators:
            if modern_term in modern_lower and ayur_term in ayurvedic_lower:
                return (
                    f"Potential contradiction detected: Modern perspective suggests "
                    f"avoiding/{modern_term} while Ayurvedic perspective recommends "
                    f"continuing/{ayur_term}. Consult healthcare provider for personalized advice."
                )
            if ayur_term in ayurvedic_lower and modern_term in modern_lower:
                return (
                    f"Potential contradiction detected: Ayurvedic perspective suggests "
                    f"avoiding/{ayur_term} while Modern perspective recommends "
                    f"continuing/{modern_term}. Consult healthcare provider for personalized advice."
                )

        return None

    def _check_herb_drug_interactions(
        self,
        query: str,
        modern: str,
        ayurvedic: Optional[str]
    ) -> bool:
        """Check for potential herb-drug interactions."""
        if not ayurvedic:
            return False

        # Extract mentioned medications from modern perspective/query
        mentioned_meds = self._extract_medications(modern + " " + query)
        
        # Extract mentioned herbs from Ayurvedic perspective
        mentioned_herbs = self._extract_herbs(ayurvedic)

        # Check for interactions
        for med in mentioned_meds:
            med_lower = med.lower()
            for drug_category, herbs in self.herb_drug_interactions.items():
                if drug_category in med_lower or any(herb in med_lower for herb in herbs):
                    for herb in mentioned_herbs:
                        if herb.lower() in [h.lower() for h in herbs]:
                            logger.warning(f"Herb-drug interaction flagged: {herb} with {med}")
                            return True

        return False

    def _extract_medications(self, text: str) -> List[str]:
        """Extract medication names from text (simplified)."""
        # Common medication patterns - in production would use medical NER
        med_indicators = [
            "mg", "tablet", "capsule", "injection", "insulin", "metformin",
            "warfarin", "aspirin", "lisinopril", "atorvastatin", "levothyroxine"
        ]
        
        medications = []
        words = text.lower().split()
        for i, word in enumerate(words):
            if any(indicator in word for indicator in med_indicators):
                # Extract potential medication name (simplified)
                if i > 0 and len(words[i-1]) > 2:
                    medications.append(words[i-1])
                medications.append(word)
        
        return list(set(medications))  # Remove duplicates

    def _extract_herbs(self, text: str) -> List[str]:
        """Extract herb names from text (simplified)."""
        # Common Ayurvedic herbs
        herbs = [
            "ashwagandha", "turmeric", "ginger", "garlic", "tulsi", "brahmi",
            "triphala", "guggul", "shilajit", "amla", "neem", "fenugreek",
            "cinnamon", "cardamom", " fennel", "cumin", "coriander", "licorice",
            "ginkgo", "st john's wort", "aloe vera", "bitter melon", "gymnema"
        ]
        
        found_herbs = []
        text_lower = text.lower()
        for herb in herbs:
            if herb in text_lower:
                found_herbs.append(herb)
        
        return found_herbs

    def format_response(self, fusion_result: FusionResult) -> str:
        """Format the fusion result into a readable response."""
        sections = []

        # Modern Medical Perspective
        sections.append(f"## Modern Medical Perspective\n\n{fusion_result.modern_perspective}")

        # Ayurvedic Perspective (if used and available)
        if fusion_result.chain2_used and fusion_result.ayurvedic_perspective:
            sections.append(f"## Ayurvedic Perspective\n\n{fusion_result.ayurvedic_perspective}")

        # Common Ground
        sections.append(f"## Common Ground\n\n{fusion_result.common_ground}")

        # Key Differences
        if fusion_result.key_differences:
            diff_text = "\n".join([f"• {diff}" for diff in fusion_result.key_differences])
            sections.append(f"## Key Differences\n\n{diff_text}")

        # Warnings (if any)
        warnings = []
        if fusion_result.contradiction_warning:
            warnings.append(f"⚠️ **Contradiction Warning**: {fusion_result.contradiction_warning}")
        
        if fusion_result.herb_drug_interaction_flag:
            warnings.append(
                "⚠️ **Herb-Drug Interaction Warning**: Potential interaction detected between "
                "mentioned herbs and medications. Consult with healthcare provider before combining "
                "any herbal remedies with prescription medications."
            )

        if warnings:
            sections.append(f"## Safety Warnings\n\n" + "\n\n".join(warnings))

        # Mandatory Disclaimer (ALWAYS injected as per requirements)
        sections.append(f"## Safety Disclaimer\n\n{fusion_result.disclaimer}")

        return "\n\n".join(sections)


# Convenience function for easy usage
def fuse_chain_responses(
    chain1_response: ChainResponse,
    chain2_response: Optional[ChainResponse],
    chain3_response: ChainResponse,
    query: str,
) -> FusionResult:
    """
    Convenience function to fuse chain responses.
    
    Args:
        chain1_response: Modern medical perspective (Chain 1)
        chain2_response: Ayurvedic perspective (Chain 2) - may be None
        chain3_response: General guidance perspective (Chain 3)
        query: Original user query for context
        
    Returns:
        FusionResult with fused perspectives and safety checks
    """
    fusion_node = FusionNode()
    return fusion_node.fuse_responses(
        chain1_response, chain2_response, chain3_response, query
    )


def format_fusion_response(fusion_result: FusionResult) -> str:
    """
    Format fusion result into readable response.
    
    Args:
        fusion_result: Result from fuse_chain_responses
        
    Returns:
        Formatted string response
    """
    fusion_node = FusionNode()
    return fusion_node.format_response(fusion_result)


# Pydantic models for API compatibility
class ChainInput(BaseModel):
    """Input format for chain responses."""
    perspective: str
    confidence: float = Field(ge=0.0, le=1.0)
    source: str
    metadata: Optional[Dict[str, Any]] = None


class FusionOutput(BaseModel):
    """Output format for fusion results."""
    modern_perspective: str
    ayurvedic_perspective: Optional[str] = None
    common_ground: str
    key_differences: List[str] = Field(default_factory=list)
    disclaimer: str
    contradiction_warning: Optional[str] = None
    herb_drug_interaction_flag: bool = False
    chain2_used: bool = False
    chain2_confidence: float = Field(ge=0.0, le=1.0)
    overall_confidence: float = Field(ge=0.0, le=1.0)