# PR Deck

A client-only, read-only dashboard for reviewing open GitHub pull requests across your personal account and organisations. It talks to GitHub's GraphQL API straight from the browser with a personal access token kept in `localStorage`.

## Develop

Node and pnpm are pinned in `mise.toml`; the toolchain is [Vite+](https://viteplus.dev).

```sh
mise install
pnpm install
pnpm dev      # vp dev
pnpm check    # format, lint, typecheck
pnpm test     # unit tests
pnpm build    # static build in dist/
```

Sign in with a classic token that has the `repo` and `read:org` scopes.
