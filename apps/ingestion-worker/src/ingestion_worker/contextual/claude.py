from __future__ import annotations

import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings
from ..types import Chunk

log = structlog.get_logger()

CONTEXT_PROMPT = """<document>
{document}
</document>

Aqui está o trecho que queremos situar dentro do documento acima:

<chunk>
{chunk}
</chunk>

Forneça um contexto curto (1-2 frases) explicando este trecho dentro do documento.
Foque em situar o trecho — não resuma, não adicione informações não presentes.
Responda APENAS o contexto, sem prefácio."""


def _client():
    if not settings.anthropic_api_key:
        return None
    import anthropic

    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=2, max=30))
def contextualize_one(chunk_text: str, full_doc_text: str) -> str:
    client = _client()
    if client is None:
        return ""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=[
            {
                "type": "text",
                "text": "Você é um indexador técnico especializado em documentação SAP.",
                "cache_control": {"type": "ephemeral"},
            },
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": CONTEXT_PROMPT.format(document=full_doc_text, chunk=chunk_text),
                        "cache_control": {"type": "ephemeral"},
                    }
                ],
            }
        ],
    )
    block = response.content[0]
    return block.text.strip() if hasattr(block, "text") else ""


def contextualize_chunks(chunks: list[Chunk], full_doc_text: str) -> list[Chunk]:
    if not settings.anthropic_api_key:
        log.warning("contextualize.skipped", reason="no_api_key")
        return chunks
    for c in chunks:
        try:
            c.context_prefix = contextualize_one(c.content, full_doc_text)
        except Exception as exc:  # pragma: no cover
            log.error("contextualize.failed", error=str(exc))
            c.context_prefix = None
    return chunks
