# Security

## Supported version

The current `main` branch and the live site at [thinking.haus](https://thinking.haus) are supported.

## Reporting a vulnerability

Please use GitHub’s private vulnerability reporting for this repository rather than opening a public issue with exploit details.

## Dependency policy

- High-severity production dependency findings block publication.
- The complete development dependency audit runs weekly and remains informational so a build-only advisory cannot take the site offline.
- Dependabot checks npm and GitHub Actions dependencies weekly.
- Framework and build-tool upgrades are reviewed and must pass the static build, rendered-page tests, linting, and type checking before publication.

## Trusted build inputs

thinking.haus is a static publishing system. Its build reads source code, Markdown, fonts, and images committed to this repository. Those files are trusted and reviewed before they reach the build.

The private Studio does not pass visitor-supplied images to Vinext or `image-size`. If arbitrary image uploads are introduced later, they must be validated and processed outside this build path before the feature is enabled.

## Current upstream advisory

Vinext `1.0.0-beta.5` depends on `image-size` `2.0.2`, which has denial-of-service advisories affecting its ICNS, JXL, and HEIF parsers:

- [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr)
- [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)

No patched `image-size` release is currently available. The dependency is development-only here and processes trusted static inputs. Vinext is pinned so the risk remains bounded and upgrades arrive as reviewable Dependabot pull requests.
