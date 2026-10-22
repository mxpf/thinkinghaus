# Low-tech discipline audit — thinking.haus

Date: September 24, 2026. This is an unpublished, read-only investigation. It changes no tracked production asset, source file, core package, or deployment.

## What Low-tech Magazine is useful for here

The durable lesson is measurement and deliberate constraint, not imitation. Low-tech Magazine generated static files, treated images as the dominant bandwidth variable, questioned custom fonts and third-party services, limited JavaScript to what a page needed, and made infrastructure visible. Its designers also state that dithering was meant to make compression visible—not simply to be the optimal codec for every image. The archived theme is historical reference, not a foundation to adopt.

Sources: [How to Build a Low-tech Website?](https://solar.lowtechmagazine.com/2018/09/how-to-build-a-low-tech-website/), [Solar Web Design](https://github.com/lowtechmag/solar/wiki/Solar-Web-Design), and the [archived `lowtechmag/solar` repository](https://github.com/lowtechmag/solar).

## Live measurements

Cold-cache browser measurements against the deployed site. Totals are transferred response-body bytes from HAR, after HTTP compression, excluding header/protocol overhead. Request counts include a zero-byte analytics collection response and duplicate favicon fetch where observed.

| Page | Requests | Total | HTML | CSS | JavaScript | Fonts | Images | Third party |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 24 | 175,522 B | 4,805 B | 2,777 B | 132,299 B | 35,063 B | 578 B | 1,428 B |
| `over-the-loop` | 28 | 268,613 B | 9,019 B | 2,746 B | 134,707 B | 71,150 B | 50,991 B | 1,428 B |
| `deep-minimal` | 28 | 260,923 B | 7,605 B | 2,582 B | 134,784 B | 71,123 B | 44,829 B | 1,428 B |

JavaScript is 75% of the homepage body transfer and about half of each illustrated article. The only third-party body transfer measured is Trackinghaus's 1,428-byte tracker; its collection response was zero bytes.

Live cache headers are currently `max-age=600` for HTML, hashed JavaScript, and images. Hashed immutable assets therefore receive the same ten-minute browser freshness window as HTML.

## Reading without JavaScript

Scripts were blocked at the browser network layer before navigation.

| Page | Successful transfers | Body transfer | Rendered text | Result |
| --- | ---: | ---: | ---: | --- |
| Homepage | 5 | 43,031 B | 471 characters | Titles, dates, links, brand, and footer remain readable and navigable. |
| `over-the-loop` | 7 | 133,759 B | 5,422 characters | Complete article, image, links, date, reading time, and footer remain present. |
| `deep-minimal` | 7 | 126,181 B | 3,361 characters | Complete article and 1254 × 1254 image remain present. |

The public reading contract does not depend on Studio, KDrive, D1, or a live Write Placid service. Content is already exported as static HTML. JavaScript supplies progressive behavior: hydration, typography guards, scroll progress, image opacity changes, end-of-scroll footer motion, author-mode activation, and analytics. With scripts blocked, content is intact, but article images stay at the CSS fallback opacity of 60% rather than reaching 100% on intersection; the progress line and motion enhancements do not operate; analytics and author mode do not run.

Evidence: `live/*.har`, `live/*-nojs.json`, and `live/*-nojs.png`.

## Build/source estimates (not live transfer)

The audited live/static-export baseline was 3,879,621 raw bytes across 87 files. Of that, images accounted for 2,478,243 raw bytes. At the time of that measurement, the unreferenced `public/images/deep-minimal-d76dc09e.png` alone was 1,990,432 bytes—80% of all exported image bytes and 51% of the entire raw export. It did not appear in the live page request trace, but it was copied into the deployment artifact.

Correction, September 25, 2026: the PNG had already been removed from production in commit `86aea3c` before the static-public v1.5 adoption. The canonical 44,062-byte WebP remains, the PNG is absent from both source and current export, and the earlier budget failure is historical rather than an unresolved production issue.

That PNG previously caused the article-image budget test to fail its 250 KB threshold while referenced. The canonical article now uses the 44,062-byte WebP. After the final KDrive/D1/deleted-document reference certification, the exact public orphan was removed in local, unpushed commit `86aea3ce1d937424beb809dde52e101038997b2b`; the canonical PNG remains preserved in KDrive. All 25 tests, lint, type-check, production audit and regenerated static-export checks pass. The commit is recoverable with `git revert 86aea3c` if needed and has not been deployed.

The generated HTML contains complete content, but each page also references the framework/hydration runtime. Current local export totals: 449,170 raw JS bytes (141,162 bytes when independently gzip-compressed), 17,596 raw CSS bytes, and 70,746 raw font bytes.

## Image prototype

Source preserved: the existing 1254 × 1254 `deep-minimal` illustration. Three unpublished derivatives are in `image-comparison/`.

| Treatment | Transfer candidate | Size | Visual result at ~553 px desktop / ~350 px mobile |
| --- | --- | ---: | --- |
| Current | `current.webp` | 44,062 B | Warm paper texture, clean linework, fully legible. |
| Four-level grayscale, Floyd–Steinberg | `dithered-fixed-4-gray.png` | 268,630 B | Linework remains legible, but the warm paper character is replaced by a visibly stippled field. At mobile size the drawing still reads, but the texture becomes a pattern. |
| More efficient original | `compressed-original-q70.webp` | 21,484 B | Essentially the same warm character and line legibility at both display sizes; minor paper-texture smoothing only under close inspection. |

For this illustration, dithering is an aesthetic statement and a bandwidth regression: 6.1× the current file and 12.5× the q70 WebP. Ordinary modern compression preserves the Thinkinghaus appearance while halving the current transfer. The result supports borrowing Low-tech Magazine's discipline, not automatically borrowing its image treatment.

Open `image-comparison/gallery.html` for the responsive side-by-side. The `*-553.png` and `*-350.png` files are lossless inspection renders only; their sizes are not proposed transfer sizes.

## Recommended boundary

### Shared Write Placid core

1. Add a publishing-time image policy: normalize dimensions, strip metadata, produce an efficient modern derivative, and fail or warn before an oversized source is published. Keep the canonical original preserved outside the public snapshot.
2. Make article rendering capable of a static-first/no-hydration output where client behavior is opt-in. Typography guards are deterministic and could be applied during generation rather than walking the rendered DOM.
3. Keep image behavior accessible without JavaScript: the baseline image should be fully visible; scrolling effects should enhance it, not repair opacity.
4. Expose asset-budget checks and orphan reporting as reusable publishing/audit facilities. Do not silently delete instance assets from core.

### Thinkinghaus instance

1. Remove the confirmed orphan PNG from the public snapshot through the canonical Studio/publishing boundary. This is content-asset maintenance, not a core change.
2. Decide which client enhancements are worth the 132–135 KB cold-page JavaScript cost. The strongest candidates to keep are the small scroll affordances; the framework-wide hydration cost is disproportionate to them.
3. Set long immutable cache lifetimes for content-hashed JS/CSS and versioned image assets while keeping HTML short-lived. This belongs in the Thinkinghaus hosting/deployment configuration unless core owns emitted cache metadata.
4. Keep the two licensed Untitled Sans files as an explicit aesthetic choice. They cost ~35 KB on the homepage and ~71 KB on articles using italics; removing them would change the current design and is not recommended from this audit alone.
5. Keep Trackinghaus as a separate policy decision. Its measured transfer is small; privacy, dependency, and collection behavior matter more than its 1.4 KB script weight.

## Priority order

1. **Low risk / ready for approval:** review/push the local Git-recoverable orphan-removal commit; separately add reusable orphan reporting.
2. **High leverage / shared core:** publishing-time image normalization and budgets.
3. **High leverage / architectural:** prototype static-first pages that do not ship React hydration unless a page opts into it.
4. **Low risk / instance hosting:** immutable caching for hashed/versioned assets.
5. **Optional visual exploration:** keep dithering as an editorially chosen treatment, not a default optimization.

## Unpublished static-first prototype

An isolated prototype is available in `static-first-prototype/`. It mechanically preserves the current exported HTML, CSS, fonts, content, links, metadata and image assets, removes framework/module scripts and RSC payloads, and sets the no-JavaScript image baseline to 100% opacity. It is not a proposed production implementation and has not been committed or deployed.

Browser verification found zero external scripts and the same rendered text/link/image counts as the live pages:

| Page | Requests | JavaScript requests | Local uncompressed body bytes | Rendered result |
| --- | ---: | ---: | ---: | --- |
| Homepage | 5 | 0 | 49,682 B | 471 text characters, 21 links |
| `over-the-loop` | 7 | 0 | 143,884 B | 5,422 text characters, 23 links, full-opacity 800 × 451 image |
| `deep-minimal` | 7 | 0 | 134,483 B | 3,360 text characters, 25 links, full-opacity 1254 × 1254 image |

These local byte totals are deliberately not compared directly to live transfer because the prototype server did not apply HTTP compression. The live script-blocked measurements above remain the defensible expected transfer baseline: 43,031 B, 133,759 B and 126,181 B respectively. Relative to the live JavaScript-enabled traces, that is a reduction of 132,491 B (75%) on the homepage, 134,854 B (50%) on `over-the-loop`, and 134,742 B (52%) on `deep-minimal`, plus 17–21 fewer successful requests.

Lost enhancements are the scroll-progress update, intersection-driven image fade, end-of-scroll footer motion, client-side typography mutation, author-mode activation and Trackinghaus execution. Preserved behavior includes the full reading experience, typography and licensed fonts, responsive layout, links, semantic content, metadata, static image visibility, CSS-only transitions and navigation. The prototype intentionally makes no production Trackinghaus policy change; it only demonstrates the consequence of shipping a non-hydrated reader.
