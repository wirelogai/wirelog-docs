import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightLlmsTxt from "starlight-llms-txt";

export default defineConfig({
  site: "https://docs.wirelog.ai",
  integrations: [
    starlight({
      title: "WireLog",
      description:
        "Headless analytics for agents and LLMs. Events in, Markdown out.",
      logo: {
        src: "./public/logo.svg",
        alt: "WireLog",
      },
      favicon: "/favicon.svg",
      plugins: [starlightLlmsTxt()],
      components: {
        Footer: "./src/components/Footer.astro",
        PageTitle: "./src/components/PageTitle.astro",
      },
      social: {
        github: "https://github.com/wirelogai",
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "index" },
            { label: "Quickstart", slug: "quickstart" },
          ],
        },
        {
          label: "Tracking",
          items: [
            { label: "HTTP API", slug: "tracking/http-api" },
            { label: "Script Tag", slug: "tracking/script-tag" },
            { label: "TypeScript Client", slug: "tracking/typescript-client" },
            { label: "Python Client", slug: "tracking/python-client" },
          ],
        },
        {
          label: "Query Language",
          items: [
            { label: "Overview", slug: "query-language/overview" },
            { label: "Sources", slug: "query-language/sources" },
            { label: "Stages", slug: "query-language/stages" },
            { label: "Fields", slug: "query-language/fields" },
            { label: "Examples", slug: "query-language/examples" },
          ],
        },
        {
          label: "Identity",
          items: [
            { label: "Overview", slug: "identity/overview" },
            { label: "Identify API", slug: "identity/identify-api" },
          ],
        },
        {
          label: "Agents",
          items: [
            { label: "Overview", slug: "agents/overview" },
            { label: "MCP Server", slug: "agents/mcp-server" },
            { label: "Claude Code Skills", slug: "agents/skills" },
            { label: "Agent Patterns", slug: "agents/patterns" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "SaaS Metrics", slug: "guides/saas-metrics" },
            { label: "Migration", slug: "guides/migration" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "API Reference", slug: "reference/api" },
            { label: "Pricing", slug: "reference/pricing" },
          ],
        },
      ],
      head: [
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.googleapis.com",
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: true,
          },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap",
          },
        },
      ],
      customCss: ["./src/styles/custom.css"],
    }),
  ],
});
