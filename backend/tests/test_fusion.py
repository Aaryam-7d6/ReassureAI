"""Tests for TASK-013: SEC2 Query Fusion + Post-safety."""

import pytest
from pydantic import ValidationError

from backend.app.core.pipeline.fusion import (
    ChainResponse,
    FusionNode,
    FusionResult,
    fuse_chain_responses,
    format_fusion_response,
)


class TestChainResponse:
    """Test ChainResponse dataclass."""

    def test_chain_response_creation(self):
        """Test basic ChainResponse creation."""
        response = ChainResponse(
            perspective="Modern medical advice",
            confidence=0.85,
            source="openbiollm",
            metadata={"tokens": 150}
        )
        assert response.perspective == "Modern medical advice"
        assert response.confidence == 0.85
        assert response.source == "openbiollm"
        assert response.metadata == {"tokens": 150}

    def test_chain_response_default_metadata(self):
        """Test ChainResponse with default metadata."""
        response = ChainResponse(
            perspective="General guidance",
            confidence=0.75,
            source="mistral"
        )
        assert response.metadata == {}


class TestFusionNode:
    """Test FusionNode class."""

    @pytest.fixture
    def fusion_node(self):
        """Create FusionNode instance."""
        return FusionNode()

    @pytest.fixture
    def chain1_response(self):
        """Create Chain 1 (Modern Medical) response."""
        return ChainResponse(
            perspective="Based on clinical guidelines, for your symptom of headache, "
                       "I recommend staying hydrated, resting in a quiet dark room, "
                       "and considering ibuprofen 400mg if no contraindications.",
            confidence=0.85,
            source="openbiollm"
        )

    @pytest.fixture
    def chain3_response(self):
        """Create Chain 3 (General Guidance) response."""
        return ChainResponse(
            perspective="It sounds like you're dealing with a headache. "
                       "Try drinking water, taking breaks from screens, "
                       "and practicing relaxation techniques.",
            confidence=0.90,
            source="mistral"
        )

    def test_fuse_without_chain2(self, fusion_node, chain1_response, chain3_response):
        """Test fusion when Chain 2 (Ayurvedic) is not provided."""
        result = fusion_node.fuse_responses(
            chain1_response=chain1_response,
            chain2_response=None,
            chain3_response=chain3_response,
            query="I have a headache"
        )

        assert result.modern_perspective == chain1_response.perspective
        assert result.ayurvedic_perspective is None
        assert result.chain2_used is False
        assert result.chain2_confidence == 0.0
        assert result.overall_confidence > 0
        assert "Safety Note" in result.disclaimer or "Cross-verify" in result.disclaimer

    def test_fuse_with_chain2_high_confidence(self, fusion_node, chain1_response, chain3_response):
        """Test fusion when Chain 2 has high confidence."""
        chain2_response = ChainResponse(
            perspective="For headache relief, consider cooling compress on forehead, "
                       "increased water intake, and herbal tea with ginger and turmeric "
                       "for anti-inflammatory benefits.",
            confidence=0.88,
            source="ayurparam"
        )

        result = fusion_node.fuse_responses(
            chain1_response=chain1_response,
            chain2_response=chain2_response,
            chain3_response=chain3_response,
            query="I have a headache"
        )

        assert result.ayurvedic_perspective is not None
        assert result.chain2_used is True
        assert result.chain2_confidence == 0.88
        assert "Modern Medical Perspective" in result.modern_perspective

    def test_fuse_with_chain2_low_confidence(self, fusion_node, chain1_response, chain3_response):
        """Test fusion when Chain 2 has low confidence (should be skipped)."""
        chain2_response = ChainResponse(
            perspective="Some Ayurvedic advice",
            confidence=0.25,  # Below 0.3 threshold
            source="ayurparam"
        )

        result = fusion_node.fuse_responses(
            chain1_response=chain1_response,
            chain2_response=chain2_response,
            chain3_response=chain3_response,
            query="I have a headache"
        )

        assert result.chain2_used is False
        assert result.ayurvedic_perspective is None

    def test_fuse_calculates_overall_confidence(self, fusion_node, chain1_response, chain3_response):
        """Test that overall confidence is calculated correctly."""
        result = fusion_node.fuse_responses(
            chain1_response=chain1_response,
            chain2_response=None,
            chain3_response=chain3_response,
            query="I have a headache"
        )

        expected = (chain1_response.confidence + chain3_response.confidence) / 2
        assert result.overall_confidence == pytest.approx(expected, rel=0.01)

    def test_fusion_confidence_capped_at_095(self, fusion_node):
        """Test that overall confidence is capped at 0.95."""
        high_conf_response = ChainResponse(
            perspective="High confidence response",
            confidence=0.99,
            source="test"
        )

        result = fusion_node.fuse_responses(
            chain1_response=high_conf_response,
            chain2_response=None,
            chain3_response=high_conf_response,
            query="test query"
        )

        assert result.overall_confidence <= 0.95


class TestContradictionDetection:
    """Test contradiction detection between perspectives."""

    @pytest.fixture
    def fusion_node(self):
        return FusionNode()

    def test_no_contradiction(self, fusion_node):
        """Test when there's no contradiction."""
        chain1 = ChainResponse(
            perspective="Take this medication as prescribed.",
            confidence=0.8,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Consider herbal alternatives like ashwagandha.",
            confidence=0.7,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Follow the recommended treatment plan.",
            confidence=0.9,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "test query")
        # No contradiction should be detected
        assert "contradiction" not in result.claimdown.lower() or result.contradiction_warning is None

    def test_detects_avoid_take_contradiction(self, fusion_node):
        """Test detection of avoid vs take contradiction."""
        chain1 = ChainResponse(
            perspective="Avoid taking this medication with food.",
            confidence=0.8,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Take with meals for better absorption.",
            confidence=0.7,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Follow instructions provided.",
            confidence=0.9,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "test query")
        # Should detect contradiction
        assert result.contradiction_warning is not None

    def test_no_contradiction_without_chain2(self, fusion_node):
        """Test that contradiction check returns None when no chain2."""
        chain1 = ChainResponse(
            perspective="Avoid taking this medication.",
            confidence=0.8,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="Take with meals.",
            confidence=0.9,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, None, chain3, "test query")
        assert result.contradiction_warning is None


class TestHerbDrugInteractionDetection:
    """Test herb-drug interaction detection."""

    @pytest.fixture
    def fusion_node(self):
        return FusionNode()

    def test_detects_aspirin_ginger_interaction(self, fusion_node):
        """Test detection of aspirin and ginger interaction."""
        chain1 = ChainResponse(
            perspective="Aspirin 81mg daily for cardiovascular protection.",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Add ginger supplements for anti-inflammatory benefits.",
            confidence=0.80,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Consider both approaches for comprehensive care.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "heart medication with ginger")
        assert result.herb_drug_interaction_flag is True

    def test_detects_warfarin_garlic_interaction(self, fusion_node):
        """Test detection of warfarin and garlic interaction."""
        chain1 = ChainResponse(
            perspective="Warfarin requires careful monitoring of INR levels.",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Garlic supplements can enhance blood thinning effects.",
            confidence=0.75,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Monitor for any unusual bleeding.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "blood thinner with garlic")
        assert result.herb_drug_interaction_flag is True

    def test_no_interaction_without_chain2(self, fusion_node):
        """Test that herb-drug check returns False when no chain2."""
        chain1 = ChainResponse(
            perspective="Aspirin 81mg daily for cardiovascular protection.",
            confidence=0.85,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="Consider lifestyle modifications.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, None, chain3, "heart medication")
        assert result.herb_drug_interaction_flag is False

    def test_no_interaction_when_no_herbs_mentioned(self, fusion_node):
        """Test no interaction flag when no herbs mentioned in chain2."""
        chain1 = ChainResponse(
            perspective="Aspirin 81mg daily for cardiovascular protection.",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Take with food to avoid stomach irritation.",
            confidence=0.80,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Monitor for any side effects.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "aspirin")
        assert result.herb_drug_interaction_flag is False


class TestPerspectiveAnalysis:
    """Test perspective analysis for common ground and differences."""

    @pytest.fixture
    def fusion_node(self):
        return FusionNode()

    def test_analyzes_common_ground(self, fusion_node):
        """Test that common ground is identified."""
        chain1 = ChainResponse(
            perspective="Modern treatment for hypertension includes ACE inhibitors.",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Ayurvedic approach for blood pressure: stress reduction and diet.",
            confidence=0.80,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Lifestyle modifications are important for blood pressure management.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, chain2, chain3, "blood pressure")
        assert "common_ground" in result.model_dump()
        assert len(result.key_differences) > 0

    def test_key_differences_without_chain2(self, fusion_node):
        """Test key differences when chain2 is not used."""
        chain1 = ChainResponse(
            perspective="Modern medical approach for your condition.",
            confidence=0.85,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="General wellness guidance for your condition.",
            confidence=0.90,
            source="mistral"
        )

        result = fusion_node.fuse_responses(chain1, None, chain3, "test query")
        assert len(result.key_differences) > 0


class TestFusionResult:
    """Test FusionResult Pydantic model."""

    def test_fusion_result_creation(self):
        """Test creating FusionResult."""
        result = FusionResult(
            modern_perspective="Modern medical advice",
            ayurvedic_perspective="Ayurvedic advice",
            common_ground="Both approaches",
            key_differences=["Difference 1", "Difference 2"],
            disclaimer="Safety disclaimer",
            overall_confidence=0.85
        )
        assert result.modern_perspective == "Modern medical advice"
        assert result.ayurvedic_perspective == "Ayurvedic advice"
        assert result.overall_confidence == 0.85

    def test_fusion_result_confidence_bounds(self):
        """Test that confidence values are bounded 0-1."""
        # Valid
        result1 = FusionResult(
            modern_perspective="test",
            common_ground="test",
            key_differences=[],
            disclaimer="test",
            overall_confidence=0.5
        )
        assert result1.overall_confidence == 0.5

        # Should cap at 1.0
        result2 = FusionResult(
            modern_perspective="test",
            common_ground="test",
            key_differences=[],
            disclaimer="test",
            overall_confidence=0.99
        )
        assert result2.overall_confidence <= 1.0


class TestFormatResponse:
    """Test response formatting."""

    @pytest.fixture
    def fusion_node(self):
        return FusionNode()

    def test_format_response_includes_all_sections(self, fusion_node):
        """Test that formatted response includes all required sections."""
        result = FusionResult(
            modern_perspective="Modern perspective content",
            ayurvedic_perspective="Ayurvedic perspective content",
            common_ground="Common ground content",
            key_differences=["Diff 1", "Diff 2"],
            disclaimer="Safety disclaimer content",
            overall_confidence=0.85
        )

        formatted = fusion_node.format_response(result)
        
        assert "## Modern Medical Perspective" in formatted
        assert "## Ayurvedic Perspective" in formatted
        assert "## Common Ground" in formatted
        assert "## Key Differences" in formatted
        assert "## Safety Disclaimer" in formatted

    def test_format_response_without_chain2(self, fusion_node):
        """Test formatting when chain2 is not used."""
        result = FusionResult(
            modern_perspective="Modern perspective content",
            ayurvedic_perspective=None,
            common_ground="Common ground content",
            key_differences=["Diff 1"],
            disclaimer="Safety disclaimer content",
            chain2_used=False,
            overall_confidence=0.85
        )

        formatted = fusion_node.format_response(result)
        
        assert "## Modern Medical Perspective" in formatted
        # Ayurvedic section should not appear
        assert "## Ayurvedic Perspective" not in formatted

    def test_format_response_includes_warnings(self, fusion_node):
        """Test that warnings are included when present."""
        result = FusionResult(
            modern_perspective="Modern perspective",
            ayurvedic_perspective=None,
            common_ground="Common ground",
            key_differences=[],
            disclaimer="Disclaimer",
            contradiction_warning="Potential contradiction detected",
            herb_drug_interaction_flag=True,
            overall_confidence=0.85
        )

        formatted = fusion_node.format_response(result)
        
        assert "## Safety Warnings" in formatted
        assert "Contradiction Warning" in formatted
        assert "Herb-Drug Interaction Warning" in formatted


class TestConvenienceFunctions:
    """Test convenience functions."""

    def test_fuse_chain_responses(self):
        """Test the convenience fuse function."""
        chain1 = ChainResponse(
            perspective="Modern advice",
            confidence=0.85,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="General advice",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, None, chain3, "test query")
        
        assert isinstance(result, FusionResult)
        assert result.modern_perspective == "Modern advice"

    def test_format_fusion_response(self):
        """Test the formatting convenience function."""
        fusion_result = FusionResult(
            modern_perspective="Modern perspective",
            ayurvedic_perspective=None,
            common_ground="Common ground",
            key_differences=[],
            disclaimer="Disclaimer",
            overall_confidence=0.85
        )

        formatted = format_fusion_response(fusion_result)
        
        assert isinstance(formatted, str)
        assert "## Modern Medical Perspective" in formatted


class TestIntegration:
    """Integration tests for full pipeline scenarios."""

    def test_full_fusion_pipeline(self):
        """Test complete fusion pipeline with all chains."""
        chain1 = ChainResponse(
            perspective="For your diabetes management, metformin 500mg twice daily is standard. "
                       "Monitor blood sugar regularly and maintain a balanced diet.",
            confidence=0.90,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Ayurvedic approach: Consider bitter gourd (karela) juice daily, "
                       "avoid sweet fruits, and practice regular pranayama for blood sugar control.",
            confidence=0.85,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Managing diabetes requires consistent monitoring, "
                       "dietary adjustments, and following your doctor's recommendations.",
            confidence=0.95,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, chain2, chain3, "diabetes management")

        # Verify all components present
        assert result.modern_perspective is not None
        assert result.ayurvedic_perspective is not None
        assert result.chain2_used is True
        assert result.overall_confidence > 0.8
        
        # Format and verify
        formatted = format_fusion_response(result)
        assert "## Modern Medical Perspective" in formatted
        assert "## Ayurvedic Perspective" in formatted
        assert "## Safety Disclaimer" in formatted

    def test_fusion_with_medication_herb_interaction(self):
        """Test fusion detects herb-drug interaction."""
        chain1 = ChainResponse(
            perspective="Patient is on metformin for type 2 diabetes.",
            confidence=0.90,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Recommend fenugreek supplements for blood sugar lowering effect.",
            confidence=0.85,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="Monitor blood sugar levels regularly.",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, chain2, chain3, "metformin with fenugreek")
        
        assert result.herb_drug_interaction_flag is True

    def test_fusion_output_schema(self):
        """Test that FusionResult matches expected output schema."""
        chain1 = ChainResponse(
            perspective="Modern advice",
            confidence=0.85,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="General advice",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, None, chain3, "test")

        # Verify all required fields are present
        assert hasattr(result, 'modern_perspective')
        assert hasattr(result, 'ayurvedic_perspective')
        assert hasattr(result, 'common_ground')
        assert hasattr(result, 'key_differences')
        assert hasattr(result, 'disclaimer')
        assert hasattr(result, 'overall_confidence')
        assert hasattr(result, 'chain2_used')
        assert hasattr(result, 'chain2_confidence')

        # Verify schema compliance
        result_dict = result.model_dump()
        assert 'modern_perspective' in result_dict
        assert 'overall_confidence' in result_dict


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_perspectives(self):
        """Test handling of empty or None perspectives."""
        chain1 = ChainResponse(
            perspective="",
            confidence=0.5,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="General guidance",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, None, chain3, "test")
        assert result.modern_perspective == ""

    def test_zero_confidence_chain2(self):
        """Test that zero confidence chain2 is not used."""
        chain1 = ChainResponse(
            perspective="Modern advice",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Ayurvedic advice",
            confidence=0.0,
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="General advice",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, chain2, chain3, "test")
        assert result.chain2_used is False

    def test_very_low_confidence_chain2(self):
        """Test that very low confidence chain2 is not used."""
        chain1 = ChainResponse(
            perspective="Modern advice",
            confidence=0.85,
            source="openbiollm"
        )
        chain2 = ChainResponse(
            perspective="Ayurvedic advice",
            confidence=0.29,  # Just below 0.3 threshold
            source="ayurparam"
        )
        chain3 = ChainResponse(
            perspective="General advice",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, chain2, chain3, "test")
        assert result.chain2_used is False

    def test_disclaimer_always_present(self):
        """Test that disclaimer is always present in output."""
        chain1 = ChainResponse(
            perspective="Modern advice",
            confidence=0.85,
            source="openbiollm"
        )
        chain3 = ChainResponse(
            perspective="General advice",
            confidence=0.90,
            source="mistral"
        )

        result = fuse_chain_responses(chain1, None, chain3, "test")
        
        # Disclaimer should always be set
        assert result.disclaimer is not None
        assert len(result.disclaimer) > 0
        assert "Cross-verify" in result.disclaimer or "professional" in result.disclaimer