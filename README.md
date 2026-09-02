# thinking.haus

thinking.haus is where I follow ideas about attention, creative work, tools, systems, and the occasional strange thing. This repository is the machinery behind it.

**[Read thinking.haus](https://thinking.haus)**

![thinking.haus article index](docs/preview.png)

The site grew out of using AI as a writing collaborator: not simply to generate text, but to question, connect, criticize, and help me articulate ideas that were still taking shape. The publishing system grew around that practice. The public side stays spare. The private Studio holds the messier work of drafting and revision until something is ready to leave the room.

## What lives here

Published writing lives as Markdown in [`content/`](content/). Drafts stay in the private Studio and arrive here only when they are published. A push to [`main`](https://github.com/mxpf/thinkinghaus/tree/main) rebuilds the static site and updates [GitHub Pages](https://pages.github.com/).

```text
content/posts/   essays and fragments
content/pages/   About, AI, and Links
content/now/     current and archived /now entries
app/             public pages and presentation
lib/             shared Markdown interpretation
scripts/         content loading and static publishing
integrations/    private chat-to-Studio draft bridge
site-config.mjs  public identity and service endpoints
```

Generated TypeScript modules, RSS, and the sitemap are not tracked. Development and production builds recreate them from the Markdown source.

The site and its posts share the social card at [`public/og.png`](public/og.png).

## Writing conventions

Posts and pages use a small Markdown subset: paragraphs, `##` subheads, block quotes, inline italics and links, and bulleted or numbered lists. Numbered lists use the ordinary `1. First item` form.

An already-published post can carry an `updatedAt` frontmatter field, either as an ISO timestamp or `YYYY-MM-DD`. That date produces a quiet “Last edited” note at the end of the piece. New and untouched posts leave it out.

## Local checks

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run audit:production
```

The static production path is:

```bash
npm run build:pages
node scripts/verify-static-export.mjs
```

To build a local staging version that includes drafts:

```bash
npm run build:staging
```

## From draft to public

Writing and publishing normally happen in Studio. Its private database is the record of drafts; this public repository is the record of what has been published.

The custom domain depends on [`public/CNAME`](public/CNAME). The [publishing workflow](.github/workflows/publish.yml) adds the `.nojekyll` file GitHub Pages needs to the generated branch.

## Webmentions

thinking.haus advertises a [Webmention](https://www.w3.org/TR/webmention/) endpoint and checks for public mentions during publication and once each day. This happens at build time rather than in a reader’s browser. Readers never contact [Webmention.io](https://webmention.io/), and a temporary service failure cannot break a page or erase the last good cache.

Only an external source link and a short label are kept. Remote content, photos, private mentions, unsafe URLs, and links back to thinking.haus itself are left out. A post shows “Mentioned by” only when there is something real to show.

To refresh the local cache manually:

```bash
npm run refresh:webmentions
```

## Security and dependency updates

The publishing workflow stops a deployment when a high-severity production dependency vulnerability is reported. A separate weekly check looks at the complete development toolchain without blocking publication. [Dependabot](https://docs.github.com/en/code-security/dependabot) proposes dependency and GitHub Actions updates for review.

[Vinext](https://github.com/cloudflare/vinext) currently depends on an `image-size` release with denial-of-service advisories in its ICNS, JXL, and HEIF parsers. Here, that package is development-only. It reads committed metadata images during a trusted static build and is not exposed to visitors or Studio uploads. Vinext remains pinned until a compatible patched release can be reviewed and tested. [SECURITY.md](SECURITY.md) describes the boundary that must remain in place if image uploads are added later.

## The useful constraint

The public site is intentionally spare. Before adding something, I ask whether it helps someone find or read the writing. The Studio is the workbench. The public site is the quiet room beyond it.

## Rights

The repository is public so the publishing system and its development can be inspected. Unless otherwise noted, the essays, site content, identity, and original assets remain © Max Pfennighaus and are not offered for reuse.
