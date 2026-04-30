from __future__ import annotations

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def _request_batch(client: httpx.Client, batch: list[str]) -> list[list[float]]:
    response = client.post(f"{settings.embedder_url}/embed", json={"inputs": batch})
    response.raise_for_status()
    return response.json()


def embed_batch(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    out: list[list[float]] = []
    batch_size = settings.embedding_batch_size
    with httpx.Client(timeout=60) as client:
        for i in range(0, len(texts), batch_size):
            out.extend(_request_batch(client, texts[i : i + batch_size]))
    return out
