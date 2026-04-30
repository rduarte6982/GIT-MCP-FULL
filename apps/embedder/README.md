# Embedder Service

Wraps the HuggingFace `text-embeddings-inference` server with the **BGE-M3** model
(1024-dim, multilingual, pt-BR friendly).

## Local

```sh
docker build -t scm-embedder apps/embedder
docker run --rm -p 8080:80 -v scm-embedder-cache:/data scm-embedder
```

Test:

```sh
curl -X POST http://localhost:8080/embed \
  -H "content-type: application/json" \
  -d '{"inputs": ["NF-e rejeição 539"]}'
```

## Coolify / production

For higher throughput swap the base image for the GPU variant
(`ghcr.io/huggingface/text-embeddings-inference:1.5`) and set the proper
`--shm-size`. Keep `/data` on a persistent volume to avoid re-downloading the
model on each restart.
