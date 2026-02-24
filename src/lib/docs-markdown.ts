import { getCollection } from "astro:content";

const DOCS_ORIGIN = "https://docs.wirelog.ai";

export type DocsPage = {
  title: string;
  description?: string;
  docPath: string;
  mdPath: string;
  docUrl: string;
  mdUrl: string;
  body: string;
};

function normalizeDocPath(id: string): string {
  const withoutExtension = id.replace(/\.(md|mdx)$/i, "");
  if (withoutExtension === "index") {
    return "";
  }
  if (withoutExtension.endsWith("/index")) {
    return withoutExtension.slice(0, -"/index".length);
  }
  return withoutExtension;
}

function mdPathFromDocPath(docPath: string): string {
  return docPath ? `${docPath}.md` : "index.md";
}

function docUrlFromDocPath(docPath: string): string {
  return docPath ? `${DOCS_ORIGIN}/${docPath}/` : `${DOCS_ORIGIN}/`;
}

function mdUrlFromDocPath(docPath: string): string {
  return `${DOCS_ORIGIN}/${mdPathFromDocPath(docPath)}`;
}

function cleanMarkdownBody(body: string): string {
  const lines = body.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (/^(import|export)\s.+from\s+["'][^"']+["'];?$/.test(trimmed)) {
      return false;
    }
    if (/^<\/?[A-Z][A-Za-z0-9]*(\s[^>]*)?>$/.test(trimmed)) {
      return false;
    }
    return true;
  });

  let inFencedCode = false;
  const cleaned = filtered.map((line) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("```")) {
      inFencedCode = !inFencedCode;
      return line;
    }
    if (!inFencedCode && /^\s{4,}\S/.test(line)) {
      return line.trimStart();
    }
    return line;
  });

  return cleaned.join("\n").trim();
}

export async function getDocsPages(): Promise<DocsPage[]> {
  const entries = await getCollection("docs");
  const pages: DocsPage[] = entries.map((entry) => {
    const docPath = normalizeDocPath(entry.id);
    return {
      title: entry.data.title,
      description: entry.data.description,
      docPath,
      mdPath: mdPathFromDocPath(docPath),
      docUrl: docUrlFromDocPath(docPath),
      mdUrl: mdUrlFromDocPath(docPath),
      body: cleanMarkdownBody(entry.body),
    };
  });

  pages.sort((a, b) => {
    if (a.docPath === "" && b.docPath !== "") return -1;
    if (b.docPath === "" && a.docPath !== "") return 1;
    return a.docPath.localeCompare(b.docPath);
  });

  return pages;
}

export function toMarkdownDocument(
  page: Pick<DocsPage, "title" | "description" | "docUrl" | "body">,
): string {
  const lines = [`# ${page.title}`, "", `Source: ${page.docUrl}`];

  if (page.description) {
    lines.push("", `> ${page.description.trim()}`);
  }

  if (page.body) {
    lines.push("", page.body.trim());
  }

  lines.push("");
  return lines.join("\n");
}
