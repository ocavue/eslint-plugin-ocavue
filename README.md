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
      'ocavue/prefer-constant-function': 'error',
      'ocavue/prefer-noop': 'error',
      'ocavue/prefer-sleep': 'error',
      'ocavue/prefer-while-true': 'error',
    },
  },
]
```

## Rules

### `no-implicit-arrow-linebreak`

Disallow a linebreak between `=>` and an implicit arrow function body. Unlike [`@stylistic/implicit-arrow-linebreak`](https://eslint.style/rules/implicit-arrow-linebreak), whose fixer joins the two lines into one (which Prettier then breaks again whenever the joined line exceeds `printWidth`, so `eslint --fix` and the formatter never converge), this rule's fixer converts the body to a block body with `return`. A block body is a stable shape for Prettier and oxfmt, so one round of `eslint --fix` plus the formatter converges.

```js
// Incorrect
const items = Array.from({ length: count }, (_, index) => {
  return createItem(index === 0 ? 'first item label' : `item number ${index}`)
})

// Correct
const short = (index) => createItem(`item number ${index}`)

// Correct (what the fixer produces, after formatting)
const items = Array.from({ length: count }, (_, index) => {
  return createItem(index === 0 ? 'first item label' : `item number ${index}`)
})
```

When a comment sits between `=>` and the body, the rule reports without autofixing so the fix never drops a comment.

### `prefer-constant-function`

Enforce `returnTrue`, `returnFalse` and `returnNull` from [`@ocavue/utils`](https://github.com/ocavue/utils) instead of inline functions such as `() => true`, `() => false` and `() => null`.

```js
// Incorrect
const all = items.filter(() => true)

// Correct (what the suggestion produces)
import { returnTrue } from '@ocavue/utils'

const all = items.filter(returnTrue)
```

The rule offers an editor suggestion, not an autofix. `returnFalse` returns the literal type `false`, while TypeScript infers `() => false` as `() => boolean`, so the swap can narrow an inferred type:

```ts
const [open, setOpen] = useState(() => false) // open: boolean
const [open, setOpen] = useState(returnFalse) // open: false, so setOpen(true) is a type error
```

The rule uses the same `checkDependency` option, skip conditions and import handling as [`prefer-noop`](#prefer-noop).

### `prefer-noop`

Enforce `noop` from [`@ocavue/utils`](https://github.com/ocavue/utils) instead of inline empty functions such as `() => {}`, `() => undefined` and `function () {}`. A shared `noop` reads as intent ("do nothing on purpose") and avoids creating a new function on every render or call.

```js
// Incorrect
;<button onClick={() => {}} />

// Correct (what the fixer produces)
import { noop } from '@ocavue/utils'

;<button onClick={noop} />
```

The rule only runs when the nearest `package.json` of the linted file lists `@ocavue/utils` in `dependencies`, `devDependencies` or `peerDependencies`, or when the file already imports `@ocavue/utils`. Set `checkDependency: false` to run it in every file:

```js
export default [
  {
    rules: {
      'ocavue/prefer-noop': ['error', { checkDependency: false }],
    },
  },
]
```

The rule skips functions where the swap could change runtime behavior: `async` functions, generators, named function expressions, methods, and functions with default values or destructuring in their parameters.

The fixer adds `noop` to an existing `import { ... } from '@ocavue/utils'`, or adds a new import. It reports without autofixing when the function holds a comment, when another binding named `noop` is in scope, or when the file is not an ES module.

### `prefer-sleep`

Enforce `sleep` from [`@ocavue/utils`](https://github.com/ocavue/utils) instead of a `new Promise` that only resolves after `setTimeout`.

```js
// Incorrect
await new Promise((resolve) => setTimeout(resolve, 100))
await new Promise((resolve) => setTimeout(() => resolve(), 100))

// Correct (what the fixer produces)
import { sleep } from '@ocavue/utils'

await sleep(100)
```

The rule also matches `globalThis.setTimeout` and `window.setTimeout`, block bodies, and `new Promise<void>` in TypeScript. It skips promises that resolve with a value, pass extra arguments to `setTimeout`, or compute the delay from the executor's parameters.

The rule uses the same `checkDependency` option and import handling as [`prefer-noop`](#prefer-noop).

### `prefer-while-true`

Enforce `while (true)` instead of `for (;;)` for infinite loops. Rules such as [`no-constant-condition`](https://eslint.org/docs/latest/rules/no-constant-condition) (with `checkLoops: "all"`) and [`@typescript-eslint/no-unnecessary-condition`](https://typescript-eslint.io/rules/no-unnecessary-condition) report `while (true)` but not `for (;;)`, so people often rewrite the loop as `for (;;)` to silence them. That only hides the infinite loop from the linter: the code still loops forever. This rule removes that workaround. `while (true)` also reads more clearly than `for (;;)`.

```js
// Incorrect
while (true) {
  step()
}

// Correct (what the fixer produces)
while (true) {
  step()
}
```

When a comment sits inside the loop head, the rule reports without autofixing so the fix never drops a comment.

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/ocavue">
    <img src="https://cdn.jsdelivr.net/gh/ocavue/sponsors/sponsorkit/sponsors.svg" alt="My Sponsors">
  </a>
</p>

## License

[MIT](./LICENSE) © [ocavue](https://github.com/ocavue)
