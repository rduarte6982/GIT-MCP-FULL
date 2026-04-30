from __future__ import annotations

import json
import tempfile
from contextlib import contextmanager
from dataclasses import asdict
from pathlib import Path

import psycopg
from pgvector.psycopg import register_vector

from ..config import settings
from ..types import Chunk, DocumentMeta, EntityRef


@contextmanager
def get_conn():
    with psycopg.connect(settings.database_url) as conn:
        register_vector(conn)
        yield conn


def fetch_document_meta(document_id: str) -> DocumentMeta:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, tenant_id, knowledge_base_id, title, storage_path, content_type, sap_release
            FROM documents
            WHERE id = %s
            """,
            (document_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise ValueError(f"document not found: {document_id}")
        return DocumentMeta(
            document_id=row[0],
            tenant_id=row[1],
            knowledge_base_id=row[2],
            title=row[3],
            storage_path=row[4],
            content_type=row[5],
            sap_release=row[6],
        )


def update_document_status(document_id: str, status: str, error: str | None = None) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE documents
            SET status = %s, error_message = %s, updated_at = now()
            WHERE id = %s
            """,
            (status, error, document_id),
        )
        conn.commit()


def download_document_to_tmp(meta: DocumentMeta) -> Path:
    """Download a document from Supabase Storage into a tmp file."""
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase credentials missing")
    import httpx

    url = f"{settings.supabase_url}/storage/v1/object/{settings.storage_bucket}/{meta.storage_path}"
    headers = {"authorization": f"Bearer {settings.supabase_service_role_key}"}
    suffix = Path(meta.title).suffix or ".bin"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    with httpx.Client(timeout=120) as client:
        with client.stream("GET", url, headers=headers) as r:
            r.raise_for_status()
            for chunk in r.iter_bytes():
                tmp.write(chunk)
    tmp.close()
    return Path(tmp.name)


def _entity_refs_to_json(refs: list[EntityRef]) -> str:
    return json.dumps([asdict(r) for r in refs])


def save_chunks(meta: DocumentMeta, chunks: list[Chunk], embeddings: list[list[float]]) -> None:
    assert len(chunks) == len(embeddings), "chunks and embeddings length mismatch"
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM chunks WHERE document_id = %s", (meta.document_id,))
        cur.executemany(
            """
            INSERT INTO chunks (
                document_id, tenant_id, knowledge_base_id,
                chunk_index, content, context_prefix,
                section_path, page_start, page_end, token_count,
                sap_release, sap_module, language,
                embedding, entity_refs
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb
            )
            """,
            [
                (
                    meta.document_id,
                    meta.tenant_id,
                    meta.knowledge_base_id,
                    i,
                    c.content,
                    c.context_prefix,
                    c.section_path,
                    c.page_start,
                    c.page_end,
                    c.token_count,
                    meta.sap_release,
                    c.module,
                    c.language,
                    emb,
                    _entity_refs_to_json(c.entity_refs),
                )
                for i, (c, emb) in enumerate(zip(chunks, embeddings, strict=True))
            ],
        )
        conn.commit()
