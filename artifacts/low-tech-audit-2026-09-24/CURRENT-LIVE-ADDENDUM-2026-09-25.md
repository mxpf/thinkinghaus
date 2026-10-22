# Current live addendum — September 25, 2026

This unpublished addendum rechecks the deployed static-public reader after the original September 24 audit. It changes no tracked source, production asset, shared core, Trackinghaus configuration, or deployment.

## Measurement boundary

- Live evidence: cold `curl --compressed` response-body bytes from `https://thinking.haus`, current response headers, and fresh headless Chrome captures with JavaScript disabled.
- Request totals below are the deterministic page resource graph plus the zero-body Trackinghaus collection request. Header and protocol overhead are excluded.
- Build/source estimate: the current local `dist/public` snapshot. It includes the working tree's unpublished custom 404 work, so it is not represented as an exact byte-for-byte copy of production.

## Current deployed transfer

| Page | Requests with JS | Total with JS | HTML | CSS | JavaScript | Fonts | Images incl. favicon | Third party | Script-blocked body transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 8 | 41,017 B | 1,641 B | 2,426 B | 1,842 B | 34,893 B | 215 B | 1,001 B | 39,175 B |
| `over-the-loop` | 10 | 130,145 B | 4,651 B | 2,426 B | 1,842 B | 70,746 B | 50,480 B | 1,001 B | 128,303 B |
| `deep-minimal` | 10 | 122,766 B | 3,475 B | 2,426 B | 1,842 B | 70,746 B | 44,277 B | 1,001 B | 120,924 B |

The three script bodies are the 656-byte author-mode helper, 185-byte Write Placid enhancement loader, and 1,001-byte Trackinghaus tracker. The collection response has no body. There is no React/framework hydration runtime in the current live reader.

All tested live assets still return `Cache-Control: max-age=600`, including the hashed CSS, fonts, enhancement module, and versioned article image. That is now the clearest low-risk delivery inefficiency.

## Reading without JavaScript

Fresh 390 × 844 Chrome captures with JavaScript disabled confirm:

- the homepage retains every title, link, brand, and footer;
- `over-the-loop` retains the heading, date, reading time, links, quote, and article text;
- `deep-minimal` retains the article and displays its illustration at full opacity.

The live reader no longer needs client execution to repair image visibility. JavaScript is progressive only: author mode, Trackinghaus collection, and small motion/typography enhancements.

Evidence: `current-live-2026-09-25/home-nojs.png`, `article-nojs.png`, and `image-nojs.png`.

## Current build/source estimate

The local static-public snapshot is 795,172 raw bytes across 51 files: 142,419 B HTML, 18,524 B CSS, 8,931 B JavaScript, 70,746 B fonts, and 477,726 B images. These are uncompressed artifact sizes, not live transfer.

The reported 1,990,432-byte `deep-minimal-d76dc09e.png` and its 250 KB article-image budget failure were real historical findings. The PNG is absent from current source, current export, and current production as of commit `86aea3c`; the published article uses the 44,062-byte WebP. The historical failure is therefore resolved, not an active risk.

## Image experiment

The preserved 1254 × 1254 source was compared without altering it:

| Treatment | Candidate size | Result |
| --- | ---: | --- |
| Current WebP | 44,062 B | Warm paper texture and clean linework remain fully legible. |
| Four-level grayscale Floyd–Steinberg PNG | 268,630 B | Legible, but visibly stippled and 6.1× heavier than current. |
| WebP quality 70 | 21,484 B | Warm character and linework remain intact at ~553 px desktop and ~350 px mobile; about 51% smaller than current. |

For this illustration, limited-palette dithering is an aesthetic treatment and a bandwidth regression. Efficient modern compression wins without borrowing Low-tech Magazine's appearance.

Preview: `image-comparison/gallery.html`; stills: `comparison-wide.png` and `comparison-mobile.png`.

## Studio / Write Placid boundary

Public reading does **not** depend on a live Studio or Write Placid service. Studio is the authoring source; the public repository consumes the pinned `@mxpf/write-placid-core` package at build time and publishes complete static HTML. The only shipped Write Placid client surface is a 185-byte enhancement loader plus its small same-origin module. KDrive, D1, and Studio are not in the reading request path.

### Shared-core actions

1. Add deterministic publishing-time image normalization: bounded dimensions, metadata stripping, modern derivatives, and warnings/failures before oversized assets enter a public snapshot.
2. Add reusable asset-budget and orphan reporting. Deletion decisions remain instance-owned.
3. Keep static-public/no-hydration as the default reader contract and require enhancements to preserve complete no-JS content.

### Thinkinghaus-instance actions

1. Adopt long immutable caching for hashed CSS and versioned images/fonts/modules while keeping HTML short-lived.
2. Trial the 21,484-byte compressed derivative only through the normal Studio publishing path if its close visual review is accepted; do not default to dithering.
3. Keep the licensed Untitled Sans files as an explicit design cost: ~35 KB on the homepage and ~71 KB on articles that use roman and italic.
4. Keep the existing 250 KB article-image test and add an instance-level whole-page budget once core exposes the reusable facility.

No Trackinghaus change is recommended from this audit. Its 1,001-byte transfer is minor, and changing it would be a separate privacy/product decision.

## Priority

1. Cache policy for immutable/versioned assets — low visual risk, immediate repeat-visit benefit.
2. Shared publishing-time image normalization and budget/orphan reporting — highest preventive value.
3. Optional per-image compression review through Studio — measurable savings while preserving appearance.
4. Dithering only as an editorial visual choice, never as the default optimization.
