# Thinkinghaus

Thinkinghaus is a small home for essays, observations, and fragments by Max Pfennighaus.

- Live site: [thinking.haus](https://thinking.haus)
- Repository: [github.com/mxpf/thinkinghaus](https://github.com/mxpf/thinkinghaus)

This document is the operator’s manual: where things live, how to add or revise an essay, how to preview changes, and how to publish them without disturbing the site’s deliberately simple design.

## The basic idea

Thinkinghaus is a static site. There is no CMS or database to maintain. The essays live directly in the code, the site is generated as a set of HTML files, and GitHub Pages serves those files at `thinking.haus`.

There are two important branches:

- `main` contains the source—the writing, design, and site code.
- `gh-pages` contains the generated site that readers actually visit.

A change is not fully published until it has been committed to `main`, built, and copied to `gh-pages`.

## Where everything lives

| What | File |
| --- | --- |
| All essays and article metadata | `app/posts.ts` |
| Essay list and homepage structure | `app/page.tsx` |
| Individual essay page | `app/[slug]/page.tsx` |
| Typography, spacing, and responsive design | `app/globals.css` |
| Footer and contact link | `app/Footer.tsx` |
| Site title and metadata | `app/layout.tsx` |
| Social sharing image | `public/og.png` |
| Browser icon | `public/favicon.svg` |
| Custom-domain marker | `public/CNAME` |

Most routine work happens in `app/posts.ts`.

## Add an essay

Open `app/posts.ts`. Each essay is an object inside the `posts` list:

```ts
{
  title: "An Essay Title",
  slug: "an-essay-title",
  date: "August 6, 2026",
  readingTime: "3 minutes",
  paragraphs: [
    "The first paragraph.",
    "The second paragraph.",
  ],
}
```

Add new essays at the top of the list so the newest writing appears first.

The `slug` becomes the page address. Use lowercase letters and hyphens, with no spaces or punctuation. Once an essay is published, avoid changing its slug; doing so breaks old links.

Each item in `paragraphs` becomes its own paragraph. Short fragments are welcome. They are part of the voice of the site, not a formatting problem to fix.

If an essay refers to another work, an optional source link can be added:

```ts
source: {
  label: "Read the original piece",
  href: "https://example.com",
},
```

Dates and reading times are written manually. Reading time does not need to be scientifically exact; it is a small courtesy to the reader.

## Revise an essay

Find the essay by its title or slug in `app/posts.ts` and edit its paragraphs in place.

Keep the existing title, slug, and date unless there is a reason to change them. A revised essay does not need to pretend it was newly published.

The writing tends to work best when it remains:

- personal rather than universal;
- observant rather than declarative;
- plainspoken, with room for a poetic turn;
- useful without becoming instructional;
- comfortable with fragments, uncertainty, and small discoveries.

This is a sensibility, not a formula. The shape should follow the thought.

## Preview locally

The project requires Node.js 22.13 or newer.

Install the project once:

```bash
npm install
```

Start the local site:

```bash
npm run dev
```

Open the local address shown in the terminal, usually `http://localhost:3000`.

Before publishing, check:

- the homepage title, date, and reading time;
- the complete essay on desktop and a narrow phone-sized window;
- paragraph spacing and any source link;
- spelling, punctuation, and accidental straight quotation marks;
- that older essays still open normally.

Stop the local site with `Control-C`.

## Validate a change

Run the normal production build:

```bash
npm run build
```

Run the GitHub Pages build:

```bash
npm run build:pages
```

The second command creates the publishable site in `dist/client`.

For a writing-only change, these builds are the meaningful checks. For a structural or styling change, also inspect the site visually at desktop and mobile widths.

## Publish

First, save the source change to `main`:

```bash
git add app/posts.ts
git commit -m "Add essay title"
git push github main
```

Use the actual files you changed in the `git add` command. Do not use `git add -A` unless every local change belongs in the same update.

Then generate the static site:

```bash
npm run build:pages
```

Create a temporary checkout of the publishing branch:

```bash
git fetch github gh-pages
git worktree add --detach ../thinkinghaus-publish github/gh-pages
```

Copy the new build into it:

```bash
rsync -a --delete --exclude .git dist/client/ ../thinkinghaus-publish/
```

Publish the generated files:

```bash
git -C ../thinkinghaus-publish add -A
git -C ../thinkinghaus-publish commit -m "Publish site"
git -C ../thinkinghaus-publish push github HEAD:gh-pages
```

When the push succeeds, remove the temporary checkout:

```bash
git worktree remove ../thinkinghaus-publish
```

GitHub Pages usually begins rebuilding within a few seconds. Visit [thinking.haus](https://thinking.haus) and open the changed essay after the build completes.

## The design rule

The site is intentionally spare: a two-column desktop layout, a single-column mobile layout, Untitled Sans, a quiet hierarchy, and almost no interface around the writing.

Before changing the design, ask whether the change helps someone find or read the essays. If it mainly makes the site feel more like a conventional blog, it is probably taking the site in the wrong direction.

When changing `app/globals.css`, check both wide and narrow screens. The empty space is part of the composition.

## Domain and hosting

The site is hosted by GitHub Pages from the `gh-pages` branch.

The apex domain uses GitHub Pages’ four `A` records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www.thinking.haus` is a `CNAME` pointing to `mxpf.github.io`.

The file `public/CNAME` must continue to contain:

```text
thinking.haus
```

Do not remove `public/CNAME` or `public/.nojekyll`. They are small files with important jobs: one preserves the custom domain and the other tells GitHub to serve the generated site as-is.

## Common problems

### The new essay is missing

The source may have been pushed to `main` without publishing the generated files to `gh-pages`. Run the GitHub Pages build and complete the publishing steps above.

### An essay opens locally but not on the live site

Confirm that its slug contains only lowercase letters and hyphens. Then check that a matching `.html` file exists in `dist/client` after `npm run build:pages`.

### The domain shows a GitHub error

Confirm that `CNAME` exists on the `gh-pages` branch and contains only `thinking.haus`. Then check the DNS records listed above. DNS changes can take time to reach every network.

### The site has reverted to the starter design

Make sure you are working in the standalone `thinkinghaus` repository, not the older portfolio project. The real homepage is `app/page.tsx`, and the real design is in `app/globals.css`.

### A publish worktree already exists

Inspect the active worktrees:

```bash
git worktree list
```

If `../thinkinghaus-publish` is listed and contains unfinished work, finish or preserve that work before removing it. Never delete a worktree blindly.

## A small operating principle

The site should remain easy to understand after a long absence.

Keep the writing in one place. Keep the publishing process explicit. Keep the design quiet enough that the essays can wander.
