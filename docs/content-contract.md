# Thinkinghaus content identity contract

The Markdown document is the portable publishing manifest shared by Studio, KDrive, and the public build. Its body and identity travel together. KDrive folders may describe editorial state or grouping, but a folder name or file path is never a public identity.

## Required frontmatter

Every post, page, and Now entry carries:

```yaml
id: 46940085-c1e7-4be0-bd56-5e2d4ccfa60e
slug: its-dangerous-to-go-alone-take-this
```

- `id` is an immutable UUID created once. Studio must preserve it through edits, renames, folder moves, status changes, imports, and republishes.
- `slug` is the explicit public address. Studio must not regenerate it from the title or derive it from a KDrive path after creation.
- `aliases` is an optional comma-separated list of former slugs. Before changing a published slug, Studio must append the previous slug and retain all earlier aliases.

Posts and Now entries additionally carry `date` and `status`. Published material may carry `publishedAt` and `updatedAt`. Pages do not need editorial dates.

## Relationships

Authored links between Thinkinghaus documents use the persistent ID:

```markdown
[change in attention](doc:44180f64-b72b-4bfe-b721-e47acf9d7328)
```

The public build resolves that relationship to the target’s current slug. Ordinary external URLs and public asset paths remain ordinary Markdown links.

## Publishing boundary

Studio should publish a flat snapshot into `content/posts`, `content/pages`, or `content/now`. The source KDrive location is deliberately absent from the public contract. Moving a document between KDrive editorial folders may change private state or presentation, but it must not change `id`, `slug`, or `aliases`.

The public build validates the complete snapshot before producing the site. It rejects:

- missing, malformed, or duplicate IDs;
- invalid or duplicate public slugs;
- aliases that are invalid, duplicated, or collide with a current slug;
- redirect cycles (also structurally prevented by alias-to-canonical mapping);
- unresolved `doc:` relationships; and
- unresolved root-relative content links.

Each alias produces a durable compatibility document that forwards the old `.html` address to the current one while preserving query strings and fragments. GitHub Pages cannot emit application-controlled HTTP 301 responses, so these are canonicalized HTML redirects rather than server-status redirects.

At reader request time the deployed site is a static GitHub Pages snapshot. It does not contact KDrive or Studio.

## Studio coordination requirements

The Studio implementation must:

1. Replace path-derived document identity with the frontmatter UUID.
2. index KDrive path separately as mutable location metadata;
3. preserve the explicit slug instead of recreating it from the title;
4. append the previous published slug to `aliases` before a slug change;
5. serialize `id`, `slug`, and `aliases` on every save and publish;
6. resolve database/cache records by `id`, using path only for synchronization; and
7. publish ID-based internal relationships without converting them back to path identity.

D1 may cache or index this information, but KDrive Markdown remains canonical for article bodies and folder hierarchy, and the identity fields stored with each Markdown document remain authoritative.
