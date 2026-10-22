# Lower-JS staging: analytics and motion verification

Date: September 24, 2026

Scope: isolated, unpublished staging validation only. No production Thinkinghaus, Trackinghaus, Studio, Write Placid, or tracked production asset was changed.

## Staging boundary

- Thinkinghaus preview: `https://thinkinghaus-low-js-staging.vercel.app`
- Vercel target: preview; no `thinking.haus` production alias was attached.
- Trackinghaus tracker: `https://trackinghaus.vercel.app/tracker.js`
- Staging site key: `thinkinghaus-low-js-staging`
- Staging collector: `https://trackinghaus.vercel.app/api/collect`
- Staging readback: `https://trackinghaus.vercel.app/api/weekly`
- The tracker owner provisioned a separate staging Neon resource and exact-origin allowlist. The production collector and production database were not reused.

## Analytics evidence

Chrome desktop and mobile-emulation navigations each produced two collector responses, one for the homepage and one for the representative article. All four responses were HTTP 202 over HTTP/2.

The staging weekly readback identified:

- site key `thinkinghaus-low-js-staging`
- origin `https://thinkinghaus-low-js-staging.vercel.app`
- only staging and diagnostic paths
- 25 test reads at the time of verification, including the explicit contract-verification event

The production weekly readback identified site key `thinkinghaus`, origin `https://thinking.haus`, and no staging site key or diagnostic path. This is direct evidence that the staging tests did not enter the production dataset.

## Motion matrix

### Chrome desktop, 1440 × 1000

- Outgoing cross-document transition: active.
- Incoming cross-document transition before the diagnostic fix: absent, with `InvalidStateError: Transition was aborted because of invalid state. ViewTransition opt-in disabled`.
- Incoming transition with synchronous head opt-in: active; no transition error.
- Article image: opacity 0.60 outside the focus zone and 1.00 inside it.
- Scroll progress: reaches 1.00 at the article end.
- Article footer: opacity 0 / translateY 6px before the end, then opacity 1 / translateY 0 at the end.
- Trackinghaus: two HTTP 202 responses.

### Chrome mobile emulation, 390 × 844

- Outgoing and incoming cross-document transitions both active with synchronous head opt-in.
- Image, progress, and footer behavior matched desktop.
- Trackinghaus: two HTTP 202 responses.

### Reduced motion

- Cross-document transitions disabled.
- Images remain at opacity 1.
- Footer remains visible with no transform.
- Tracker collection remains healthy.

### JavaScript disabled

- Homepage content remained visible.
- 471 characters and 21 links were present in the representative capture.
- No analytics event was sent, as expected.

### Safari

Safari 26.5.2 is installed. Physical Safari automation could not be run because Safari's existing settings do not permit remote automation. No setting was changed. Safari therefore remains explicitly untested rather than inferred from Chrome or a WebKit substitute.

## Diagnosis

The failed incoming transition was not caused by Trackinghaus collection. Removing the tracker, allowing it to exit early, and removing Vercel's protection did not make the incoming transition reliable. Serving the same tracker from the page origin changed timing enough to make the transition succeed, which pointed to an opt-in race in the very fast static destination document.

The deterministic diagnostic keeps the real remote staging tracker unchanged and places only the existing view-transition opt-in in the document head:

```html
<style>@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>
```

With that declaration available synchronously, desktop and mobile Chrome both reported an outgoing and incoming `ViewTransition`, analytics continued to return HTTP 202, reduced-motion behavior remained correct, and no-JS reading remained intact.

## Recommendation

If the lower-JS/static export is adopted later, make the cross-document `@view-transition` opt-in synchronous in each generated document. Treat this as a small static-export integration requirement, not a Trackinghaus change and not a reason to add a client runtime.

Do not extract a shared core from this experiment. The reusable boundary is narrow: Write Placid may emit the synchronous opt-in as part of its static document shell, while the Thinkinghaus instance continues to own its visual timing and styles. Trackinghaus should remain a remote, isolated integration configured by URL, site key, endpoint, and exact origin.

Before production adoption, run a short manual physical-Safari check after the user enables Safari automation or performs the check interactively. No production adoption, commit, push, or deployment is part of this report.

## Lifecycle

The Thinkinghaus preview, stable staging alias, and isolated Trackinghaus staging resource are temporary audit infrastructure. They should be removed after the Project Index accepts the evidence and explicitly approves cleanup. Until then, they should not be treated as a public environment or a permanent analytics property.
