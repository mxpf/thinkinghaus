# Lower-JavaScript prototype v2

Status: unpublished experiment, built from Thinkinghaus commit `76175bcfaf6f473f50b582addcc3aebf2f592a10` and Write Placid core `v1.4.0`. Nothing here is committed, pushed, or deployed.

> Motion-parity qualification: the later timed audit in `MOTION-PARITY-REPORT.md` found that the prototype does not reproduce the incoming half of the forward cross-document View Transition in the local preview environment. The earlier “reproduce the tested behavior” language below is accurate for the explicitly sampled scroll, footer, progress, hover/focus, intro, reduced-motion, and fallback behaviors, but it should not be read as complete navigation-motion parity.

## Result

The public reader does not need React hydration or RSC navigation data to preserve the current reading experience. Static HTML, the current CSS/fonts/assets, and three small progressive scripts reproduce the tested behavior:

- typography guards, including future DOM mutations;
- the 2 px scroll-progress line;
- Write Placid `attachScrollFade` v1.4.0 with the current 0.6 → 1 at two-thirds visibility → 0.6 behavior;
- image captions, links, and responsive dimensions;
- article-footer reveal at the end of scrolling;
- private author-mode activation and Studio edit link;
- the exact Trackinghaus script, `data-site`, and collection endpoint contract.

The prototype removes only framework hydration/bootstrap modules, inline RSC payloads, `.rsc` files, and client-navigation machinery. Navigation becomes ordinary document navigation. Content, metadata, fonts, branding, imagery, CSS, and editorial decisions are unchanged.

## Comparable cold-cache measurement

Measurements used a fresh headless Chrome profile per page, cache disabled, the same 1440 × 1000 viewport, and Brotli for compressible local prototype assets. The Trackinghaus collection URL was blocked so the tests would not create analytics events. The external tracker body was measured separately with `curl` at 1,023 transferred bytes and added equally to both columns below because the headless harness blocked that cross-origin script body with ORB. Request counts include the attempted tracker request.

| Page | Production requests | Prototype requests | Production transfer | Prototype transfer | Transfer reduction | Production JS | Prototype JS | JS reduction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 23 | 9 | 175,429 B | 45,391 B | 74.1% | 132,046 B | 4,532 B | 96.6% |
| Over the loop | 25 | 9 | 267,898 B | 133,207 B | 50.3% | 134,752 B | 4,532 B | 96.6% |
| Deep minimal | 25 | 9 | 260,331 B | 126,135 B | 51.5% | 134,705 B | 4,532 B | 96.6% |

The article totals remain larger because the two licensed font files and the article image are intentionally preserved. The improvement is almost entirely the removal of React/framework JavaScript and RSC bootstrap data, not a change to imagery or typography.

Raw browser records, per-resource byte counts, failures, and state checks are in `static-first-v2-results/measurements.json`.

## Behavior verification

On both production and the prototype, the Deep minimal image produced the same sampled sequence:

- threshold position: opacity `1`;
- after image exit: opacity `0.6`;
- reverse scroll: opacity `1`;
- document end: opacity `0.6`, progress transform `1`, footer revealed.

Prototype-only resilience checks:

- JavaScript disabled: full article text and 25 links remain; image is visible at opacity `1`.
- reduced motion: image remains at opacity `1`; no fade or footer motion is armed.
- failed `IntersectionObserver` construction: image remains at opacity `1`; the rest of the enhancements continue.
- author activation with `#edit`: the private edit action becomes visible and receives its Studio URL.
- normal runs reported no runtime exceptions.

The Trackinghaus markup is byte-for-byte the current deployed contract, and `tracker.js` responds `200 application/javascript`; only collection was intentionally blocked during measurement.

## Visual previews

- `static-first-v2-results/prototype-home.png`
- `static-first-v2-results/prototype-deep-minimal.png`
- `static-first-v2-results/prototype-home-mobile.png`
- `static-first-v2-results/prototype-deep-minimal-mobile.png`

The browsable local output is `static-first-prototype-v2/`. It is generated mechanically by `build-static-first-v2.mjs`; the browser/measurement harness is `measure-static-first-v2.mjs`.

## Dependency boundary

Required by the public reader:

- generated semantic HTML and metadata;
- current Thinkinghaus CSS, licensed fonts, images, RSS, sitemap, redirects, and static support files;
- instance-owned author-mode and Trackinghaus configuration;
- small progressive behaviors, with the scroll fade sourced directly from immutable Write Placid core v1.4.0.

Not required for public reading after the build:

- React and React DOM in the browser;
- Vinext/Next navigation runtime;
- RSC payloads and route caches;
- framework client chunks and module-preload graph.

React/Vinext can remain a build-time authoring implementation. The experiment does not argue for replacing the source application; it argues for a lighter publication artifact.

## Tradeoffs and recommended adoption sequence

1. Keep the current production site unchanged until static-first export is a supported build mode with regression coverage. The prototype is post-processing evidence, not production architecture.
2. Ask the Write Placid owner to define a supported static-public enhancement bundle or export contract. The scroll fade is already shared correctly; typography/progress/footer helpers should not become permanent instance-owned duplicates if other Write Placid sites need them.
3. Keep Thinkinghaus-specific configuration in this repository: Trackinghaus site key/endpoints, author-mode Studio URL, page markup, styling, and feature choices.
4. Add a production build gate comparing semantic HTML, metadata, links, image/caption markup, no-JS visibility, reduced motion, author mode, and analytics contract before any deployment experiment.
5. If that gate passes, trial the static artifact on an unpublished preview host and compare full-page navigation feel against the current hydrated client navigation. That is the only meaningful user-facing tradeoff found here.
6. Do not bundle image optimization, dithering, content changes, Trackinghaus changes, or font changes into this decision. They are independent.

## Recommendation

Proceed to a formal static-public export capability in Write Placid, then adopt it immutably in Thinkinghaus. The evidence supports removing framework hydration from the published reader while preserving the existing appearance and small purposeful behaviors. Do not ship this post-processed artifact directly.
