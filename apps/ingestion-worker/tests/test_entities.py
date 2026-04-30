from __future__ import annotations

from ingestion_worker.enrichment.entities import extract_entities
from ingestion_worker.types import Element


def test_extract_entities_brazilian_tables() -> None:
    el = Element(
        text="Para customizar a NF-e, ajuste a tabela J_1BTAXCODET e use BAPI_NFE_CREATE.",
    )
    enriched = extract_entities(el)
    names = {(r.kind, r.name) for r in enriched.entities}
    assert ("table", "J_1BTAXCODET") in names
    assert ("bapi", "BAPI_NFE_CREATE") in names
