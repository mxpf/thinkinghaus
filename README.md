# Thinkinghaus

A small home for essays, observations, and fragments by Max Pfennighaus.

- Public site: [thinking.haus](https://thinking.haus)
- Private editor: [Thinkinghaus Studio](https://thinkinghaus-studio.maxpfennighaus.workers.dev)

## How it works

Writing lives as Markdown in `content/`. Thinkinghaus Studio keeps private drafts in its own database and writes a document here only when it is published. A push to `main` runs the GitHub workflow that rebuilds the public site and updates `gh-pages`.

```text
content/posts/   essays and fragments
content/pages/   About, AI, and Links
content/now/     current and archived /now entries
app/             public pages and presentation
scripts/         Markdown parsing and static publishing
integrations/    private chat-to-Studio draft bridge
```

Generated TypeScript modules, RSS, and the sitemap are intentionally not tracked. Development and production builds recreate them from the Markdown source.

## Local checks

```bash
npm install
npm run dev
npm run lint
npm test
```

The static production path is:

```bash
npm run build:pages
node scripts/verify-static-export.mjs
```

## Publishing

Normal writing and publishing happens in Studio. The public repository remains the canonical record of published content, while Studio’s private database remains the canonical record of drafts.

The custom domain depends on `public/CNAME`. GitHub Pages also requires `.nojekyll`, which the publishing workflow adds to the generated branch.

## Design principle

The public site is intentionally spare. Before adding an interface element, ask whether it helps someone find or read the writing. The Studio is a workbench; the public site is the quiet room beyond it.
