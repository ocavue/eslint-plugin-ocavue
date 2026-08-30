# eslint-plugin-ocavue

[![NPM version](https://img.shields.io/npm/v/eslint-plugin-ocavue?color=a1b858&label=)](https://www.npmjs.com/package/eslint-plugin-ocavue)

Custom [ESLint](https://eslint.org/) rules from [ocavue](https://github.com/ocavue).

## Usage

Requires ESLint 10 with flat config.

```sh
pnpm add -D eslint-plugin-ocavue
```

```js
// eslint.config.js
import ocavue from 'eslint-plugin-ocavue'

export default [
  {
    plugins: { ocavue },
    rules: {
      'ocavue/no-implicit-arrow-linebreak': 'error',
    },
  },
]
```

## Rules

### `no-implicit-arrow-linebreak`

Disallow a linebreak between `=>` and an implicit arrow function body. Unlike [`@stylistic/implicit-arrow-linebreak`](https://eslint.style/rules/implicit-arrow-linebreak), whose fixer joins the two lines into one (which Prettier then breaks again whenever the joined line exceeds `printWidth`, so `eslint --fix` and the formatter never converge), this rule's fixer converts the body to a block body with `return`. A block body is a stable shape for Prettier and oxfmt, so one round of `eslint --fix` plus the formatter converges.

```js
// Incorrect
const paragraphs = Array.from({ length: blockCount }, (_, index) =>
  n.paragraph(index === 0 ? 'plain target x' : `plain paragraph ${index}`),
)

// Correct
const short = (index) => n.paragraph(`plain paragraph ${index}`)

// Correct (what the fixer produces, after formatting)
const paragraphs = Array.from({ length: blockCount }, (_, index) => {
  return n.paragraph(index === 0 ? 'plain target x' : `plain paragraph ${index}`)
})
```

When a comment sits between `=>` and the body, the rule reports without autofixing so the fix never drops a comment.

## Project structure

- `src/`: source code, with co-located [Vitest](https://vitest.dev/) tests (`*.test.ts`)
- `dist/`: bundled output (ESM + type declarations), built by [tsdown](https://tsdown.dev/)

## Scripts

Local development needs [Node.js](https://nodejs.org/) v22+ and [pnpm](https://pnpm.io/).

| Command          | Description                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`       | Rebuild on change (`tsdown --watch`)                                                                                       |
| `pnpm build`     | Bundle the library to `dist/`                                                                                              |
| `pnpm test`      | Run tests with [Vitest](https://vitest.dev/)                                                                               |
| `pnpm lint`      | Lint with [ESLint](https://eslint.org/), [oxfmt](https://oxc.rs/docs/guide/usage/formatter), and [knip](https://knip.dev/) |
| `pnpm fix`       | Auto-fix formatting and lint issues                                                                                        |
| `pnpm typecheck` | Type-check with `tsc`                                                                                                      |

## Publishing

Releases are automated with [release-please](https://github.com/googleapis/release-please) and npm [trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). No tokens to manage.

1. **First release (manual).** OIDC can't create a brand-new package, so publish the first version by hand:

   ```bash
   pnpm login
   pnpm build
   pnpm publish
   ```

2. **Enable OIDC.** On [npmjs.com](https://www.npmjs.com/), open the package → **Settings → Trusted Publisher → GitHub Actions**, and set the workflow filename to `release.yml`.

3. **Future releases (automatic).** Push [Conventional Commits](https://www.conventionalcommits.org/) (`fix:`, `feat:`, …) to your default branch (usually `master` or `main`); [release-please](https://github.com/googleapis/release-please) opens a release PR that bumps the version, updates the changelog, and publishes on merge.

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/ocavue">
    <img src="https://cdn.jsdelivr.net/gh/ocavue/sponsors/sponsorkit/sponsors.svg" alt="My Sponsors">
  </a>
</p>

## License

[MIT](./LICENSE) © [ocavue](https://github.com/ocavue)
