import { RuleTester } from 'eslint'
import { test } from 'vitest'

import rule from './no-implicit-arrow-linebreak'

test('no-implicit-arrow-linebreak', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  })

  tester.run('no-implicit-arrow-linebreak', rule, {
    valid: [
      'const f = () => fn(123)',
      'const f = () => {\n  return fn(123)\n}',
      'const f = () => (\n  fn(123)\n)',
      'const f = async () => fn(123)',
      'const f = (a) => (b) => a + b',
    ],
    invalid: [
      {
        code: 'const f = () =>\n  fn(123)',
        output: 'const f = () => { return fn(123) }',
        errors: [{ messageId: 'linebreak' }],
      },
      {
        code: 'const f = () =>\n  (fn(123))',
        output: 'const f = () => { return (fn(123)) }',
        errors: [{ messageId: 'linebreak' }],
      },
      {
        code: 'const f = (a, b) =>\n  a + b',
        output: 'const f = (a, b) => { return a + b }',
        errors: [{ messageId: 'linebreak' }],
      },
      {
        code: 'const f = async (a) =>\n  await fn(a)',
        output: 'const f = async (a) => { return await fn(a) }',
        errors: [{ messageId: 'linebreak' }],
      },
      {
        code: 'const f = (a) => (b) =>\n  a + b',
        output: 'const f = (a) => (b) => { return a + b }',
        errors: [{ messageId: 'linebreak' }],
      },
      {
        // No autofix when a comment sits between `=>` and the body.
        code: 'const f = () => // note\n  fn(123)',
        output: null,
        errors: [{ messageId: 'linebreak' }],
      },
    ],
  })
})
