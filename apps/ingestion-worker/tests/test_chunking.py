from __future__ import annotations

from ingestion_worker.chunking.structure_aware import chunk_with_structure
from ingestion_worker.types import EnrichedElement, EntityRef


def test_chunking_respects_section_boundaries() -> None:
    elements = [
        EnrichedElement(text="Texto da seção A " * 80, section_path=["A"], entities=[]),
        EnrichedElement(
            text="Texto da seção B mencionando J_1BBRANCH " * 80,
            section_path=["B"],
            entities=[EntityRef(kind="table", name="J_1BBRANCH")],
        ),
    ]
    chunks = chunk_with_structure(elements, target_tokens=200, min_tokens=50, max_tokens=400)
    assert len(chunks) >= 2
    assert any("J_1BBRANCH" in c.content for c in chunks)
