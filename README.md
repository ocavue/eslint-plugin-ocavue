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
const items = Array.from({ length: count }, (_, index) =>
  createItem(index === 0 ? 'first item label' : `item number ${index}`),
)

// Correct
const short = (index) => createItem(`item number ${index}`)

// Correct (what the fixer produces, after formatting)
const items = Array.from({ length: count }, (_, index) => {
  return createItem(index === 0 ? 'first item label' : `item number ${index}`)
})
```

When a comment sits between `=>` and the body, the rule reports without autofixing so the fix never drops a comment.

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/ocavue">
    <img src="https://cdn.jsdelivr.net/gh/ocavue/sponsors/sponsorkit/sponsors.svg" alt="My Sponsors">
  </a>
</p>

## License

[MIT](./LICENSE) © [ocavue](https://github.com/ocavue)
