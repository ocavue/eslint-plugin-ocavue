import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { test } from 'vitest'

import { useUtilsProjects } from '../utils/test-projects'

import rule from './prefer-constant-function'

const js = useUtilsProjects('js')
const ts = useUtilsProjects('ts')

function suggestion(name: string, output: string) {
  return {
    messageId: 'preferConstantFunction',
    data: { name },
    suggestions: [{ messageId: 'replaceWithConstantFunction', data: { name }, output }],
  }
}

test('prefer-constant-function', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  })
  const filename = js.withUtils

  tester.run('prefer-constant-function', rule, {
    valid: [
      // The project does not depend on `@ocavue/utils`.
      { code: 'f(() => true)', filename: js.withoutUtils },
      // `@ocavue/utils` itself.
      { code: 'f(() => true)', filename: js.utilsRepo },

      // `prefer-noop` handles empty functions.
      { code: 'f(() => {})', filename },
      { code: 'f(() => undefined)', filename },

      // Other values.
      { code: 'f(() => 0)', filename },
      { code: "f(() => '')", filename },
      { code: 'f(() => !0)', filename },

      // Replacing would change runtime behavior.
      { code: 'f(async () => true)', filename },
      { code: 'f(({ a }) => false)', filename },
      { code: 'const o = { get foo() { return null } }', filename },
    ],
    invalid: [
      {
        // Suggestions only: `--fix` leaves the code unchanged.
        code: 'f(() => true)',
        output: null,
        filename,
        errors: [
          suggestion('returnTrue', "import { returnTrue } from '@ocavue/utils'\nf(returnTrue)"),
        ],
      },
      {
        code: 'f((_event) => { return false })',
        output: null,
        filename,
        errors: [
          suggestion('returnFalse', "import { returnFalse } from '@ocavue/utils'\nf(returnFalse)"),
        ],
      },
      {
        code: 'f(function () { return null })',
        output: null,
        filename,
        errors: [
          suggestion('returnNull', "import { returnNull } from '@ocavue/utils'\nf(returnNull)"),
        ],
      },
      {
        code: "import { noop } from '@ocavue/utils'\nf(() => true, () => null)",
        output: null,
        filename,
        errors: [
          suggestion(
            'returnTrue',
            "import { noop, returnTrue } from '@ocavue/utils'\nf(returnTrue, () => null)",
          ),
          suggestion(
            'returnNull',
            "import { noop, returnNull } from '@ocavue/utils'\nf(() => true, returnNull)",
          ),
        ],
      },
      {
        // No suggestion when another binding uses the name.
        code: 'const returnTrue = 1\nf(() => true)',
        output: null,
        filename,
        errors: [{ messageId: 'preferConstantFunction', suggestions: [] }],
      },
      {
        code: 'f(() => true)',
        output: null,
        filename: js.withoutUtils,
        options: [{ checkDependency: false }],
        errors: [
          suggestion('returnTrue', "import { returnTrue } from '@ocavue/utils'\nf(returnTrue)"),
        ],
      },
    ],
  })
})

test('prefer-constant-function with TypeScript', () => {
  const tester = new RuleTester({
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  })
  const filename = ts.withUtils

  tester.run('prefer-constant-function', rule, {
    valid: [{ code: 'f(<T,>() => null)', filename }],
    invalid: [
      {
        code: 'const isReady = (): boolean => false',
        output: null,
        filename,
        errors: [
          suggestion(
            'returnFalse',
            "import { returnFalse } from '@ocavue/utils'\nconst isReady = returnFalse",
          ),
        ],
      },
    ],
  })
})
