from __future__ import annotations

from pathlib import Path


class FileExtractionError(Exception):
    """Raised when text cannot be extracted from a supported file."""


class FileExtractor:
    SUPPORTED_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg"}

    @classmethod
    def extract(cls, file_path: str | Path) -> str:
        path = Path(file_path)
        suffix = path.suffix.lower()

        if suffix == ".pdf":
            return cls.extract_text_from_pdf(path)
        if suffix in cls.SUPPORTED_IMAGE_SUFFIXES:
            return cls.extract_text_from_image(path)

        raise FileExtractionError(f"Unsupported file type: {suffix or 'unknown'}")

    @staticmethod
    def extract_text_from_pdf(pdf_path: str | Path) -> str:
        path = Path(pdf_path)
        extracted_text = _extract_pdf_text_with_pypdf2(path)
        if _has_meaningful_text(extracted_text):
            return extracted_text

        ocr_text = _ocr_pdf(path)
        if _has_meaningful_text(ocr_text):
            return ocr_text

        raise FileExtractionError("No readable text found in PDF")

    @staticmethod
    def extract_text_from_image(img_path: str | Path) -> str:
        text = _ocr_image(Path(img_path))
        if _has_meaningful_text(text):
            return text

        raise FileExtractionError("No readable text found in image")


def _extract_pdf_text_with_pypdf2(path: Path) -> str:
    try:
        import PyPDF2

        with path.open("rb") as file_obj:
            reader = PyPDF2.PdfReader(file_obj)
            pages = [page.extract_text() or "" for page in reader.pages]
    except Exception:
        return ""

    return "\n".join(page.strip() for page in pages if page.strip()).strip()


def _ocr_pdf(path: Path) -> str:
    try:
        from pdf2image import convert_from_path
        import pytesseract

        images = convert_from_path(str(path))
        pages = [pytesseract.image_to_string(image) for image in images]
    except Exception:
        return ""

    return "\n".join(page.strip() for page in pages if page.strip()).strip()


def _ocr_image(path: Path) -> str:
    try:
        from PIL import Image, ImageFilter, ImageOps
        import pytesseract

        with Image.open(path) as image:
            prepared = ImageOps.grayscale(image)
            prepared = ImageOps.autocontrast(prepared)
            prepared = prepared.filter(ImageFilter.SHARPEN)
            return pytesseract.image_to_string(prepared).strip()
    except Exception:
        return ""


def _has_meaningful_text(text: str, min_chars: int = 8) -> bool:
    compact = "".join(char for char in text if not char.isspace())
    return len(compact) >= min_chars
