import Link from "next/link";
import { InternalLinkPreview } from "./InternalLinkPreview";
import { parseInlineMarkdown } from "./inline-markdown";
import { getLinkPreview } from "./posts";

const staticExport = process.env.STATIC_EXPORT === "1";

export function InlineText({ text }: { text: string }) {
  return parseInlineMarkdown(text).map((token, index) => {
    if (token.type === "italic") {
      return <em key={index}><InlineText text={token.value} /></em>;
    }
    if (token.type === "link") {
      const preview = getLinkPreview(token.href);
      if (preview) {
        return (
          <InternalLinkPreview key={index} href={token.href} preview={preview}>
            <InlineText text={token.value} />
          </InternalLinkPreview>
        );
      }
      if (token.href.startsWith("/")) {
        if (staticExport) {
          return (
            <a key={index} href={token.href}>
              <InlineText text={token.value} />
            </a>
          );
        }
        return (
          <Link key={index} href={token.href}>
            <InlineText text={token.value} />
          </Link>
        );
      }
      return (
        <a key={index} href={token.href} rel="noreferrer">
          <InlineText text={token.value} />
        </a>
      );
    }
    return token.value;
  });
}
