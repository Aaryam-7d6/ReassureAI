import pytest

from backend.app.core.rag.retriever import HybridRetriever, RagDocument, exact_terms


@pytest.mark.asyncio
async def test_hybrid_retriever_fuses_dense_and_keyword_results():
    retriever = HybridRetriever(
        documents=[
            RagDocument(
                id="vata",
                text="Vata dosha imbalance can involve dryness, anxiety, bloating, and irregular sleep.",
                vector=[1.0, 0.0, 0.0],
            ),
            RagDocument(
                id="pitta",
                text="Pitta imbalance often involves heat, acidity, inflammation, and irritability.",
                vector=[0.0, 1.0, 0.0],
            ),
            RagDocument(
                id="sleep",
                text="Sleep hygiene includes regular timing, dim lights, and limited caffeine.",
                vector=[0.95, 0.05, 0.0],
            ),
        ]
    )

    results = await retriever.retrieve(
        "exact vata dosha anxiety",
        query_vector=[1.0, 0.0, 0.0],
        top_k=3,
    )

    assert results[0].id == "vata"
    assert "dense" in results[0].sources
    assert "keyword" in results[0].sources
    assert any(result.id == "sleep" for result in results)


@pytest.mark.asyncio
async def test_keyword_only_search_works_without_query_vector():
    retriever = HybridRetriever(
        documents=[
            RagDocument(id="a", text="Ashwagandha is discussed in this chunk."),
            RagDocument(id="b", text="Turmeric and pitta are discussed in this chunk."),
        ]
    )

    results = await retriever.retrieve('"turmeric" pitta', top_k=2)

    assert [result.id for result in results] == ["b"]
    assert results[0].sources == ["keyword"]


def test_exact_terms_include_phrases_and_tokens():
    assert exact_terms('"vata dosha" anxiety') == ["vata dosha", "vata", "dosha", "anxiety"]
