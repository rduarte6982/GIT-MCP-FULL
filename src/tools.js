import { Octokit } from "@octokit/rest";

export function createOctokit(token) {
  return new Octokit({
    auth: token,
    baseUrl: process.env.GITHUB_API_URL || "https://api.github.com",
    userAgent: "git-mcp-full/1.0",
  });
}

const json = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
});

export function buildTools(octokit) {
  return [
    {
      name: "get_authenticated_user",
      description: "Retorna informacoes da conta autenticada pelo token (login, email, plano, etc.)",
      inputSchema: { type: "object", properties: {} },
      handler: async () => json((await octokit.users.getAuthenticated()).data),
    },
    {
      name: "list_user_orgs",
      description: "Lista organizacoes (publicas e privadas) das quais o usuario autenticado faz parte",
      inputSchema: { type: "object", properties: {} },
      handler: async () => json((await octokit.orgs.listForAuthenticatedUser({ per_page: 100 })).data),
    },
    {
      name: "list_repos",
      description:
        "Lista repositorios do usuario autenticado (inclui privados). visibility=all|public|private",
      inputSchema: {
        type: "object",
        properties: {
          visibility: { type: "string", enum: ["all", "public", "private"], default: "all" },
          affiliation: { type: "string", default: "owner,collaborator,organization_member" },
          sort: { type: "string", enum: ["created", "updated", "pushed", "full_name"], default: "updated" },
          per_page: { type: "number", default: 50 },
          page: { type: "number", default: 1 },
        },
      },
      handler: async (a) =>
        json(
          (
            await octokit.repos.listForAuthenticatedUser({
              visibility: a.visibility ?? "all",
              affiliation: a.affiliation ?? "owner,collaborator,organization_member",
              sort: a.sort ?? "updated",
              per_page: a.per_page ?? 50,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "list_org_repos",
      description: "Lista repositorios de uma organizacao (inclui privados se token tem acesso)",
      inputSchema: {
        type: "object",
        properties: {
          org: { type: "string" },
          type: {
            type: "string",
            enum: ["all", "public", "private", "forks", "sources", "member"],
            default: "all",
          },
          per_page: { type: "number", default: 50 },
          page: { type: "number", default: 1 },
        },
        required: ["org"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.repos.listForOrg({
              org: a.org,
              type: a.type ?? "all",
              per_page: a.per_page ?? 50,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "get_repo",
      description: "Detalhes completos de um repositorio (owner/repo)",
      inputSchema: {
        type: "object",
        properties: { owner: { type: "string" }, repo: { type: "string" } },
        required: ["owner", "repo"],
      },
      handler: async (a) => json((await octokit.repos.get({ owner: a.owner, repo: a.repo })).data),
    },
    {
      name: "list_repo_contents",
      description: "Lista arquivos/pastas em um caminho do repositorio (path vazio = raiz)",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string", default: "" },
          ref: { type: "string", description: "branch/tag/commit (opcional)" },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.repos.getContent({
              owner: a.owner,
              repo: a.repo,
              path: a.path ?? "",
              ...(a.ref ? { ref: a.ref } : {}),
            })
          ).data
        ),
    },
    {
      name: "get_file_content",
      description: "Le o conteudo de um arquivo (decodifica base64 automaticamente)",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          path: { type: "string" },
          ref: { type: "string" },
        },
        required: ["owner", "repo", "path"],
      },
      handler: async (a) => {
        const { data } = await octokit.repos.getContent({
          owner: a.owner,
          repo: a.repo,
          path: a.path,
          ...(a.ref ? { ref: a.ref } : {}),
        });
        if (Array.isArray(data)) return json({ error: "path is a directory", listing: data });
        const decoded =
          data.encoding === "base64" ? Buffer.from(data.content, "base64").toString("utf-8") : data.content;
        return json({
          path: data.path,
          size: data.size,
          sha: data.sha,
          encoding: data.encoding,
          content: decoded,
        });
      },
    },
    {
      name: "list_branches",
      description: "Lista branches do repositorio",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          per_page: { type: "number", default: 100 },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (await octokit.repos.listBranches({ owner: a.owner, repo: a.repo, per_page: a.per_page ?? 100 }))
            .data
        ),
    },
    {
      name: "list_commits",
      description: "Lista commits de um repositorio (opcional: sha, path, author, since, until)",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          sha: { type: "string" },
          path: { type: "string" },
          author: { type: "string" },
          since: { type: "string" },
          until: { type: "string" },
          per_page: { type: "number", default: 30 },
          page: { type: "number", default: 1 },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.repos.listCommits({
              owner: a.owner,
              repo: a.repo,
              ...(a.sha ? { sha: a.sha } : {}),
              ...(a.path ? { path: a.path } : {}),
              ...(a.author ? { author: a.author } : {}),
              ...(a.since ? { since: a.since } : {}),
              ...(a.until ? { until: a.until } : {}),
              per_page: a.per_page ?? 30,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "get_commit",
      description: "Detalhe de um commit incluindo arquivos alterados e diffs",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          ref: { type: "string", description: "sha do commit" },
        },
        required: ["owner", "repo", "ref"],
      },
      handler: async (a) =>
        json((await octokit.repos.getCommit({ owner: a.owner, repo: a.repo, ref: a.ref })).data),
    },
    {
      name: "list_issues",
      description: "Lista issues do repositorio (state: open|closed|all)",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
          labels: { type: "string" },
          per_page: { type: "number", default: 30 },
          page: { type: "number", default: 1 },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.issues.listForRepo({
              owner: a.owner,
              repo: a.repo,
              state: a.state ?? "open",
              ...(a.labels ? { labels: a.labels } : {}),
              per_page: a.per_page ?? 30,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "get_issue",
      description: "Detalhes de uma issue especifica",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          issue_number: { type: "number" },
        },
        required: ["owner", "repo", "issue_number"],
      },
      handler: async (a) =>
        json(
          (await octokit.issues.get({ owner: a.owner, repo: a.repo, issue_number: a.issue_number })).data
        ),
    },
    {
      name: "list_pull_requests",
      description: "Lista pull requests (state: open|closed|all)",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          state: { type: "string", enum: ["open", "closed", "all"], default: "open" },
          per_page: { type: "number", default: 30 },
          page: { type: "number", default: 1 },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.pulls.list({
              owner: a.owner,
              repo: a.repo,
              state: a.state ?? "open",
              per_page: a.per_page ?? 30,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "get_pull_request",
      description: "Detalhes de um PR especifico",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          pull_number: { type: "number" },
        },
        required: ["owner", "repo", "pull_number"],
      },
      handler: async (a) =>
        json((await octokit.pulls.get({ owner: a.owner, repo: a.repo, pull_number: a.pull_number })).data),
    },
    {
      name: "list_pr_files",
      description: "Lista arquivos modificados em um PR",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          pull_number: { type: "number" },
          per_page: { type: "number", default: 100 },
        },
        required: ["owner", "repo", "pull_number"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.pulls.listFiles({
              owner: a.owner,
              repo: a.repo,
              pull_number: a.pull_number,
              per_page: a.per_page ?? 100,
            })
          ).data
        ),
    },
    {
      name: "list_workflow_runs",
      description: "Lista execucoes de GitHub Actions de um repositorio",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          per_page: { type: "number", default: 30 },
          page: { type: "number", default: 1 },
        },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.actions.listWorkflowRunsForRepo({
              owner: a.owner,
              repo: a.repo,
              per_page: a.per_page ?? 30,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "search_repos",
      description: "Busca repositorios usando sintaxe de busca do GitHub",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          sort: { type: "string", enum: ["stars", "forks", "help-wanted-issues", "updated"] },
          order: { type: "string", enum: ["asc", "desc"], default: "desc" },
          per_page: { type: "number", default: 30 },
        },
        required: ["q"],
      },
      handler: async (a) =>
        json(
          (
            await octokit.search.repos({
              q: a.q,
              ...(a.sort ? { sort: a.sort } : {}),
              order: a.order ?? "desc",
              per_page: a.per_page ?? 30,
            })
          ).data
        ),
    },
    {
      name: "search_code",
      description: "Busca por codigo (escopo limitado pelo token; inclui repos privados acessiveis)",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string" },
          per_page: { type: "number", default: 30 },
        },
        required: ["q"],
      },
      handler: async (a) => json((await octokit.search.code({ q: a.q, per_page: a.per_page ?? 30 })).data),
    },
    {
      name: "search_issues",
      description: "Busca issues e PRs em todo o GitHub (escopo do token)",
      inputSchema: {
        type: "object",
        properties: { q: { type: "string" }, per_page: { type: "number", default: 30 } },
        required: ["q"],
      },
      handler: async (a) =>
        json((await octokit.search.issuesAndPullRequests({ q: a.q, per_page: a.per_page ?? 30 })).data),
    },
    {
      name: "search_users",
      description: "Busca usuarios do GitHub",
      inputSchema: {
        type: "object",
        properties: { q: { type: "string" }, per_page: { type: "number", default: 30 } },
        required: ["q"],
      },
      handler: async (a) => json((await octokit.search.users({ q: a.q, per_page: a.per_page ?? 30 })).data),
    },
    {
      name: "list_gists",
      description: "Lista gists (publicos e privados) do usuario autenticado",
      inputSchema: {
        type: "object",
        properties: { per_page: { type: "number", default: 30 }, page: { type: "number", default: 1 } },
      },
      handler: async (a) =>
        json((await octokit.gists.list({ per_page: a.per_page ?? 30, page: a.page ?? 1 })).data),
    },
    {
      name: "get_gist",
      description: "Le um gist especifico (incluindo arquivos)",
      inputSchema: {
        type: "object",
        properties: { gist_id: { type: "string" } },
        required: ["gist_id"],
      },
      handler: async (a) => json((await octokit.gists.get({ gist_id: a.gist_id })).data),
    },
    {
      name: "list_notifications",
      description: "Lista notificacoes do usuario autenticado",
      inputSchema: {
        type: "object",
        properties: {
          all: { type: "boolean", default: false },
          participating: { type: "boolean", default: false },
          per_page: { type: "number", default: 50 },
        },
      },
      handler: async (a) =>
        json(
          (
            await octokit.activity.listNotificationsForAuthenticatedUser({
              all: a.all ?? false,
              participating: a.participating ?? false,
              per_page: a.per_page ?? 50,
            })
          ).data
        ),
    },
    {
      name: "list_starred",
      description: "Lista repositorios favoritados pelo usuario",
      inputSchema: {
        type: "object",
        properties: { per_page: { type: "number", default: 30 }, page: { type: "number", default: 1 } },
      },
      handler: async (a) =>
        json(
          (
            await octokit.activity.listReposStarredByAuthenticatedUser({
              per_page: a.per_page ?? 30,
              page: a.page ?? 1,
            })
          ).data
        ),
    },
    {
      name: "list_repo_collaborators",
      description: "Lista colaboradores de um repositorio",
      inputSchema: {
        type: "object",
        properties: { owner: { type: "string" }, repo: { type: "string" } },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (await octokit.repos.listCollaborators({ owner: a.owner, repo: a.repo, per_page: 100 })).data
        ),
    },
    {
      name: "list_repo_secrets",
      description: "Lista nomes (NUNCA valores) dos secrets de Actions do repositorio",
      inputSchema: {
        type: "object",
        properties: { owner: { type: "string" }, repo: { type: "string" } },
        required: ["owner", "repo"],
      },
      handler: async (a) =>
        json(
          (await octokit.actions.listRepoSecrets({ owner: a.owner, repo: a.repo, per_page: 100 })).data
        ),
    },
    {
      name: "get_rate_limit",
      description: "Mostra o rate limit atual do token",
      inputSchema: { type: "object", properties: {} },
      handler: async () => json((await octokit.rateLimit.get()).data),
    },
    {
      name: "github_api_request",
      description:
        "PLENOS PODERES: dispara qualquer requisicao da REST API do GitHub. Ex: method=GET, route=/repos/{owner}/{repo}/issues, params={owner:'x',repo:'y'}.",
      inputSchema: {
        type: "object",
        properties: {
          method: { type: "string", enum: ["GET", "POST", "PATCH", "PUT", "DELETE"], default: "GET" },
          route: { type: "string" },
          params: { type: "object", default: {} },
        },
        required: ["route"],
      },
      handler: async (a) => {
        const method = (a.method ?? "GET").toUpperCase();
        const res = await octokit.request(`${method} ${a.route}`, a.params ?? {});
        return json({ status: res.status, headers: res.headers, data: res.data });
      },
    },
  ];
}

export function registerHandlers(server, tools, schemas) {
  const { ListToolsRequestSchema, CallToolRequestSchema } = schemas;
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = tools.find((t) => t.name === req.params.name);
    if (!tool) {
      return { isError: true, content: [{ type: "text", text: `Tool desconhecida: ${req.params.name}` }] };
    }
    try {
      return await tool.handler(req.params.arguments ?? {});
    } catch (e) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `GitHub API error: ${e.status || ""} ${e.message}\n${
              e.response?.data ? JSON.stringify(e.response.data, null, 2) : ""
            }`,
          },
        ],
      };
    }
  });
}
