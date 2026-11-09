import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { test } from 'vitest'

import { useUtilsProjects } from '../utils/test-projects'

import rule from './prefer-noop'

const js = useUtilsProjects('jsx')
const ts = useUtilsProjects('ts')

const IMPORT = "import { noop } from '@ocavue/utils'\n"

test('prefer-noop', () => {
  const tester = new RuleTester({
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  })
  const filename = js.withUtils

  tester.run('prefer-noop', rule, {
    valid: [
      // The project does not depend on `@ocavue/utils`.
      { code: 'f(() => {})', filename: js.withoutUtils },
      // `@ocavue/utils` itself.
      { code: 'f(() => {})', filename: js.utilsRepo },
      // No file on disk.
      { code: 'f(() => {})' },

      // Not an empty function.
      { code: 'f(() => true)', filename },
      { code: 'f(() => null)', filename },
      { code: 'f(() => 1)', filename },
      { code: 'f(() => x)', filename },
      { code: 'f(() => { g() })', filename },
      { code: 'f(() => { g(); return })', filename },

      // Replacing would change runtime behavior.
      { code: 'f(async () => {})', filename },
      { code: 'f(function* () {})', filename },
      { code: 'f(({ a }) => {})', filename },
      { code: 'f(([a]) => {})', filename },
      { code: 'f((x = g()) => {})', filename },
      { code: 'f(function named() {})', filename },
      { code: 'new (function () {})()', filename },

      // Methods.
      { code: 'const o = { foo() {} }', filename },
      { code: 'const o = { set foo(v) {} }', filename },
      { code: 'class A { foo() {} }', filename },
      { code: 'class A { constructor() {} }', filename },

      // Already uses `noop`.
      { code: `${IMPORT}f(noop)`, filename },
    ],
    invalid: [
      {
        code: 'f(() => {})',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'const el = <button onClick={() => {}} />',
        output: `${IMPORT}const el = <button onClick={noop} />`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(function () {})',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => undefined)',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => void 0)',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => { return })',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => { return undefined })',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f((_a, ...rest) => {})',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'const o = { foo: () => {} }',
        output: `${IMPORT}const o = { foo: noop }`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'class A { foo = () => {} }',
        output: `${IMPORT}class A { foo = noop }`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'function f(cb = () => {}) {}',
        output: `${IMPORT}function f(cb = noop) {}`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },

      // Import handling.
      {
        code: "import { once } from '@ocavue/utils'\nf(() => {})",
        output: "import { once, noop } from '@ocavue/utils'\nf(noop)",
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: "import { noop as n } from '@ocavue/utils'\nf(() => {})",
        output: "import { noop as n } from '@ocavue/utils'\nf(n)",
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: "import a from 'a';\nf(() => {})",
        output: "import a from 'a';\nimport { noop } from '@ocavue/utils';\nf(noop)",
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: "'use client'\nf(() => {})",
        output: `'use client'\n${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        // The file imports `@ocavue/utils`, so the rule is on even without
        // the dependency.
        code: "import { once } from '@ocavue/utils'\nf(() => {})",
        output: "import { once, noop } from '@ocavue/utils'\nf(noop)",
        filename: js.withoutUtils,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        // Only one fix is applied per pass because each fix adds the import.
        code: 'f(() => {})\ng(() => {})',
        output: `${IMPORT}f(noop)\ng(() => {})`,
        filename,
        errors: [{ messageId: 'preferNoop' }, { messageId: 'preferNoop' }],
      },
      {
        code: `${IMPORT}f(() => {})\ng(() => {})`,
        output: `${IMPORT}f(noop)\ng(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }, { messageId: 'preferNoop' }],
      },

      // Reported without a fix.
      {
        code: 'const noop = 1\nf(() => {})',
        output: null,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: `${IMPORT}function g(noop) { f(() => {}) }`,
        output: null,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'noop()\nf(() => {})',
        output: null,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => { /* intentionally empty */ })',
        output: null,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f(() => {})',
        output: null,
        filename,
        languageOptions: { sourceType: 'commonjs' },
        errors: [{ messageId: 'preferNoop' }],
      },

      // `checkDependency: false` reports in every project.
      {
        code: 'f(() => {})',
        output: `${IMPORT}f(noop)`,
        filename: js.withoutUtils,
        options: [{ checkDependency: false }],
        errors: [{ messageId: 'preferNoop' }],
      },
    ],
  })
})

test('prefer-noop with TypeScript', () => {
  const tester = new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  })
  const filename = ts.withUtils

  tester.run('prefer-noop', rule, {
    valid: [
      { code: 'f(<T,>() => {})', filename },
      { code: 'class A { foo(): void {} }', filename },
      { code: 'abstract class A { abstract foo(): void }', filename },
    ],
    invalid: [
      {
        code: 'const f: () => void = (): void => {}',
        output: `${IMPORT}const f: () => void = noop`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: 'f((event: Event) => {})',
        output: `${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        code: "'use client'\nf(() => {})",
        output: `'use client'\n${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
      {
        // A type-only import is not reused.
        code: "import type { Counter } from '@ocavue/utils'\nf(() => {})",
        output: `import type { Counter } from '@ocavue/utils'\n${IMPORT}f(noop)`,
        filename,
        errors: [{ messageId: 'preferNoop' }],
      },
    ],
  })
})
