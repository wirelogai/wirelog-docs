import type { APIRoute } from "astro";
import { getDocsPages } from "../lib/docs-markdown";

const INTRO_PAGE_PATHS = new Set(["", "quickstart"]);

function buildLLMsDirectory(): Promise<string> {
  return getDocsPages().then((pages) => {
    const tocLines = pages.map((page) => `- [${page.title}](${page.mdUrl})`);
    const introPages = pages.filter((page) => INTRO_PAGE_PATHS.has(page.docPath));
    const introSections = introPages
      .map((page) =>
        [
          `## ${page.title}`,
          "",
          `Source: ${page.docUrl}`,
          `Markdown: ${page.mdUrl}`,
          "",
          page.body,
          "",
        ].join("\n"),
      )
      .join("\n");

    return [
      "# WireLog Documentation",
      "",
      "> Markdown table of contents for all docs pages.",
      "",
      "## Table of Contents",
      "",
      ...tocLines,
      "",
      "## Introduction Pages",
      "",
      introSections || "No introduction pages found.",
      "",
    ].join("\n");
  });
}

export const GET: APIRoute = async () => {
  const body = await buildLLMsDirectory();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
