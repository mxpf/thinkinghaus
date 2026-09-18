# Write Placid core updates

thinking.haus consumes the reusable publishing foundation from `@mxpf/write-placid-core`. The dependency is pinned to a full, immutable Write Placid commit in both `package.json` and `package-lock.json`; production must never follow a branch, a moving tag, or a sibling checkout.

The package owns Markdown parsing, content identity and validation, repository readers, RSS and sitemap generation, and compatibility redirect markup. This repository owns all published content, site identity, typography and assets, navigation, Trackinghaus settings, routes, and deployment configuration.

## Upgrade

1. Obtain the tested full commit SHA, package version, snapshot-contract version, and release notes from Write Placid.
2. Change the dependency to `github:mxpf/write-placid#<full-sha>` and regenerate the lockfile.
3. Confirm the package version and public snapshot contract in the contract test.
4. Run linting, type checking, the complete test suite, the production dependency audit, and static-export verification.
5. From a fresh checkout, run `npm ci` and repeat the complete checks. Confirm that content, public URLs, metadata, Trackinghaus attributes, RSS, sitemap, and redirects have not changed unexpectedly.
6. Commit the package reference, lockfile, adapters, tests, and documentation together. Deploy through the normal GitHub Pages workflow and verify the live site.

## Rollback

Revert the complete upgrade commit so the dependency reference, lockfile, adapters, and contract test return to the previous known-good release. Run `npm ci`, the complete checks, and the normal deployment workflow. Do not patch `node_modules`, substitute a local package path, or run a previous core against a newer snapshot-contract version without an explicit compatibility guarantee.
