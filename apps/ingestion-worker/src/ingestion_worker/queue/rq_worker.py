from __future__ import annotations

import sys

import redis
import structlog
from rq import Queue, Worker

from ..config import settings
from ..main import ingest_document

log = structlog.get_logger()


def main() -> None:
    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            __import__("logging").getLevelName(settings.log_level.upper())
        ),
    )
    conn = redis.from_url(settings.redis_url)
    queue = Queue("ingest", connection=conn)
    log.info("worker.starting", queue="ingest", redis=settings.redis_url)
    worker = Worker([queue], connection=conn)
    worker.work(with_scheduler=True)


def run_job(document_id: str) -> None:
    """RQ task entrypoint. BullMQ producers must enqueue with the FQN of this function."""
    ingest_document(document_id)


if __name__ == "__main__":
    sys.exit(main())
