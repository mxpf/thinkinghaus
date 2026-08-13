import type { ReactNode } from "react";
import { InlineText } from "./InlineText";
import { stripInlineMarkdown } from "./inline-markdown";

function paragraphClassName(paragraph: string) {
  return /^[“‘"']/.test(stripInlineMarkdown(paragraph).trimStart())
    ? "optical-margin-fallback"
    : undefined;
}

export function ArticleBody({ paragraphs }: { paragraphs: readonly string[] }) {
  const blocks: ReactNode[] = [];

  for (let index = 0; index < paragraphs.length;) {
    const paragraph = paragraphs[index];
    if (/^\s*-\s+/.test(paragraph)) {
      const listStart = index;
      const items: ReactNode[] = [];
      while (index < paragraphs.length && /^\s*-\s+/.test(paragraphs[index])) {
        const item = paragraphs[index].replace(/^\s*-\s+/, "");
        items.push(<li key={`${index}-${item}`}><InlineText text={item} /></li>);
        index += 1;
      }
      blocks.push(<ul className="article-list" key={`list-${listStart}`}>{items}</ul>);
      continue;
    }

    blocks.push(
      <p className={paragraphClassName(paragraph)} key={`${index}-${paragraph}`}>
        <InlineText text={paragraph} />
      </p>,
    );
    index += 1;
  }

  return blocks;
}
