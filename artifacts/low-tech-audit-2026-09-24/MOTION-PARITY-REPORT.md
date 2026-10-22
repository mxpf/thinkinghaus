# Static-first v2 motion parity audit

Status: read-only production audit plus unpublished prototype instrumentation. Production remains at `76175bcfaf6f473f50b582addcc3aebf2f592a10`; nothing was committed, pushed, or deployed.

## Final qualification

The earlier report’s broad visual-parity wording needed qualification. Copying production CSS preserved the declarations, but did not prove runtime timing or navigation effects. A follow-up production-like serving audit isolated the missing incoming transition to the remote Trackinghaus script in the local preview context. The exported pages pass both transition halves at desktop and mobile sizes when analytics is omitted from the unpublished preview; live production passes with analytics intact. See `PRODUCTION-LIKE-PREVIEW-REPORT.md`.

## Motion inventory and parity matrix

| Behavior | Production implementation / owner | Observed production | Prototype observation | Status | Smallest requirement before adoption |
| --- | --- | --- | --- | --- | --- |
| Homepage frame reveal | `index-entry-reveal`, 180 ms ease-out; Thinkinghaus CSS | Brand/footer start immediately; list items use 20 ms increments through item 9, then 200 ms | Same CSS, end states, stagger, easing and duration. Prototype sampling caught true opacity 0; production’s slower load meant the first DOMContentLoaded sample was already partially advanced | Equivalent definition; visibly phase-shifted by load timing | Accept faster start as a loading consequence or define an explicit reveal start signal if exact phase matters |
| Desktop brand letter cascade | `LetterCascade` markup + `letter-cascade-in`, 550 ms with 40 ms/letter delay; Thinkinghaus | 13 letter animations; final letters continue to roughly 1.03 s | Same 13 animations and timings | Verified equivalent | None |
| Mobile brand intro | Desktop brand hidden at ≤767 px; footer/site name uses index reveal | No visible letter cascade; list/footer reveal remains | Same | Verified equivalent | None |
| Homepage list stagger | CSS only; Thinkinghaus | First item settles around 200 ms; tenth is still entering around 200 ms and settles by ~400 ms | Same sampled progression and end state | Verified equivalent | None |
| Link hover color | 160 ms `color` transition; Thinkinghaus CSS | Foreground → muted by 220 ms | Matching sampled colors at 0/90/220 ms | Verified equivalent | None |
| Homepage date reveal | 180 ms in / 420 ms out; Thinkinghaus CSS | Opacity ≈0.76–0.91 at 90 ms, 1 at 220 ms; ≈0.30 after 220 ms out, 0 after 460 ms | Matching curve and endpoints. Hidden on mobile as designed | Verified equivalent | None |
| Keyboard focus-visible | Same CSS path as hover plus outline | Keyboard traversal shows muted link and date opacity 1 by 220 ms on desktop; reduced motion is immediate | Prototype matches. Mobile post date remains hidden | Verified equivalent | None |
| Article link hover | Shared 160 ms color rule plus article foreground target; Thinkinghaus CSS | Same stylesheet path as global links | Exact CSS copied; not separately pointer-sampled inside prose | Implemented, not independently timed | Add one prose-link pointer assertion to the adoption gate |
| Bidirectional image fade | Immutable Write Placid core v1.4.0 `attachScrollFade`; 80 ms linear CSS transition | 0.6 after exit; returns to 1 by ~120 ms; repeats on exit | Same desktop/mobile samples and thresholds | Verified equivalent | None |
| Image failure/no-JS baseline | Core fail-safe + Thinkinghaus opacity-1 CSS | Fully visible without JS/reduced motion; observer failure previously verified | Same | Verified equivalent | None |
| Scroll progress | `requestAnimationFrame` scroll listener; Thinkinghaus component/prototype helper | Transform follows scroll; reaches scaleX(1) at end | Same sampled matrices desktop/mobile and both scroll directions | Verified equivalent | None |
| Long-page footer reveal | React state + 220 ms `article-footer-reveal`; Thinkinghaus | Armed at opacity 0/translateY(6 px); ≈0.24 at 60 ms; 1/0 px at 260 ms | Same; small frame-level variation from scheduling only | Verified equivalent | None |
| Short-page footer | Same controller; already at document end when viewport contains page | Desktop footer is immediately revealed; mobile short page performs 220 ms reveal after scrolling to end | Same | Verified equivalent | None |
| Forward page exit/entry fade | `@view-transition { navigation:auto }`; 120 ms old-root fade, 180 ms new-root fade; Thinkinghaus CSS/browser | Full Document request, `pageswap.viewTransition=true`, `pagereveal.viewTransition=true` on desktop/mobile | Full Document request; both events true on desktop/mobile when the unpublished preview omits analytics | Verified equivalent with preview-only analytics isolation | Keep analytics disabled in unpublished previews; retain the unchanged tracker contract in production |
| Back navigation | Browser history/BFCache + cross-document View Transitions | No new Document request; both transition events carry a ViewTransition | Same | Verified equivalent in tested Chrome | Add explicit supported-browser fallback expectations |
| Reload | Browser reload; CSS intro animations replay; no cross-document transition | No ViewTransition on reload; intro animations replay | Same | Verified equivalent | None |
| Reduced motion | CSS media query + core media query | No intro/stagger/view-transition/link/image/footer animation; progress still updates | Same. Production React still adds footer state classes, but CSS keeps it visually static; prototype avoids arming | Visually equivalent; internal classes differ | Assert visual state, not class identity |
| No JavaScript | Static HTML + CSS | Content/links visible, image/footer opacity 1, progress stays 0; CSS intro/brand animations still run | Same | Verified equivalent | Document explicitly that “no JS” does not mean “no CSS motion” |
| Author controls | `author-mode.js`; Thinkinghaus | `#edit` reveals action immediately; link then uses ordinary hover transition | Same activation and destination; no dedicated entrance animation | Verified equivalent | None |
| Trackinghaus | External tracker; no visual motion | No visual contribution | Exact contract retained | Not a motion concern | Keep independent |

## Navigation mechanism finding

Production is not relying on an RSC soft navigation for the tested homepage-to-article route. Both production and the prototype issued a new `Document` request to `deep-minimal.html`. Back navigation used BFCache in both cases and issued no new document request. The byte savings therefore do not require sacrificing a currently observed SPA navigation mechanism.

The apparent difference was browser-mediated cross-document transition eligibility while the remote Trackinghaus script loaded inside the local preview context. HTTP/1.0, HTTP/1.1, HTTPS/HTTP2, and cache-header variations did not change the failure. Omitting only that third-party script restored the incoming transition at both tested viewport sizes. Because production passes with the tracker present, this is a preview-environment interaction rather than an export-content or shared-core defect.

Cross-document View Transitions are browser-dependent. Current Chromium exposes the transition events used in this audit; browsers without that support fall back to immediate document navigation in both implementations. CSS transitions, animations, `requestAnimationFrame`, and `IntersectionObserver` have broader support, with the existing visible/static fallbacks covering failure cases.

## Evidence

- Full timestamped observations and animation frames: `motion-audit/motion-observations.json`
- Repeatable CDP harness: `motion-audit.mjs`
- Production motion source: `app/globals.css`, `app/Footer.tsx`, `app/ScrollProgress.tsx`, `app/LetterCascade.tsx`, `public/author-mode.js`
- Shared image controller: immutable `@mxpf/write-placid-core` v1.4.0 `scroll-fade.mjs`
- Prototype motion helper: `prototype-enhancements.mjs`

The original harness blocked the Trackinghaus collection endpoint to avoid creating test analytics. The follow-up preview omits the tracker tag entirely. The audits exercised desktop (1440 × 1000), mobile (390 × 844), first load, forward navigation, back, reload, long and short pages, both scroll directions, hover, keyboard focus, reduced motion, and no-JS rendering.

## Updated size impact

Retaining the full typography mutation guard added about 502 uncompressed bytes to the prototype helper and about 137 transferred bytes in the controlled Brotli run. With the separately measured unchanged Trackinghaus loader included, prototype JavaScript is approximately 4,532 transferred bytes per cold page versus roughly 132–135 KB in production. No additional JavaScript is proposed for navigation fades; the mismatch should remain CSS/browser-managed.

## Recommendation

The static-first direction clears the measured motion-parity gate in current Chrome. Keep unpublished previews analytics-free, retain the exact tracker contract in production, and repeat a short post-deploy Chrome/Safari smoke test if this approach is later adopted. No duplicate JavaScript navigation transition, Thinkinghaus application fix, or Write Placid shared-core change is recommended.
