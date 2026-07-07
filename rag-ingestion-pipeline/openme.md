> `This is a demo or dummy data ingestion pipiline for RAG.

> If you want to use `Google Colab` for data ingestion the upload `.ipynb` and set secrates the you are good to go.

> If you want to use your terminal then use `.py` here.

## ReassureAI RAG Ingestion Pipeline: A Simple Approach

This notebook implements a **Retrieval-Augmented Generation (RAG) ingestion pipeline**. Its main goal is to process various documents (like PDFs) and prepare them for use in AI applications, specifically for a knowledge base that an AI can query to answer questions. Here's the simplified approach:

1.  **Connect to Qdrant**: First, the pipeline establishes a secure connection to Qdrant Cloud, which is a vector database. This database will store the processed document information.
2.  **Organize Knowledge Bases**: It checks for and creates distinct "collections" within Qdrant, such as `ayurveda_kb` and `mental_health_kb`. These act like separate folders for different types of knowledge.
3.  **Load Embedding Model**: A powerful AI model (`BAAI/bge-m3`) is loaded. This model is responsible for understanding the meaning of text and converting it into numerical representations called "embeddings."
4.  **Process Documents**: For each document (PDF from a URL or local file) listed in the `SOURCES` dictionary:
    *   **Download/Read**: The document is either downloaded from a URL or read from a local file.
    *   **Extract Text (with OCR fallback)**: The text content is extracted from the PDF. If a page doesn't have selectable text (e.g., it's an image), an Optical Character Recognition (OCR) tool (Tesseract) is used to read the text from the image.
    *   **Chunking**: The extracted text is then broken down into smaller, manageable pieces called "chunks." This is done sentence-by-sentence to ensure that complete ideas are kept together.
5.  **Embed and Upload**: Each text chunk is fed into the embedding model, which generates a numerical vector (embedding) representing its meaning. These chunks, along with their embeddings and metadata (like the original source), are then uploaded in batches to their respective collections in Qdrant.
6.  **Resume Capability**: The pipeline keeps track of which parts of each document have been processed in a file (`processed_sources.txt`). This allows the ingestion process to resume from where it left off if it's interrupted, preventing redundant processing and saving time.

In essence, this pipeline transforms raw, unstructured document data into a structured, searchable format within Qdrant, making it ready for AI models to efficiently retrieve relevant information.