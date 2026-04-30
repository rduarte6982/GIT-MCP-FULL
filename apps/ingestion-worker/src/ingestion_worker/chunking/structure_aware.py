from __future__ import annotations

from ..config import settings
from ..types import Chunk, EnrichedElement, EntityRef
from .tokenizer import count_tokens


def chunk_with_structure(
    elements: list[EnrichedElement],
    target_tokens: int | None = None,
    min_tokens: int | None = None,
    max_tokens: int | None = None,
    overlap_tokens: int | None = None,
) -> list[Chunk]:
    target = target_tokens or settings.chunk_target_tokens
    min_t = min_tokens or settings.chunk_min_tokens
    max_t = max_tokens or settings.chunk_max_tokens
    overlap = overlap_tokens or settings.chunk_overlap_tokens

    chunks: list[Chunk] = []
    buffer_text: list[str] = []
    buffer_entities: dict[tuple[str, str], EntityRef] = {}
    buffer_section: list[str] = []
    buffer_pages: list[int] = []
    buffer_tokens = 0

    def flush() -> None:
        nonlocal buffer_text, buffer_entities, buffer_section, buffer_pages, buffer_tokens
        if buffer_tokens < min_t and len(chunks) > 0:
            return
        if not buffer_text:
            return
        content = "\n\n".join(buffer_text)
        chunks.append(
            Chunk(
                content=content,
                section_path=list(buffer_section),
                page_start=min(buffer_pages) if buffer_pages else None,
                page_end=max(buffer_pages) if buffer_pages else None,
                token_count=buffer_tokens,
                entity_refs=list(buffer_entities.values()),
            )
        )
        # overlap: keep tail
        if overlap > 0 and chunks:
            tail = content[-overlap * 4 :]
            buffer_text = [tail]
            buffer_tokens = count_tokens(tail)
        else:
            buffer_text = []
            buffer_tokens = 0
        buffer_entities = {}
        buffer_pages = []

    for el in elements:
        if buffer_section != el.section_path and buffer_tokens >= min_t:
            flush()
        text_tokens = count_tokens(el.text)
        if buffer_tokens + text_tokens > max_t and buffer_text:
            flush()
        buffer_text.append(el.text)
        buffer_tokens += text_tokens
        buffer_section = list(el.section_path)
        if el.page is not None:
            buffer_pages.append(el.page)
        for ref in el.entities:
            buffer_entities[(ref.kind, ref.name)] = ref
        if buffer_tokens >= target:
            flush()

    flush()
    return chunks
