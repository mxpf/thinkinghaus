# Thinkinghaus

A deliberately quiet publishing system for essays, observations, and fragments by designer and creative director Max Pfennighaus.

**[Read Thinkinghaus](https://thinking.haus)**

![Thinkinghaus article index](docs/preview.png)

Thinkinghaus began as an experiment in using AI as a genuine writing collaborator—not simply to generate text, but to question, connect, criticize, and help articulate ideas that were still taking shape. The publishing system grew around that practice. It keeps the public site spare while giving the private Studio enough structure for drafting, revision, links, typography, publishing, and a small `/now` archive.

## How it works

Published writing lives as Markdown in `content/`. The private Studio keeps drafts in its own database and writes a document here only when it is published. A push to `main` rebuilds the static site and updates GitHub Pages.

```text
content/posts/   essays and fragments
content/pages/   About, AI, and Links
content/now/     current and archived /now entries
app/             public pages and presentation
scripts/         Markdown parsing and static publishing
integrations/    private chat-to-Studio draft bridge
```

Generated TypeScript modules, RSS, and the sitemap are intentionally not tracked. Development and production builds recreate them from the Markdown source.

## Content conventions

Posts and pages use a small Markdown subset: paragraphs, `##` subheads, block quotes, inline italics and links, and bulleted or numbered lists. Numbered lists use standard Markdown such as `1. First item`.

Posts may include an optional `updatedAt` frontmatter field in ISO timestamp or `YYYY-MM-DD` form. Add it only when an already-published post is revised; the public site then shows a quiet “Last edited” note. Leave it out for an initial publication and for posts that have not been revised.

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

## Publishing

Normal writing and publishing happens in Studio. The public repository remains the canonical record of published content, while Studio’s private database remains the canonical record of drafts.

The custom domain depends on `public/CNAME`. GitHub Pages also requires `.nojekyll`, which the publishing workflow adds to the generated branch.

## Webmentions

Thinkinghaus advertises a Webmention endpoint and refreshes public mentions during publication and once each day. The refresh is deliberately build-time rather than client-side: readers never contact Webmention.io, and a temporary service failure cannot break a page or erase the last good cache.

Only an external source link and a short label are retained. Remote content, photos, private mentions, unsafe URLs, and links back to Thinkinghaus itself are excluded. A post shows a quiet “Mentioned by” list only when at least one real mention exists.

To refresh the local cache manually:

```bash
npm run refresh:webmentions
```

## Security and dependency updates

The publishing workflow blocks deployment when a high-severity production dependency vulnerability is reported. A separate weekly workflow checks the complete development toolchain without blocking publication, and Dependabot proposes dependency and GitHub Actions updates for review.

Vinext currently depends on an `image-size` release with denial-of-service advisories in its ICNS, JXL, and HEIF parsers. In Thinkinghaus that package is development-only and reads committed metadata images during a trusted static build; it is not exposed to visitors or Studio uploads. Vinext is pinned until a compatible patched release can be reviewed and tested. See [SECURITY.md](SECURITY.md) for the boundary that must be preserved if image uploads are added later.

## Design principle

The public site is intentionally spare. Before adding an interface element, ask whether it helps someone find or read the writing. The Studio is a workbench; the public site is the quiet room beyond it.

## Rights

The repository is public so the publishing system and its development can be inspected. Unless otherwise noted, the essays, site content, identity, and original assets remain © Max Pfennighaus and are not offered for reuse.
