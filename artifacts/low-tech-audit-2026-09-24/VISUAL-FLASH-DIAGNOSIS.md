# Intermittent light-grey flash diagnosis

Date: September 24, 2026

Status: staging-only diagnostic. The user's real Vivaldi observation is a failed visual acceptance even though the transition lifecycle objects exist. Production, shared core, Trackinghaus production, browser settings, and the existing fixed test route were not changed.

## Browser limit

Vivaldi is not available through the browser connector. The user's report—an intermittent whole-page light-grey flash on `https://thinkinghaus-low-js-staging.vercel.app/diag-observed-inline/`—is therefore the authoritative Vivaldi observation. Chrome captures below are supporting controls only and are not labeled as Vivaldi verification.

## What lifecycle success missed

The existing fixed route successfully reports `pageswap.viewTransition` and `pagereveal.viewTransition`. That proves the transition object exists; it does not prove every composited frame uses the intended canvas color.

Instrumentation placed before the external stylesheet measured the following on an ordinary homepage → article navigation:

| Variant | First head checkpoint | `pagereveal` checkpoint | Gap |
| --- | --- | --- | ---: |
| Existing fixed URL | transparent root; `color-scheme: normal`; no opt-in encountered yet | `rgb(26, 24, 20)` root and body; dark scheme; transition active | ~34 ms |
| Early canvas | `rgb(26, 24, 20)` root; dark scheme; opt-in already present | same dark root/body; transition active | no transparent checkpoint |
| Early canvas + transition overlay | `rgb(26, 24, 20)` root; dark scheme; opt-in already present | same dark root/body; transition active | no transparent checkpoint |

The existing route's measured destination moved from transparent/normal at 158.9 ms to the intended dark canvas at 192.9 ms. The exact interval varies, but the state change is deterministic. Vivaldi can expose its own light default canvas during that interval; Chrome did not expose it in the sampled filmstrips.

## Controlled staging variants

The existing URL remains unchanged:

- `/diag-observed-inline/`: opt-in appears later in the head, after the external stylesheet; initial root is transparent/default.

Two isolated protected controls were added:

- `/diag-observed-early-canvas/`: before the external stylesheet, establishes the Thinkinghaus canvas, dark color scheme, and navigation opt-in.
- `/diag-observed-early-canvas-transition/`: same early canvas plus an explicit dark background on the view-transition overlay.

Both retain the exact page content, external stylesheet, fade timings, scroll/image/footer effects, reduced-motion media condition, and isolated Trackinghaus tracker contract.

Actual protected-staging Chrome samples for each new control:

- first document checkpoint dark: 3/3 sampled arrivals;
- ordinary homepage → article lifecycle: 2/2 passed per control;
- warm 300-byte HTML revalidation included: passed;
- redirect count: 0 after authentication;
- console transition errors: none observed.

These are small diagnostic samples, not Vivaldi acceptance.

## Timed frames

The browser connector captured 12 timed protected-staging frames for the existing route and 12 for the guarded overlay route. Neither Chrome sequence contained a light-grey whole-page frame; both maintained the dark canvas while content cross-faded.

A repeatable local Chrome harness also captured 22 frames per variant at roughly 12 ms intervals. It uses the exact exported HTML, CSS, assets, and scripts, but not Vercel protection/network timing, so it is supporting compositing evidence rather than a replacement for the protected staging observation.

Contact sheets:

- `transition-filmstrips/diag-observed-inline/contact-sheet.png`
- `transition-filmstrips/diag-observed-early-canvas/contact-sheet.png`
- `transition-filmstrips/diag-observed-early-canvas-transition/contact-sheet.png`

Individual frames and the capture manifest are in `transition-filmstrips/`.

## Current diagnosis

Strongest supported hypothesis: the Vivaldi flash is the browser's default initial canvas becoming visible before the destination processes the external stylesheet. Evidence is the whole-page nature of the flash and the measured transparent, normal-color-scheme destination state before the page becomes dark.

Not yet proven: a separate gap in the generated `::view-transition` overlay or old/new root image compositing. Chrome filmstrips did not show such a gap. The overlay-background control exists to distinguish this only if the minimal early-canvas control still flashes in Vivaldi.

## Smallest proposed fix and ownership

The smallest candidate is not a new animation and does not change the existing timings. It makes the instance canvas and navigation opt-in available before external CSS:

```html
<style>:root{color-scheme:dark;background:#1a1814}html,body{background:#1a1814}@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>
```

Ownership should be split correctly:

- Write Placid static shell: capability to emit an early instance canvas and synchronous transition opt-in in every participating document.
- Thinkinghaus instance: supplies `#1a1814` and `dark`; these remain instance visual decisions.
- Transition-overlay background: do not adopt unless the early-canvas Vivaldi control still flashes.

No core release or instance adoption is authorized.

## One useful acceptance URL

Test the minimal candidate—not the broader overlay control—at:

`https://thinkinghaus-low-js-staging.vercel.app/diag-observed-early-canvas/`

The meaningful check is repeated identical homepage → article navigation in Vivaldi, including warm repeats. If the grey flash disappears, the initial-canvas hypothesis is supported and the overlay rule is unnecessary. If it remains, the next isolated test is the overlay control, not a production change.

## Lifecycle

The preview remains protected and uses the isolated staging Trackinghaus contract. Diagnostic navigation was kept off production. Temporary diagnostic deployment cleanup is handled after the current protected alias is verified; the staging environment itself remains temporary pending explicit cleanup approval.
