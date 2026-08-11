# Thinkinghaus Drafts MCP

Private Model Context Protocol server for saving essays and revisions from Codex chats directly into Thinkinghaus Studio.

## What it does

- Exposes one tool: `save_thinkinghaus_draft`.
- Creates new Studio documents as drafts.
- Replaces the complete body of an existing draft when `current_title` identifies it.
- Preserves an existing document's date, publication state, publication time, and source metadata unless the tool receives an explicit replacement value.
- Uses the Studio Worker through the `STUDIO` service binding, so the MCP server does not contain GitHub or Google Drive credentials.

It cannot publish or delete anything. Those actions remain inside Thinkinghaus Studio.

## Access

The server uses Cloudflare Access as its upstream OAuth provider. The Access application is restricted to the owner's email address. MCP clients discover OAuth through the server's standard metadata endpoints and dynamically register themselves.

Production endpoint:

```text
https://thinkinghaus-drafts-mcp.maxpfennighaus.workers.dev/mcp
```

## Development

```bash
npm install
npm run type-check
npm run dev
```

For local OAuth testing, copy `.dev.vars.example` to `.dev.vars` and provide values from a Cloudflare Access OIDC SaaS application whose redirect URLs include:

```text
http://localhost:8788/callback
```

Never commit `.dev.vars` or production credentials.

## Cloudflare resources

The Worker expects:

- Durable Object: `ThinkinghausMCP`
- KV binding: `OAUTH_KV`
- Service binding: `STUDIO` → `thinkinghaus-studio`
- Secrets listed in `wrangler.jsonc`

The production Access application callback is:

```text
https://thinkinghaus-drafts-mcp.maxpfennighaus.workers.dev/callback
```

Deploy after type checking:

```bash
npm run type-check
npm run deploy
```

## Verification

An unauthenticated MCP initialize request should return `401` with a `WWW-Authenticate` header. These discovery endpoints should return JSON:

```text
/.well-known/oauth-protected-resource
/.well-known/oauth-authorization-server
```

After an authenticated client connects, it should list only `save_thinkinghaus_draft`.
