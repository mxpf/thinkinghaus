# Thinkinghaus

Thinkinghaus is a small home for essays, observations, and fragments by Max Pfennighaus.

- Live site: [thinking.haus](https://thinking.haus)
- Repository: [github.com/mxpf/thinkinghaus](https://github.com/mxpf/thinkinghaus)

This is the operator’s manual for the site and the private local Publishing Studio shared with Max’s portfolio.

## Everyday use

Open **Publishing Studio** from the Applications folder on the Mac.

The studio opens in a browser, but it runs only on this computer. It is not part of either public website. Use the switch at the top to move between **Thinkinghaus** and **Portfolio**.

The left side contains drafts, published essays, and recent publishing history. The center is the writing space. The right side shows the essay in the typography and proportions of the live site.

### Start something new

1. Choose **New piece**.
2. Give it a title and begin writing.
3. Leave the studio open or close it whenever you like.

The title creates the page address automatically. The date and reading time are also handled automatically.

A new piece remains a private draft until **Publish** is chosen. Drafts can be fragments, notes, or unfinished essays. They do not need to justify themselves by becoming public.

### Add italics or an inline link

Select words in the writing area, then choose **Italic** or **Link** from the small formatting bar.

Italic text uses the actual Untitled Sans Regular Italic face. **Command-I** also applies italics when the cursor is in the writing area.

For a link, the selected words become the link text. Add the destination in the dialog and choose **Add link**. The live preview shows both styles before publishing.

The Markdown remains visible in the writing file—`*italic text*` and `[linked text](https://example.com)`—so the essays stay portable and understandable outside the studio.

### Revise something

Choose any essay from the Published list and edit it directly. Changes save locally while you work, but the live essay remains untouched until **Publish** is chosen.

Published page addresses stay stable even if a title changes, so old links continue to work.

### Add a source

Open **Source or further reading** below the writing area. Add the link text and web address. Both fields are required for the source to appear.

### Publish

Choose **Publish** and confirm the essay. The studio will:

1. save the latest writing;
2. check that the site can be built safely;
3. preserve the source on GitHub;
4. update the public GitHub Pages site;
5. report when the process is complete.

The button deliberately pauses if unrelated site files have unfinished changes. This prevents a writing update from quietly publishing experimental design or code.

The **View live** link opens the public site. GitHub may need a short moment after publishing before the new version appears everywhere.

## Portfolio projects

Choose **Portfolio** at the top of Publishing Studio, then select any project from the left side. The center column contains the project title, introductory text, and every media caption. The right side previews the project text, images, and caption sequence.

Changes save into the portfolio’s existing project files while you work. Empty captions stay empty, which is useful when an image is self-explanatory. Choose **Publish** only when the project is ready to update `maxpfennig.haus`.

This first version deliberately does not add, replace, crop, or reorder images. Those operations remain in the portfolio project itself so the publishing interface stays focused and safe.

## Writing sensibility

The writing tends to work best when it remains:

- personal rather than universal;
- observant rather than declarative;
- plainspoken, with room for a poetic turn;
- useful without becoming instructional;
- comfortable with fragments, uncertainty, and small discoveries.

This is a sensibility, not a formula. The shape should follow the thought.

## Design principle

The public site is intentionally spare: a two-column desktop layout, a single-column mobile layout, Untitled Sans, a quiet hierarchy, and almost no interface around the writing.

Before changing the public design, ask whether the change helps someone find or read the essays. If it mainly makes the site feel more like a conventional blog, it may be taking the site in the wrong direction.

The studio is a workbench. The public site is the quiet room beyond it.

## How it is arranged

The essays are plain Markdown files in `content/posts`. Each essay has a small block of information at the top followed by the writing:

```md
---
title: "An Essay Title"
slug: an-essay-title
date: 2026-08-06
status: draft
---

Begin anywhere.
```

The studio edits these files and generates the data used by the public site. The writing is never locked inside a database or a proprietary content system.

| What | Location |
| --- | --- |
| Essays and drafts | `content/posts` |
| Shared local studio | `studio` |
| Studio’s local service | `scripts/studio-server.mjs` |
| Public article list | `app/page.tsx` |
| Public article page | `app/[slug]/page.tsx` |
| Public typography and layout | `app/globals.css` |
| Social sharing image | `public/og.png` |
| Custom domain marker | `public/CNAME` |

`app/generated-posts.ts` is produced automatically from the Markdown files. Do not edit it by hand.

## Publishing and recovery

The `main` branch contains the writing, design, and source. The `gh-pages` branch contains the generated site readers visit.

The studio keeps those branches in sync. If publishing is interrupted, the writing remains saved locally. Reopen the studio and publish again after resolving the message it provides.

The custom domain depends on two files that should remain in `public`:

- `CNAME` preserves `thinking.haus`;
- `.nojekyll` tells GitHub to serve the generated files as-is.

The domain’s apex uses GitHub Pages’ four `A` records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

`www.thinking.haus` is a `CNAME` pointing to `mxpf.github.io`.

## If the studio does not open

Open **Publishing Studio** again. If the local service is already running, the launcher simply returns to it.

The studio records technical details in `/tmp/thinkinghaus-studio.log`. That file is intended for troubleshooting; normal writing and publishing should not require opening it.

## A small operating principle

The site should remain easy to understand after a long absence.

Keep the writing in one place. Keep publishing explicit. Keep the design quiet enough that the essays can wander.
