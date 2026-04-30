from __future__ import annotations

from pathlib import Path

from ..types import Element


def parse_html(path: Path) -> list[Element]:
    from unstructured.partition.html import partition_html

    elements = partition_html(filename=str(path))
    out: list[Element] = []
    section_stack: list[str] = []
    for el in elements:
        text = (el.text or "").strip()
        if not text:
            continue
        category = getattr(el, "category", None) or el.__class__.__name__
        if category in ("Title", "Header"):
            depth = int(getattr(el.metadata, "category_depth", 0) or 0)
            section_stack = section_stack[:depth]
            section_stack.append(text)
            continue
        out.append(Element(text=text, section_path=list(section_stack)))
    return out
