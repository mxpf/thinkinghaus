import { parseInlineMarkdown } from "./inline-markdown";

export function InlineText({ text }: { text: string }) {
  return parseInlineMarkdown(text).map((token, index) => {
    if (token.type === "italic") {
      return <em key={index}><InlineText text={token.value} /></em>;
    }
    if (token.type === "link") {
      return (
        <a key={index} href={token.href} rel="noreferrer">
          <InlineText text={token.value} />
        </a>
      );
    }
    return token.value;
  });
}
