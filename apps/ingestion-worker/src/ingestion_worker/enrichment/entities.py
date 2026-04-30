from __future__ import annotations

import re

from ..types import Element, EnrichedElement, EntityRef


PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("table", re.compile(r"\bJ_1B[A-Z0-9_]+\b")),
    ("tcode", re.compile(r"\b(?:ME|MIRO|VA|VL|FB|J1B|F-)\d{1,3}[A-Z]?\b")),
    ("bapi", re.compile(r"\bBAPI[_A-Z0-9]+\b")),
    ("badi", re.compile(r"\bBADI_[A-Z0-9_]+\b")),
    ("ddic", re.compile(r"\b(?:CL|IF|FM|IT)_[A-Z0-9_]{3,}\b")),
    ("rejection", re.compile(r"\bRejei[cç][aã]o\s+(\d{2,4})\b", re.IGNORECASE)),
    ("nfe_field", re.compile(r"\b(?:emit|dest|infNFe|ide|prod|imposto|ICMS|IPI|PIS|COFINS)\b")),
]


def extract_entities(element: Element) -> EnrichedElement:
    found: dict[str, set[str]] = {}
    for kind, pattern in PATTERNS:
        for match in pattern.findall(element.text):
            name = match if isinstance(match, str) else match[0]
            found.setdefault(kind, set()).add(name.upper())
    refs = [EntityRef(kind=k, name=n) for k, names in found.items() for n in names]
    return EnrichedElement(
        text=element.text,
        page=element.page,
        section_path=element.section_path,
        metadata=element.metadata,
        entities=refs,
    )
