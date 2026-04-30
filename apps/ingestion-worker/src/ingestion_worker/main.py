from __future__ import annotations

import structlog

from .chunking.structure_aware import chunk_with_structure
from .contextual.claude import contextualize_chunks
from .embedding.client import embed_batch
from .enrichment.entities import extract_entities
from .parsing import parse_document
from .persistence.postgres import (
    download_document_to_tmp,
    fetch_document_meta,
    save_chunks,
    update_document_status,
)

log = structlog.get_logger()


def ingest_document(document_id: str) -> None:
    log.info("ingest.started", document_id=document_id)
    update_document_status(document_id, "parsing")

    doc_meta = fetch_document_meta(document_id)
    file_path = download_document_to_tmp(doc_meta)

    elements = parse_document(file_path, mime=doc_meta.content_type)
    enriched = [extract_entities(el) for el in elements]

    update_document_status(document_id, "chunking")
    chunks = chunk_with_structure(enriched)

    update_document_status(document_id, "embedding")
    full_doc_text = "\n\n".join(el.text for el in elements)
    contextualized = contextualize_chunks(chunks, full_doc_text)

    texts_to_embed = [c.combined_text() for c in contextualized]
    embeddings = embed_batch(texts_to_embed)

    save_chunks(doc_meta, contextualized, embeddings)
    update_document_status(document_id, "ready")

    log.info("ingest.completed", document_id=document_id, chunks=len(contextualized))
