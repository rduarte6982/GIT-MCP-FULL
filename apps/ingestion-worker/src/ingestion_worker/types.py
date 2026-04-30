from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class EntityRef:
    kind: str
    name: str


@dataclass
class Element:
    text: str
    page: int | None = None
    section_path: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


@dataclass
class EnrichedElement(Element):
    entities: list[EntityRef] = field(default_factory=list)


@dataclass
class Chunk:
    content: str
    section_path: list[str]
    page_start: int | None
    page_end: int | None
    token_count: int
    entity_refs: list[EntityRef]
    context_prefix: str | None = None
    module: str | None = None
    language: str = "pt-BR"

    def combined_text(self) -> str:
        if self.context_prefix:
            return f"{self.context_prefix}\n\n{self.content}"
        return self.content


@dataclass
class DocumentMeta:
    document_id: str
    tenant_id: str
    knowledge_base_id: str
    title: str
    storage_path: str
    content_type: str
    sap_release: str | None
