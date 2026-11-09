import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { test } from 'vitest'

import { useUtilsProjects } from '../utils/test-projects'

import rule from './prefer-sleep'

const js = useUtilsProjects('js')
const ts = useUtilsProjects('ts')

const IMPORT = "import { sleep } from '@ocavue/utils'\n"

test('prefer-sleep', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  })
  const filename = js.withUtils

  tester.run('prefer-sleep', rule, {
    valid: [
      // The project does not depend on `@ocavue/utils`.
      { code: 'await new Promise((r) => setTimeout(r, 100))', filename: js.withoutUtils },
      // `@ocavue/utils` itself.
      { code: 'await new Promise((r) => setTimeout(r, 100))', filename: js.utilsRepo },

      // Not a plain delay.
      { code: 'new Promise((r) => setTimeout(r))', filename },
      { code: 'new Promise((r) => setTimeout(r, 100, value))', filename },
      { code: 'new Promise((r) => setTimeout(() => r(value), 100))', filename },
      { code: 'new Promise((r) => setTimeout(() => { g(); r() }, 100))', filename },
      { code: 'new Promise((r) => setTimeout(other, 100))', filename },
      { code: 'new Promise((r) => { g(); setTimeout(r, 100) })', filename },
      { code: 'new Promise((r, reject) => setTimeout(reject, 100))', filename },
      { code: 'new Promise(async (r) => setTimeout(r, 100))', filename },
      { code: 'new Promise(({ r }) => setTimeout(r, 100))', filename },
      { code: 'new Promise(() => setTimeout(g, 100))', filename },
      { code: 'new Promise((r) => setTimeout(...args))', filename },
      { code: 'new Promise((r) => setInterval(r, 100))', filename },
      { code: 'new Promise((r) => foo.setTimeout(r, 100))', filename },

      // The delay uses the executor's parameters, `this` or `arguments`.
      { code: 'new Promise((r) => setTimeout(r, r.length))', filename },
      { code: 'new Promise((r, reject) => setTimeout(r, reject.length))', filename },
      { code: 'new Promise(function (r) { setTimeout(r, this.ms) })', filename },
      { code: 'new Promise(function (r) { setTimeout(r, arguments.length) })', filename },

      // Local bindings that shadow globals.
      { code: 'const Promise = P\nnew Promise((r) => setTimeout(r, 100))', filename },
      { code: 'const setTimeout = t\nnew Promise((r) => setTimeout(r, 100))', filename },

      // Already uses `sleep`.
      { code: `${IMPORT}await sleep(100)`, filename },
    ],
    invalid: [
      {
        code: 'await new Promise((resolve) => setTimeout(resolve, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise(r => setTimeout(r, ms))',
        output: `${IMPORT}await sleep(ms)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((resolve) => { setTimeout(resolve, 100) })',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((resolve) => { return setTimeout(resolve, 100) })',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((resolve) => setTimeout(() => resolve(), 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((resolve) => setTimeout(() => { resolve() }, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise(function (resolve) { setTimeout(resolve, 100) })',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((resolve, _reject) => setTimeout(resolve, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => globalThis.setTimeout(r, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => window.setTimeout(r, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => setTimeout(r, this.delay * 2))',
        output: `${IMPORT}await sleep(this.delay * 2)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => setTimeout(r, (a, b)))',
        output: `${IMPORT}await sleep((a, b))`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'const wait = () => new Promise((r) => setTimeout(r, 0))',
        output: `${IMPORT}const wait = () => sleep(0)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: "import { noop } from '@ocavue/utils'\nawait new Promise((r) => setTimeout(r, 100))",
        output: "import { noop, sleep } from '@ocavue/utils'\nawait sleep(100)",
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        // Reported without a fix.
        code: 'const sleep = 1\nawait new Promise((r) => setTimeout(r, 100))',
        output: null,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => setTimeout(r, 100 /* ms */))',
        output: null,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise((r) => setTimeout(r, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename: js.withoutUtils,
        options: [{ checkDependency: false }],
        errors: [{ messageId: 'preferSleep' }],
      },
    ],
  })
})

test('prefer-sleep with TypeScript', () => {
  const tester = new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  })
  const filename = ts.withUtils

  tester.run('prefer-sleep', rule, {
    valid: [
      // `sleep` returns `Promise<void>`.
      { code: 'await new Promise<number>((r) => setTimeout(r, 100))', filename },
    ],
    invalid: [
      {
        code: 'await new Promise<void>((resolve) => setTimeout(resolve, 100))',
        output: `${IMPORT}await sleep(100)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
      {
        code: 'await new Promise<undefined>((r) => setTimeout(r, ms as number))',
        output: `${IMPORT}await sleep(ms as number)`,
        filename,
        errors: [{ messageId: 'preferSleep' }],
      },
    ],
  })
})
