# wirelog-docs

Documentation site for [WireLog](https://wirelog.ai) — headless analytics for agents and LLMs.

Built with [Astro Starlight](https://starlight.astro.build/). Deployed to `docs.wirelog.ai`.

## Features

- **Zero JavaScript output** — server-rendered HTML, ideal for AI crawlers
- **Auto-generated `/llms.txt`** — via `starlight-llms-txt` plugin, makes all doc content available to LLMs in one fetch
- **Copy-as-LLM dropdown** — lets users copy page content as Markdown or open directly in ChatGPT/Claude
- **Full query language reference** — sources, stages, fields, annotated examples
- **Agent integration docs** — MCP server setup, Claude Code skills, agent analytics patterns

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Build static site
npm run preview  # Preview built site
```

## Structure

```
src/content/docs/
├── index.mdx              # Landing page
├── quickstart.mdx         # 5-minute setup
├── tracking/              # HTTP API, JS SDK, Python/Node clients
├── query-language/        # DSL overview, sources, stages, fields, examples
├── identity/              # Identity stitching, /identify API
├── agents/                # MCP, skills, agent patterns
├── guides/                # SaaS metrics, migration from competitors
└── reference/             # API reference, pricing
```

## Deployment

Build produces static files in `dist/`. Deploy to any static host (Cloudflare Pages, Vercel, Netlify).

The `starlight-llms-txt` plugin generates `/llms.txt` at build time from all doc pages.
