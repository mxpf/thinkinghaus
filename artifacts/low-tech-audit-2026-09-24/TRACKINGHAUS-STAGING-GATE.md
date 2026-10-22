# Trackinghaus-enabled staging gate

Date: September 24, 2026  
Status: **Blocked before traffic generation**  
Scope kept: live Thinkinghaus, production Trackinghaus, repositories, databases, Vercel configuration, and analytics data were not changed.

## Decision

A clean end-to-end staging test cannot currently proceed without an owner-side Trackinghaus configuration step.

The production collector is intentionally one-publication-per-deployment:

- `POST /api/collect` accepts only the deployment's configured `TRACKINGHAUS_SITE_KEY`.
- An arbitrary staging site key is rejected as `400 invalid_event`.
- A request origin must be in `TRACKINGHAUS_ALLOWED_ORIGINS`; an unlisted staging origin is rejected as `403 origin_not_allowed`.
- Adding a staging origin to the production deployment would not isolate it. All allowed origins use the same configured site key and therefore contribute to the same aggregate reading.

No collection request was sent while testing this gate.

## Existing infrastructure

Read-only Vercel inspection found:

| Project | URL | Database | Site configuration | Suitable now? |
| --- | --- | ---: | ---: | --- |
| `trackinghaus-alpha` | `https://trackinghaus-alpha.vercel.app` | true | true | Production; must not receive staging traffic |
| `trackinghaus` | `https://trackinghaus.vercel.app` | false | false | No; health is up but collection storage/site identity are unconfigured |

The second project means a new paid Vercel service is not required. However, making it a real isolated collector requires security-sensitive configuration that is outside this task's authorization.

## Exact owner action required

The Trackinghaus implementation owner should configure the existing `trackinghaus` Vercel project as a non-production collector, without changing `trackinghaus-alpha`:

1. Provide an isolated database target, or explicitly approve using the existing database with a separate site key after reviewing the shared-table risk.
2. Set a staging-only `TRACKINGHAUS_SITE_KEY` (owner-selected; this report does not invent one).
3. Set a staging name and timezone.
4. Add only the eventual HTTPS preview origin to `TRACKINGHAUS_ALLOWED_ORIGINS`.
5. Confirm `/api/health` reports `database: true` and `site: true`.
6. Provide the staging tracker URL, site key, collection endpoint, and a supported read-back method that proves the staged event landed only in the staging namespace.

Preferred isolation is a separate Neon database or database branch. Reusing the production database with a different key is logically separated by the current primary key and query contract, but increases operational coupling and requires copying a production credential into another deployment; that should be an explicit owner decision, not an implementation-thread assumption.

## Test plan once unblocked

After the owner supplies the verified staging contract:

1. Deploy the already-public static-first export to an unpublished HTTPS preview.
2. Point its unchanged tracker markup shape at the owner-provided staging tracker URL/site key/endpoint.
3. Verify one uniquely named/path-scoped collection event receives HTTP 202.
4. Verify read-back shows that event in staging and not in the production `thinkinghaus` aggregate.
5. Test homepage → article and article → homepage navigation while the tracker actually sends, recording `pageswap.viewTransition` and `pagereveal.viewTransition`.
6. Repeat desktop and mobile viewport testing in Chrome.
7. Test physical Safari if available. WebKit automation may supplement but must not be labeled Safari.
8. Re-run the complete motion matrix: entrance/list/brand, hover/date, image fade in/out, page fade, footer reveal, progress, typography guards, captions, and author controls.
9. Remove or expire the preview and staging test data according to the owner's chosen lifecycle.

## Current browser matrix

| Environment | Tracker status | Chrome desktop/mobile | Safari | Conclusion |
| --- | --- | --- | --- | --- |
| Live production | Enabled; real production collection | Prior audit passed both transition halves | Not tested in this task | Production baseline only |
| Local static-first preview | Disabled to prevent contamination | Prior audit passed, but is not analytics parity | Not tested | Insufficient for requested gate |
| Isolated HTTPS staging | Not yet available | Not run | Not run | Blocked on owner configuration |

## Evidence sources

- Trackinghaus README: one deployment, one publication; allowed origins share one aggregate.
- Current `api/collect.js`: exact origin and site-key validation, HTTP 202 on accepted collection.
- Current `lib/config.js`: one configured site key and an allowed-origin list.
- Read-only `/api/health` checks on both existing Vercel projects.
- Earlier local transition evidence: `PRODUCTION-LIKE-PREVIEW-REPORT.md`.

