import type { APIRoute, GetStaticPaths } from "astro";
import { getDocsPages, toMarkdownDocument } from "../lib/docs-markdown";

type MarkdownPageProps = {
  markdown: string;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getDocsPages();

  return pages.map((page) => ({
    params: { slug: page.mdPath.replace(/\.md$/i, "") },
    props: { markdown: toMarkdownDocument(page) },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const { markdown } = props as MarkdownPageProps;
  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};
