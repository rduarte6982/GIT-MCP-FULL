from __future__ import annotations

from pathlib import Path

from ..types import Element
from .html import parse_html
from .markdown import parse_markdown
from .pdf import parse_pdf


def parse_document(file_path: str | Path, mime: str | None) -> list[Element]:
    path = Path(file_path)
    mime = (mime or "").lower()
    if mime == "application/pdf" or path.suffix.lower() == ".pdf":
        return parse_pdf(path)
    if mime in ("text/markdown", "text/x-markdown") or path.suffix.lower() in (".md", ".markdown"):
        return parse_markdown(path)
    if mime in ("text/html", "application/xhtml+xml") or path.suffix.lower() in (".html", ".htm"):
        return parse_html(path)
    return parse_markdown(path)
