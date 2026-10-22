# Intermittent staging transition diagnosis

Date: September 24, 2026

Scope: staging-only diagnosis. No production navigation was generated, no production analytics event was created, and no public, core, Studio, Write Placid, or Trackinghaus production code was changed.

## Browser limit

The user's Vivaldi instance was not available through the browser connector. The only external browser surface exposed was Google Chrome. The results below are therefore real Chrome behavior, not Chrome emulation presented as Vivaldi. They reproduce the staging symptom and establish a deterministic control, but Vivaldi remains a required manual acceptance check before adoption.

## What the stable alias served

Before diagnosis, `https://thinkinghaus-low-js-staging.vercel.app` served the external-stylesheet-only static variant, not the earlier synchronous-opt-in diagnostic. Its head contained no inline `@view-transition` rule. The rule existed only inside the shared 8,908-byte external stylesheet. The remote isolated Trackinghaus contract was intact:

- tracker: `https://trackinghaus.vercel.app/tracker.js`
- site key: `thinkinghaus-low-js-staging`
- collector: `https://trackinghaus.vercel.app/api/collect`

The protected preview now retains that unchanged root behavior and adds two isolated instrumented paths:

- `/diag-observed-base/`: external stylesheet only, matching the root's transition opt-in
- `/diag-observed-inline/`: identical content, host, protection, tracker, and motion CSS, plus only the synchronous opt-in declaration

The diagnostic scripts record `pageswap`, `pagereveal`, navigation type, redirect count, transfer size, and opt-in presence. They do not modify production or the root staging behavior.

## Repeated Chrome results

All ordinary-link samples were homepage → article. History samples were article ↔ homepage. A transition counts as a pass only when both the outgoing `pageswap` and incoming `pagereveal` reported a `ViewTransition`.

| Variant | Navigation | Pass | Fail | Evidence |
| --- | --- | ---: | ---: | --- |
| External stylesheet only | ordinary link, cold first destination | 1 | 0 | outgoing true; incoming true; full document transfer |
| External stylesheet only | ordinary link, warm/revalidated destination | 0 | 5 | outgoing true; incoming false; document transfer 300 B |
| External stylesheet only | different article with shared CSS warm | 0 | 1 | outgoing true; incoming false; full 5,603 B document transfer |
| External stylesheet only | back | 9 | 0 | outgoing and incoming true; `back_forward`; transfer 0 B |
| External stylesheet only | forward | 3 | 0 | outgoing and incoming true; `back_forward`; transfer 0 B |
| Synchronous opt-in | ordinary link, cold + warm | 7 | 0 | outgoing and incoming true; both full and 300 B document transfers |
| Synchronous opt-in | back | 9 | 0 | outgoing and incoming true |
| Synchronous opt-in | forward | 3 | 0 | outgoing and incoming true |

The base path logged three representative `AbortError: Transition was skipped` errors on the failed warm article arrivals. The synchronous-opt-in path logged no warnings or errors.

## Hosting, cache, and protection evidence

- Unauthenticated requests to the staging alias still receive the intended Vercel protection HTTP 302 challenge.
- Every authenticated in-browser diagnostic navigation recorded `redirectCount: 0`.
- Both controls were on the same deployment, host, protection policy, tracker, stylesheet, and content.
- The external-only control failed while the synchronous control passed, so access protection and host headers are not sufficient causes.
- Warm ordinary navigations generally revalidated the HTML with a 300-byte transfer and failed only on the destination side.
- Back/forward traversals transferred 0 bytes and passed, consistent with an already activated/history-restored document having its opt-in available.
- A different article with a full document transfer still failed after the shared stylesheet was warm, so the issue is not specific to one route or merely the size of the HTML response.

## Root cause

The exported lighter page relies on `@view-transition { navigation: auto }` arriving through a blocking external stylesheet. On a fresh ordinary document navigation, whether that opt-in is active at destination activation is timing-sensitive. The outgoing page consistently opts in (`pageswap.viewTransition === true`), but a warm destination can reach `pagereveal` before the external rule is recognized, producing `pagereveal.viewTransition === false` and skipping the transition.

The heavier live site also places the rule in external CSS, but it includes a framework navigation/runtime path absent from the lower-JS export. The user reports live behavior is stable. This diagnosis deliberately did not generate repeated live navigations because that would create production analytics traffic. It therefore does not claim which live runtime or timing detail masks the race; it only establishes that the static export exposes it and the synchronous opt-in removes it.

## Smallest proposed fix and ownership

For a future lower-JS/static export, emit only the navigation opt-in synchronously in every document head:

```html
<style>@media (prefers-reduced-motion:no-preference){@view-transition{navigation:auto}}</style>
```

Keep the existing transition keyframes, durations, reduced-motion rules, Trackinghaus integration, and all instance-specific visual behavior unchanged in the stylesheet and scripts.

Correct ownership is the Write Placid static document shell/export contract, because every participating document must have the opt-in at activation. Thinkinghaus should consume that supported output rather than permanently post-process its own pages. This is a proposal only; no shared release, instance adoption, or production change is authorized.

## Remaining uncertainty and gate

- Actual Vivaldi behavior has not been instrumented because Vivaldi is not exposed to the connector.
- Physical Safari remains untested because remote automation is disabled and was not enabled silently.
- Lower-JS adoption remains blocked until the synchronous-opt-in candidate passes repeated user-visible Vivaldi navigation, including cold link, warm link, back, and forward.

## Lifecycle

The staging alias remains protected and points to preview deployment `dpl_9GVKvAxTt1j7mSbXr3TCVDuLtKWo`. Superseded diagnostic deployments created during this run were removed. The preview and isolated Trackinghaus staging resource remain temporary and should be removed only after explicit cleanup approval.
