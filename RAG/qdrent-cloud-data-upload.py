"""
ReassureAI — RAG Ingestion Pipeline
=====================================
- Creates Qdrant collections if they don't already exist
- Accepts PDF URLs (downloads in memory, no manual file management)
- Also accepts local PDF files if you have them
- Chunks text, embeds with BGE-M3, uploads to Qdrant Cloud

Usage:
    pip install qdrant-client sentence-transformers pymupdf requests python-dotenv
    python ingest_to_qdrant.py

Put your QDRANT_URL and QDRANT_API_KEY in a .env file.
"""

import os
import io
import uuid
import time
import requests
import fitz  # PyMuPDF — pip install pymupdf
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

load_dotenv()

# ─────────────────────────────────────────────
# CONFIG — edit this section
# ─────────────────────────────────────────────

QDRANT_URL     = os.getenv("QDRANT_URL")      # e.g. https://xxxx.aws.cloud.qdrant.io
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")  # from Qdrant Cloud dashboard

EMBEDDING_MODEL = "BAAI/bge-m3"   # 1024-dim, multilingual, dense+sparse capable
VECTOR_DIM      = 1024
CHUNK_SIZE      = 400              # tokens approx (we use chars × 4 as proxy)
CHUNK_OVERLAP   = 50
BATCH_SIZE      = 32               # how many chunks to embed at once

# ─────────────────────────────────────────────
# COLLECTIONS
# Add or remove collections here as needed
# ─────────────────────────────────────────────

COLLECTIONS = ["ayurveda_kb", "mental_health_kb"] #kb = knowledge base

# ─────────────────────────────────────────────
# YOUR DATA SOURCES
# Add PDF URLs or local file paths here
# ─────────────────────────────────────────────

SOURCES = {
     # ─────────────────────────────────
    # AYURVEDA KNOWLEDGE BASE
    # All from Internet Archive (public domain) or NIIMH (govt free access)
    # ─────────────────────────────────
    "ayurveda_kb": [
        # --- URL examples (script downloads automatically) ---
        # {
        #     "type": "url",
        #     "url": "https://niimh.nic.in/ebooks/ecaraka/...pdf",
        #     "label": "caraka_samhita"
        # },

        # --- Local file examples (place files in ./data/ayurveda/) ---
        # {
        #     "type": "local",
        #     "path": "./data/ayurveda/caraka_samhita.pdf",
        #     "label": "caraka_samhita"
        # },
        # 1. Charaka Samhita (English) — foundational Ayurveda text
        # Source: Internet Archive — public domain
        {
            "type": "url",
            "url": "https://archive.org/download/CharakaSamhitaEnglish/CharakaSamhita_English.pdf",
            "label": "charaka_samhita_english"
        },

        # 2. Charaka Samhita Hindi Vol 1 — for Hindi language coverage
        # Source: Internet Archive — public domain
        {
            "type": "url",
            "url": "https://archive.org/download/CharakaSamhitaHindiVolume1/CharakaSamhitaHindiVolume1.pdf",
            "label": "charaka_samhita_hindi"
        },

        # 3. Ashtanga Hridayam (English) — second pillar of Ayurveda
        # Source: Internet Archive — public domain
        {
            "type": "url",
            "url": "https://archive.org/download/AstangaHrdayam.Eng/AstangaHrdayam_Eng.pdf",
            "label": "ashtanga_hridayam_english"
        },

        # 4. Sushruta Samhita — surgical + herbal Ayurveda
        # Source: Internet Archive — public domain
        {
            "type": "url",
            "url": "https://archive.org/download/SushrutaSamhita/SushrutaSamhita.pdf",
            "label": "sushruta_samhita"
        },

        # NOTE: NIIMH APTA Portal (http://ccras.res.in/ccras_ebooks/)
        # has 35 classical texts but requires login for full read mode.
        # Internet Archive copies above are the same texts, freely accessible.
        # Cite NIIMH/CCRAS as the authoritative source in your resrearch paper.

    ],

    # ─────────────────────────────────
     # ─────────────────────────────────
    # MENTAL HEALTH KNOWLEDGE BASE
    # All from WHO, NIMH — official, freely licensed, citable
    # ─────────────────────────────────

    "mental_health_kb": [
        # --- URL examples ---
        # {
        #     "type": "url",
        #     "url": "https://www.who.int/docs/default-source/mental-health/mhgap.pdf",
        #     "label": "who_mhgap"
        # },

        # --- Local file examples ---
        # {
        #     "type": "local",
        #     "path": "./data/mental_health/phq9_gad7.pdf",
        #     "label": "phq9_gad7"
        # },
        # 1. WHO mhGAP Intervention Guide — MOST IMPORTANT
        # Clinical protocols for depression, anxiety, psychosis, suicide
        # Source: UNHCR/WHO — free to use
        {
            "type": "url",
            "url": "https://www.unhcr.org/sites/default/files/legacy-pdf/5551b3fb4.pdf",
            "label": "who_mhgap_guide"
        },

        # 2. WHO Mental Health Considerations (psychosocial support)
        # Practical mental health guidance — clean, well-structured PDF
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/coronaviruse/mental-health-considerations.pdf",
            "label": "who_mental_health_considerations"
        },

        # 3. WHO Mental Health in Primary Care
        # Covers depression, anxiety, stress management in general healthcare
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/primary-health-care-conference/mental-health.pdf",
            "label": "who_mental_health_primary_care"
        },

        # 4. WHO Adolescent Mental Health Guidelines
        # Covers anxiety, depression in youth — aligns with your user demographic
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/mental-health/guidelines-on-mental-health-promotive-and-preventive-interventions-for-adolescents-hat.pdf",
            "label": "who_adolescent_mental_health"
        },

        # 5. WHO-5 Well-Being Index — the screening instrument itself
        # PHQ-9 / GAD-7 compatible, open access
        {
            "type": "url",
            "url": "https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf",
            "label": "who5_wellbeing_index"
        },

        # 6. WHO Mental Health Policy and Plans
        # Background on mental health systems — good for context retrieval
        {
            "type": "url",
            "url": "https://www.afro.who.int/sites/default/files/2017-06/MNH%20Policy%20and%20plans_essential%20package.pdf",
            "label": "who_mental_health_policy"
        },
    ],
}


# ─────────────────────────────────────────────
# STEP 1 — Connect to Qdrant Cloud
# ─────────────────────────────────────────────

def connect_qdrant():
    print("\n[1/4] Connecting to Qdrant Cloud...")
    if not QDRANT_URL or not QDRANT_API_KEY:
        raise ValueError("QDRANT_URL and QDRANT_API_KEY must be set in your .env file")
    client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    print(f"     Connected: {QDRANT_URL}")
    return client


# ─────────────────────────────────────────────
# STEP 2 — Create collections if they don't exist
# ─────────────────────────────────────────────

def ensure_collections(client):
    print("\n[2/4] Checking collections...")
    existing = [c.name for c in client.get_collections().collections]

    for name in COLLECTIONS:
        if name in existing:
            print(f"     ✓ '{name}' already exists — skipping creation")
        else:
            client.create_collection(
                collection_name=name,
                vectors_config=VectorParams(
                    size=VECTOR_DIM,
                    distance=Distance.COSINE
                )
            )
            print(f"     ✓ '{name}' created")


# ─────────────────────────────────────────────
# STEP 3 — Extract text from PDF
# Handles both URL (downloads in memory) and local file
# ─────────────────────────────────────────────

def extract_text_from_pdf_bytes(pdf_bytes):
    """Extract raw text from PDF bytes using PyMuPDF."""
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text()
    return text


def load_source(source):
    """Download or read a source and return raw text."""
    if source["type"] == "url":
        print(f"     Downloading: {source['url']}")
        response = requests.get(source["url"], timeout=60)
        response.raise_for_status()
        return extract_text_from_pdf_bytes(response.content)

    elif source["type"] == "local":
        path = source["path"]
        print(f"     Reading local file: {path}")
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {path}")
        with open(path, "rb") as f:
            return extract_text_from_pdf_bytes(f.read())

    else:
        raise ValueError(f"Unknown source type: {source['type']} — use 'url' or 'local'")


# ─────────────────────────────────────────────
# STEP 4 — Chunk text
# ─────────────────────────────────────────────

def chunk_text(text, chunk_size=CHUNK_SIZE * 4, overlap=CHUNK_OVERLAP * 4):
    """
    Simple character-based chunker with overlap.
    chunk_size=1600 chars ≈ 400 tokens
    overlap=200 chars ≈ 50 tokens
    """
    text = text.strip()
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        # Try to break at a sentence boundary to avoid mid-sentence cuts
        if end < len(text):
            last_period = chunk.rfind(".")
            if last_period > chunk_size // 2:
                end = start + last_period + 1
                chunk = text[start:end]
        chunks.append(chunk.strip())
        start = end - overlap  # move back by overlap for continuity

    # Remove empty or very short chunks (likely noise)
    chunks = [c for c in chunks if len(c) > 100]
    return chunks


# ─────────────────────────────────────────────
# STEP 5 — Embed and upload in batches
# ─────────────────────────────────────────────

def embed_and_upload(client, model, chunks, collection_name, source_label):
    """Embed chunks in batches and upload to Qdrant."""
    total = len(chunks)
    uploaded = 0

    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        embeddings = model.encode(batch, show_progress_bar=False, normalize_embeddings=True)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload={
                    "text": chunk,
                    "source": source_label,
                    "collection": collection_name,
                }
            )
            for chunk, embedding in zip(batch, embeddings)
        ]

        client.upsert(collection_name=collection_name, points=points)
        uploaded += len(batch)
        print(f"     Uploaded {uploaded}/{total} chunks", end="\r")

    print(f"     ✓ Done — {uploaded} chunks uploaded to '{collection_name}'")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print("=" * 50)
    print("  ReassureAI — Qdrant RAG Ingestion Pipeline")
    print("=" * 50)

    # Connect
    client = connect_qdrant()

    # Create collections if needed
    ensure_collections(client)

    # Load embedding model once (downloads on first run, cached after)
    print(f"\n[3/4] Loading embedding model: {EMBEDDING_MODEL}")
    print("      (First run downloads ~2GB — subsequent runs use cache)")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print("      ✓ Model ready")

    # Process each source
    print("\n[4/4] Processing and uploading documents...")

    total_sources = sum(len(v) for v in SOURCES.values())
    if total_sources == 0:
        print("\n  ⚠ No sources configured yet!")
        print("    Open ingest_to_qdrant.py and add entries to the SOURCES dict.")
        print("    See the commented examples inside SOURCES.")
        return

    for collection_name, source_list in SOURCES.items():
        if not source_list:
            print(f"\n  Skipping '{collection_name}' — no sources added yet")
            continue

        print(f"\n  Collection: {collection_name}")

        for source in source_list:
            label = source.get("label", "unknown")
            print(f"\n  Source: {label}")

            try:
                # 1. Load text
                raw_text = load_source(source)
                print(f"     Extracted {len(raw_text):,} characters")

                # 2. Chunk
                chunks = chunk_text(raw_text)
                print(f"     Split into {len(chunks)} chunks")

                # 3. Embed + upload
                embed_and_upload(client, model, chunks, collection_name, label)

            except Exception as e:
                print(f"\n  ✗ Error processing '{label}': {e}")
                continue

    print("\n" + "=" * 50)
    print("  Ingestion complete!")

    # Quick stats
    print("\n  Final collection sizes:")
    for name in COLLECTIONS:
        info = client.get_collection(name)
        print(f"    {name}: {info.points_count} vectors")

    print("=" * 50)


if __name__ == "__main__":
    start = time.time()
    main()
    elapsed = time.time() - start
    print(f"\n  Total time: {elapsed:.1f}s")