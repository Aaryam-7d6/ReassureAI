"""
ReassureAI - Qdrant Cloud Data Upload Ingestion Pipeline

This production script is the automated, terminal-ready equivalent of the 
interactive sandbox notebook (`qdrent_cloud_data_upload.ipynb`). It processes, 
chunks, extracts text (with OCR fallback), embeds, and uploads clinical 
knowledge documents directly into Qdrant Cloud collections.

Prerequisites:
    Create a local `.env` file in your root folder containing:
    QDRANT_URL=https://your-qdrant-cluster-url.aws.cloud.qdrant.io
    QDRANT_API_KEY=your-secure-api-key-here

Usage:
    python scripts/qdrent_cloud_data_upload.py
"""

import os
import io
import uuid
import time
import requests
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import fitz  # PyMuPDF — pip install pymupdf
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

import pytesseract
from PIL import Image, ImageOps
import numpy as np
import nltk

# Configure logging to write both to a file and output to the terminal console
LOG_FILE = 'ingestion.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

# Load variables out of the local .env file
load_dotenv()

# ─────────────────────────────────────────────
# CONFIGURATION ENVIRONMENT RULES
# ─────────────────────────────────────────────
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not QDRANT_URL or not QDRANT_API_KEY:
    raise ValueError(
        "CRITICAL ERROR: Missing QDRANT_URL or QDRANT_API_KEY environment variables.\n"
        "Please ensure a local '.env' file exists in your project directory."
    )

EMBEDDING_MODEL = "BAAI/bge-m3"   # 1024-dim, multilingual, dense+sparse capable
VECTOR_DIM = 1024
CHUNK_SIZE = 400                 # Character length proxy rules
CHUNK_OVERLAP = 50
BATCH_SIZE = 32                  

COLLECTIONS = ["ayurveda_kb", "mental_health_kb"]

# File path tracking where the pipeline caches processed document steps
RESUME_TRACKING_FILE = "./processed_sources.txt"

# Ensure NLTK tokenizer models are quietly cached locally
try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    logging.info("Downloading missing NLTK tokenizer data...")
    nltk.download('punkt_tab', quiet=True)

# ─────────────────────────────────────────────
# DATA SOURCES REGISTRY
# ─────────────────────────────────────────────
SOURCES = {
    "ayurveda_kb": [
        {
            "type": "url",
            "url": "https://archive.org/download/CharakaSamhitaEnglish/CharakaSamhita_English.pdf",
            "label": "charaka_samhita_english"
        },
        {
            "type": "url",
            "url": "https://dn790008.ca.archive.org/0/items/CharakaSamhitaHindiVolume1/CharakSamhitaAtridevajiGupt.pdf",
            "label": "charaka_samhita_hindi"
        },
        {
            "type": "url",
            "url": "https://dn790003.ca.archive.org/0/items/AstangaHrdayam.Eng/Astanga-hrdayam.%20Eng.pdf",
            "label": "ashtanga_hridayam_english"
        },
        {
            "type": "url",
            "url": "https://archive.org/download/SushrutaSamhita/SushrutaSamhita.pdf",
            "label": "sushruta_samhita"
        },
        {
            "type": "url",
            "url": "https://ccras.nic.in/wp-content/uploads/2024/06/Ayurvedic-Home-Remedies-hindi.pdf",
            "label": "ayurvedic_home_remedies_hindi"
        },
        {
            "type": "url",
            "url": "https://www.rkamc.org.in/images/Charaka-Samhita-Acharya-Charaka.pdf",
            "label": "charaka_samhita_acharya_charaka"
        },
        {
            "type": "url",
            "url": "https://ccras.nic.in/wp-content/uploads/2024/06/Ayurvedic-Home-Remedies-English.pdf",
            "label": "ayurvedic_home_remedies_english"
        },
        {
            "type": "url",
            "url": "https://ccras.nic.in/wp-content/uploads/2024/06/Evidence_based_Ayurvedic_Practice.pdf",
            "label": "evidence_based_ayurvedic_practices"
        },
        {
            "type": "url",
            "url": "https://www.ebharatisampat.in/pdfs/ebharatisampat-pdf-168725510527007-susrutasamhita-1932Online254.pdf",
            "label": "sushruta_samhita_hindi"
        },
        {
            "type": "url",
            "url": "https://rarebooksocietyofindia.org/book_archive/Sushruta%20Samhita%201.pdf",
            "label": "sushruta_samhita_english"
        },
        {
            "type": "url",
            "url": "https://dn721202.ca.archive.org/0/items/HindiBookAstangaHrdayam/Hindi%20Book-Astanga-hrdayam.pdf",
            "label": "ashtanga_hridayam_hindi"
        }
    ],
    "mental_health_kb": [
        {
            "type": "url",
            "url": "https://www.unhcr.org/sites/default/files/legacy-pdf/5551b3fb4.pdf",
            "label": "who_mhgap_guide"
        },
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/coronaviruse/mental-health-considerations.pdf",
            "label": "who_mental_health_considerations"
        },
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/primary-health-care-conference/mental-health.pdf",
            "label": "who_mental_health_primary_care"
        },
        {
            "type": "url",
            "url": "https://www.who.int/docs/default-source/mental-health/guidelines-on-mental-health-promotive-and-preventive-interventions-for-adolescents-hat.pdf",
            "label": "who_adolescent_mental_health"
        },
        {
            "type": "url",
            "url": "https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf",
            "label": "who5_wellbeing_index"
        },
        {
            "type": "url",
            "url": "https://www.afro.who.int/sites/default/files/2017-06/MNH%20Policy%20and%20plans_essential%20package.pdf",
            "label": "who_mental_health_policy"
        },
        {
            "type": "url",
            "url": "https://apps.who.int/iris/bitstream/handle/10665/254610/WHO-MSD-MER-17.2-eng.pdf",
            "label": "who_depression_report"
        }
    ]
}

# ─────────────────────────────────────────────
# PIPELINE COMPONENT FUNCTIONS
# ─────────────────────────────────────────────

def get_session_with_retries():
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    session.mount('http://', HTTPAdapter(max_retries=retries))
    return session

def init_qdrant(client):
    for collection_name in COLLECTIONS:
        if not client.collection_exists(collection_name=collection_name):
            logging.info(f"Creating remote vector collection: {collection_name}")
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE)
            )
        else:
            logging.info(f"Collection verified: {collection_name}")

def load_processed_history():
    if not os.path.exists(RESUME_TRACKING_FILE):
        return set()
    with open(RESUME_TRACKING_FILE, "r") as f:
        return set(line.strip() for line in f if line.strip())

def save_processed_history(label):
    with open(RESUME_TRACKING_FILE, "a") as f:
        f.write(f"{label}\n")

def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    sentences = nltk.sent_tokenize(text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= chunk_size:
            current_chunk += " " + sentence
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            # Maintain backward overlap context window
            current_chunk = current_chunk[-overlap:] if len(current_chunk) > overlap else ""
            current_chunk += " " + sentence
            
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return chunks

def extract_pdf_content(pdf_bytes, label):
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text_list = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text()
        
        # If standard digital extraction fails, fallback immediately to Tesseract OCR
        if not text.strip():
            pix = page.get_pixmap()
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            text = pytesseract.image_to_string(img)
            logging.info(f"[{label}] Page {page_num+1}: Digits empty. Extracted using Tesseract OCR fallback.")
            
        full_text_list.append(text)
        
    return "\n".join(full_text_list)

def upload_to_qdrant(client, collection_name, chunks, label, model):
    for i in range(0, len(chunks), BATCH_SIZE):
        batch_chunks = chunks[i:i+BATCH_SIZE]
        # Generate semantic vector points
        embeddings = model.encode(batch_chunks, convert_to_numpy=True).tolist()
        
        points = []
        for idx, (chunk, vector) in enumerate(zip(batch_chunks, embeddings)):
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunk,
                        "source": label,
                        "chunk_index": i + idx,
                        "timestamp": time.time()
                    }
                )
            )
        client.upsert(collection_name=collection_name, points=points)
    logging.info(f"Successfully vectorized and uploaded {len(chunks)} chunks to '{collection_name}'")

# ─────────────────────────────────────────────
# CORE INGESTION EXECUTION LOOP
# ─────────────────────────────────────────────
def main():
    logging.info("Starting ReassureAI Data Ingestion Engine...")
    
    qdrant_client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
    init_qdrant(qdrant_client)
    
    logging.info(f"Loading transformer encoding library: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)
    
    processed_history = load_processed_history()
    session = get_session_with_retries()
    
    for collection_name, sources_list in SOURCES.items():
        for src in sources_list:
            label = src["label"]
            
            if label in processed_history:
                logging.info(f"Skipping '{label}' — tracking records show it's already uploaded.")
                continue
                
            logging.info(f"Processing source '{label}' for collection '{collection_name}'...")
            
            try:
                if src["type"] == "url":
                    response = session.get(src["url"], timeout=30)
                    response.raise_for_status()
                    pdf_bytes = response.content
                else:
                    with open(src["path"], "rb") as f:
                        pdf_bytes = f.read()
                        
                # Extract text -> chunk context -> push to vector space
                extracted_text = extract_pdf_content(pdf_bytes, label)
                chunks = chunk_text(extracted_text)
                
                if chunks:
                    upload_to_qdrant(qdrant_client, collection_name, chunks, label, model)
                    save_processed_history(label)
                else:
                    logging.warning(f"No textual information extracted from source: {label}")
                    
            except Exception as e:
                logging.error(f"Failed to process source '{label}': {str(e)}", exc_info=True)
                print(f"⚠️ Error encountered processing '{label}'. Details cached in ingestion.log")
                
    logging.info("Ingestion complete. All collections synchronized successfully.")

if __name__ == "__main__":
    main()