from __future__ import annotations

from pathlib import Path

from ..types import Element


def parse_pdf(path: Path) -> list[Element]:
    from unstructured.partition.pdf import partition_pdf

    elements = partition_pdf(filename=str(path), strategy="hi_res", infer_table_structure=True)
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
        page = getattr(el.metadata, "page_number", None)
        out.append(
            Element(
                text=text,
                page=page,
                section_path=list(section_stack),
                metadata={"category": category},
            )
        )
    return out
