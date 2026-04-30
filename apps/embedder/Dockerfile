FROM ghcr.io/huggingface/text-embeddings-inference:cpu-1.5
ENV MODEL_ID=BAAI/bge-m3 \
    PORT=80 \
    MAX_BATCH_TOKENS=8192 \
    MAX_CONCURRENT_REQUESTS=64
EXPOSE 80
