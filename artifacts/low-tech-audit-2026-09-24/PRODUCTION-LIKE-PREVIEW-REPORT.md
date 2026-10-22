# Production-like static-first preview verification

Date: September 24, 2026  
Scope: unpublished artifact only; no production, Write Placid core, Trackinghaus, commit, push, or deployment changes.

## Result

**Pass, with one preview-only condition.** The static-first export reproduces the complete forward cross-document View Transition on desktop and mobile when the Trackinghaus script is omitted from the local preview. The live production site continues to pass with the tracker present. No application or shared-core correction is indicated.

Preview: [http://127.0.0.1:4315/preview/](http://127.0.0.1:4315/preview/)

The preview server is local to this task, uses production-like cache/content headers, rewrites internal links within the preview namespace, and deliberately removes the tracker tag so it cannot emit analytics events. Stop the running preview by terminating its local server process; restart it with `node artifacts/low-tech-audit-2026-09-24/production-like-preview-server.mjs`.

## Evidence

Chrome 153.0.8010.53, fresh isolated profiles, cache disabled, desktop width 1440 and mobile width 390:

| Case | Protocol | `pageswap.viewTransition` | `pagereveal.viewTransition` | Result |
| --- | --- | ---: | ---: | --- |
| Live production | HTTP/2 | true | true | Pass |
| Unmodified prototype | HTTP/1.0 | true | false | Fail |
| Unmodified prototype, production-like headers | HTTP/1.1 | true | false | Fail |
| Unmodified prototype, local TLS | HTTP/2 | true | false | Fail |
| Minimal control | HTTP/1.1 + HTTP/2 | true | true | Pass |
| Prototype with all scripts omitted | HTTP/1.1 | true | true | Pass |
| Prototype with enhancement module omitted | HTTP/1.1 | true | false | Fail |
| Prototype with author-mode script omitted | HTTP/1.1 | true | false | Fail |
| Prototype with only Trackinghaus omitted | HTTP/1.1 | true | true | Pass |

The result repeated at both viewport sizes. Full observations are in `transition-serving-audit/serving-observations.json`.

The production and prototype stylesheet hashes are identical (`6ea466f4…200e`). Therefore the mismatch is not the View Transition CSS, TLS, HTTP version, or cache policy. It is isolated to loading the remote tracker inside this local preview context. The tracker remains healthy and compatible in production, where both transition halves passed.

## Tracker contract

The unchanged export and live page both declare:

- script: `https://trackinghaus-alpha.vercel.app/tracker.js`
- site: `thinkinghaus`
- endpoint: `https://trackinghaus-alpha.vercel.app/api/collect`

The script currently returns HTTP 200 as JavaScript with `Access-Control-Allow-Origin: *`. Collection was blocked/omitted during automation; no test analytics events were intentionally generated. The local preview removes only the tracker tag at response time. The exported artifact itself retains the exact production contract.

## Entrance-animation phase

The CSS durations, easing, delays, and keyframes are identical. First-frame opacity samples varied between runs and viewport sizes because `DOMContentLoaded` sampling occurs at different points relative to CSS animation startup; production itself ranged from opacity `0` to an already-progressing value in repeated runs. This is network/cache/scheduling phase variation, not a motion-definition mismatch. No synchronizing script is recommended: it would add runtime complexity to make a naturally nondeterministic load phase artificially deterministic.

## Browser qualification

- Verified: current Chrome desktop engine at desktop and mobile emulation sizes.
- Not verified here: physical Safari/iOS or Firefox devices.
- Cross-document View Transitions are not universally supported; the site remains ordinary document navigation without them. Reduced-motion and no-JavaScript fallbacks remain safe.

## Adoption gate

The navigation-motion gate is **cleared for the static-first approach**, provided an unpublished/local preview omits analytics and production retains the existing tracker contract. There is no Write Placid shared-core action and no Thinkinghaus application fix to make from this result. A later production adoption should repeat one post-deploy live smoke test in Chrome and Safari, then confirm analytics collection separately.

