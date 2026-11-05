import { RuleTester } from 'eslint'
import { test } from 'vitest'

import rule from './prefer-while-true'

test('prefer-while-true', () => {
  const tester = new RuleTester({
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  })

  tester.run('prefer-while-true', rule, {
    valid: [
      'while (true) {}',
      'for (let i = 0; i < 10; i++) {}',
      'for (; i < 10; ) {}',
      'for (let i = 0; ; i++) {}',
      'for (const x of xs) {}',
    ],
    invalid: [
      {
        code: 'for (;;) {\n  fn()\n}',
        output: 'while (true) {\n  fn()\n}',
        errors: [{ messageId: 'preferWhileTrue' }],
      },
      {
        code: 'for ( ; ; ) fn()',
        output: 'while (true) fn()',
        errors: [{ messageId: 'preferWhileTrue' }],
      },
      {
        code: 'outer: for (;;) {\n  for (;;) break outer\n}',
        output: 'outer: while (true) {\n  while (true) break outer\n}',
        errors: [{ messageId: 'preferWhileTrue' }, { messageId: 'preferWhileTrue' }],
      },
      {
        // No autofix when a comment sits inside the loop head.
        code: 'for (; /* forever */ ;) {}',
        output: null,
        errors: [{ messageId: 'preferWhileTrue' }],
      },
    ],
  })
})
