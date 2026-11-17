# PR Deck

PR Deck lists the open pull requests across your GitHub account and organisations in one place, so you can see what needs your review and what is ready to merge. It runs at [prs.wtf](https://prs.wtf).

- Switch between your personal account and each organisation you belong to.
- Start from the built-in views (Mine, Needs my review, Ready to merge), or save your own.
- Filter by author, repository, CI, review state, your own review, and merge conflicts, then group by repository or author.
- See stacked pull requests together, in merge order, wherever one of them appears in the list.
- Open a pull request in the preview pane to read its description without leaving the list.

PR Deck only reads. It runs entirely in your browser, calls GitHub's GraphQL API directly, and keeps your token in `localStorage`. No server sees the token.

## Sign in

Create a [classic personal access token](https://github.com/settings/tokens/new?scopes=repo,read:org&description=PR%20Deck) with the `repo` and `read:org` scopes, and paste it into the setup screen.

## Develop

Node and pnpm are pinned in `mise.toml`, and the toolchain is [Vite+](https://viteplus.dev).

```sh
mise install
pnpm install
pnpm dev      # start the dev server
pnpm check    # format, lint and typecheck
pnpm test     # run the unit tests
pnpm build    # build the static site into dist/
pnpm codegen  # regenerate GitHub query types after editing src/github/queries.ts
```

Pushes to `main` deploy to Vercel.
