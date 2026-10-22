# Static-public candidate verification

Date: September 24, 2026

Scope: local package-candidate and protected preview verification only. No production repository file, public alias, Trackinghaus production resource, commit, push, release, or deployment was changed.

## Candidate under test

- Package: `@mxpf/write-placid-core` 1.5.0
- Core commit: `116e1bcdd1677598bc8b262adf7306916c31b36a`
- Tarball SHA-256: `73df8a5055b1aa5acf5c849009309abbeaf4a378757dfc896160da7ff5897841`
- Protected preview: `https://thinkinghaus-static-public-candidate.vercel.app`
- Preview deployment: `dpl_4YJC1f1JSdHLZLGiG4pVbsxRRfKG`
- Staging tracker site: `thinkinghaus-low-js-staging`
- Staging collector: `https://trackinghaus.vercel.app/api/collect`

The production export retains the existing production tracker URL, site key, and collector exactly. Only the disposable staging copy rewrites them to the isolated staging contract.

## Build and structural verification

- `npm run build:pages`: pass
- static-public build: pass, 17 HTML files / 49 files total
- static-public verifier: pass with no failures
- rendered HTML tests: 25/25 pass against the anticipated 1.5.0 dependency
- typecheck: pass
- production dependency audit: pass, zero vulnerabilities
- lint excluding generated candidate output: pass
- semantic content, JSON-LD, canonical metadata, RSS, aliases, ordinary scripts, captions, images, and asset hashes are preserved by file-level comparison
- framework runtime/modulepreloads/RSC payloads are absent from the candidate
- production output raw size falls from 1,884,128 to 785,384 bytes: 1,098,744 bytes / 58.3% smaller

Generated candidate output must be excluded from the normal lint path when the instance adopts the capability.

## Hosted browser verification

The protected preview rendered successfully in the Codex in-app Chromium browser.

- synchronous first-document shell: `#1a1814` and `color-scheme: dark`
- no framework script detected
- homepage to article and repeated back/forward navigation: pass, no console warnings or errors
- extensionless routes and legacy alias redirect: pass
- desktop article layout: pass
- mobile 390 x 844: 342px article/image width, no horizontal overflow, existing footer wrapping preserved
- 2px scroll progress and sticky desktop brand styles preserved
- author mode via `#edit`: pass; the edit action is shown with the correct slug/title link
- article social metadata uses the article image when supplied; the Zelda article points both Open Graph and Twitter image metadata to `/images/zelda-cave-line-drawing.webp`
- typography guard active; ordinary inter-word hyphens become non-breaking hyphens
- article asset inventory: one stylesheet, two licensed fonts, one image, five small scripts including the remote tracker and enhancements, and one isolated collection beacon
- staging tracker contract observed in the rendered page and a collection beacon observed; no production tracker endpoint was used by the preview

Representative static sizes before transport compression:

- homepage HTML: 5,388 bytes; gzip estimate 1,639 bytes
- Zelda article HTML: 7,900 bytes; gzip estimate 2,668 bytes
- article CSS: 8,908 bytes; gzip estimate 2,415 bytes
- regular font: 34,893 bytes
- italic font: 35,853 bytes
- Zelda article image: 81,384 bytes
- all first-party enhancement modules plus author mode: 8,696 raw bytes; about 3,093 bytes as independent gzip estimates

These are local artifact/gzip estimates, not CDN transfer measurements. The hosted browser evidence confirms which resources load, but the available protected-browser instrumentation did not expose authoritative encoded transfer bytes.

## Graceful behavior

- No-JavaScript reading is supported structurally: complete article and homepage content, links, images, captions, metadata, and CSS are present in the delivered HTML; analytics and enhancements alone are absent without JavaScript.
- Reduced motion is supported by both the synchronous transition opt-in and instance CSS: cross-document transitions, image fades, link/date transitions, and footer motion are suppressed; content remains visible.
- Enhancement failures are non-blocking because the static document contains the complete reading experience before enhancement modules execute.

## Remaining boundary

- Physical Safari remains untested because its existing automation setting is disabled and was not changed.
- Actual Vivaldi is unavailable to the automation tools; the user manually confirmed the earlier minimal early-canvas control works in Vivaldi.
- Before production adoption, the core candidate must be published as an immutable release and Thinkinghaus must pin that release plus integrity. The local tarball path must never become a production dependency.
- Thinkinghaus should adopt only configuration and build wiring. Visual CSS, content, metadata, author mode, and the exact production Trackinghaus contract remain instance-owned.

## Recommendation

The candidate is ready for the core owner to release, subject to their review. After an immutable release exists, Thinkinghaus can prepare a small adoption commit, rerun the same checks, and request separate approval before production deployment.
