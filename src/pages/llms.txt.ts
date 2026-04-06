import type { APIRoute } from "astro";
import { getDocsPages } from "../lib/docs-markdown";
import llmInstructions from "../llm-instructions.md?raw";

function buildLLMsTxt(): Promise<string> {
  return getDocsPages().then((pages) => {
    const tocLines = pages.map((page) => `- [${page.title}](${page.mdUrl})`);

    return [
      llmInstructions.trim(),
      "",
      "---",
      "",
      "## Extended Documentation",
      "",
      ...tocLines,
      "",
    ].join("\n");
  });
}

export const GET: APIRoute = async () => {
  const body = await buildLLMsTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
