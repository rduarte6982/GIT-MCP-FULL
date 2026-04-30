# git-mcp-full

Servidor **MCP (Model Context Protocol)** que expoe a **API REST oficial do GitHub** (via Octokit) para qualquer cliente MCP — Claude Code, Claude Desktop e tambem **claude.ai web** (via Custom Connector). Com um Personal Access Token voce ganha acesso total a tudo o que a conta enxerga: repos publicos e privados, organizacoes, issues, PRs, gists, notificacoes, secrets (apenas nomes), workflows, etc.

Suporta **dois modos de transporte**:

| Modo | Quando usar | Como ativar |
|---|---|---|
| `stdio` | Local: Claude Code / Claude Desktop / Cursor rodando na mesma maquina | `MCP_TRANSPORT=stdio` (padrao) |
| `http`  | Remoto: deploy em Coolify/Render/Fly + conectar do claude.ai web | `MCP_TRANSPORT=http` |

---

## Instalacao local (modo stdio)

```bash
npm install
cp .env.example .env   # preencha GITHUB_TOKEN
npm start
```

`~/.claude/settings.json` (Windows: `%USERPROFILE%\.claude\settings.json`):

```json
{
  "mcpServers": {
    "github-full": {
      "command": "node",
      "args": ["c:/Users/rodrigoduarte/Downloads/VSCODE/GIT-MCP-FULL/src/index.js"],
      "env": { "GITHUB_TOKEN": "ghp_xxx" }
    }
  }
}
```

---

## Deploy remoto no Coolify (modo http) + uso no claude.ai

### 1. Suba o codigo num repo Git

Coolify precisa puxar o codigo de um Git remoto (GitHub, GitLab, Gitea). Faca push deste diretorio para um repo seu (privado serve).

### 2. Crie o servico no Coolify

- **New Resource → Public Repository** (ou Private + GitHub App).
- **Build Pack: Dockerfile** (o `Dockerfile` ja esta no projeto).
- **Port exposed: 3000** (o que o container expoe internamente).
- **Domain**: aponte um subdominio seu, ex: `https://github-mcp.seu-dominio.com`. Coolify tira HTTPS no Let's Encrypt automaticamente.
- **Environment variables** (aba Environment):
  ```
  GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
  MCP_TRANSPORT=http
  MCP_AUTH_TOKEN=<gere um token forte, ex: openssl rand -hex 32>
  PORT=3000
  ```
- **Health check path**: `/health` (opcional, ja tem HEALTHCHECK no Dockerfile).
- **Deploy**.

### 3. Verifique

```bash
curl https://github-mcp.seu-dominio.com/health
# {"ok":true,"name":"git-mcp-full","version":"1.1.0"}

curl -X POST https://github-mcp.seu-dominio.com/mcp \
  -H "authorization: Bearer SEU_MCP_AUTH_TOKEN" \
  -H "content-type: application/json" \
  -H "accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Deve retornar SSE com a lista de tools.

### 4. Conectar no claude.ai (web)

Disponivel para **Claude Pro / Team / Enterprise**.

1. Abra https://claude.ai → **Settings → Connectors → Browse connectors → Add custom connector** (ou "Connect apps").
2. **Name**: `GitHub Full`
3. **Remote MCP server URL**: `https://github-mcp.seu-dominio.com/mcp`
4. **Advanced / Authentication**: escolha bearer/token e cole o valor de `MCP_AUTH_TOKEN`.
5. **Add** → o claude.ai vai chamar `tools/list` e descobrir as 28 ferramentas.
6. Numa nova conversa, ative o connector no menu de ferramentas.

> **Importante:** o claude.ai Free **nao** suporta custom connectors. Em planos pagos sem connector ativo, voce ainda pode usar via Claude Desktop apontando o MCP remoto na config.

### 4b. Conectar no Claude Desktop (modo HTTP remoto)

```json
{
  "mcpServers": {
    "github-full-remote": {
      "url": "https://github-mcp.seu-dominio.com/mcp",
      "headers": { "Authorization": "Bearer SEU_MCP_AUTH_TOKEN" }
    }
  }
}
```

---

## Ferramentas (28)

| Tool | O que faz |
|---|---|
| `get_authenticated_user` | dados da conta dona do token |
| `list_user_orgs` | organizacoes do usuario (inclui privadas) |
| `list_repos` | repos do usuario (filtro publico/privado) |
| `list_org_repos` | repos de uma org (inclui privados) |
| `get_repo` | detalhes de um repo |
| `list_repo_contents` | listar arquivos/pastas |
| `get_file_content` | ler arquivo (decodifica base64) |
| `list_branches` | branches |
| `list_commits` / `get_commit` | historico e detalhe de commit |
| `list_issues` / `get_issue` | issues |
| `list_pull_requests` / `get_pull_request` / `list_pr_files` | PRs |
| `list_workflow_runs` | execucoes de Actions |
| `search_repos` / `search_code` / `search_issues` / `search_users` | buscas |
| `list_gists` / `get_gist` | gists |
| `list_notifications` | notificacoes |
| `list_starred` | favoritos |
| `list_repo_collaborators` | colaboradores |
| `list_repo_secrets` | nomes (NUNCA valores) dos secrets |
| `get_rate_limit` | quota atual do token |
| `github_api_request` | **PLENOS PODERES** — qualquer rota REST (GET/POST/PATCH/PUT/DELETE) |

---

## Avisos de seguranca importantes

- O `GITHUB_TOKEN` da o controle total da conta. **Nunca** commitar `.env`.
- Em modo HTTP **publico** (Coolify), **qualquer pessoa que descobrir a URL + bearer token** acessa SUA conta GitHub. O `MCP_AUTH_TOKEN` e a unica barreira — gere algo forte (`openssl rand -hex 32`) e nao compartilhe.
- O servidor multiplica os privilegios do token: a tool `github_api_request` permite **modificar/deletar** qualquer coisa que o token enxerga. Considere usar um token com escopos minimos para producao.
- Para uso multi-usuario com identidades reais (cada usuario com seu proprio GitHub), o caminho correto e implementar **OAuth 2.0** no servidor MCP — nao esta incluido aqui (e mais complexo). Esta implementacao assume **um token, um dono**.
- `list_repo_secrets` retorna apenas nomes — a API do GitHub nao expoe valores de secrets.
