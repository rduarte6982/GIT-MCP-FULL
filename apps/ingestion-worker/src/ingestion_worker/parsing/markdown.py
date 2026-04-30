from __future__ import annotations

import re
from pathlib import Path

from ..types import Element


HEADER_RE = re.compile(r"^(#{1,6})\s+(.*)$")


def parse_markdown(path: Path) -> list[Element]:
    text = path.read_text(encoding="utf-8", errors="replace")
    elements: list[Element] = []
    section_stack: list[str] = []
    buffer: list[str] = []

    def flush() -> None:
        if not buffer:
            return
        joined = "\n".join(buffer).strip()
        if joined:
            elements.append(Element(text=joined, section_path=list(section_stack)))
        buffer.clear()

    for line in text.splitlines():
        match = HEADER_RE.match(line)
        if match:
            flush()
            depth = len(match.group(1))
            section_stack = section_stack[: depth - 1]
            section_stack.append(match.group(2).strip())
            continue
        buffer.append(line)
    flush()
    return elements
