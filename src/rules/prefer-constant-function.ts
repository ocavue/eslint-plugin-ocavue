import type { Rule } from 'eslint'

import {
  getConstantFunctionValue,
  type ConstantValue,
  type FunctionNode,
} from '../utils/constant-function'
import {
  createImportFix,
  isPackageAvailable,
  packageRuleSchema,
  UTILS_PACKAGE,
} from '../utils/package-import'

const FUNCTION_NAMES: Partial<Record<ConstantValue, string>> = {
  true: 'returnTrue',
  false: 'returnFalse',
  null: 'returnNull',
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    hasSuggestions: true,
    docs: {
      description:
        'enforce `returnTrue`, `returnFalse` and `returnNull` from `@ocavue/utils` instead of inline functions',
      url: 'https://github.com/ocavue/eslint-plugin-ocavue#prefer-constant-function',
    },
    messages: {
      preferConstantFunction: 'Use `{{name}}` from `@ocavue/utils` instead of an inline function.',
      replaceWithConstantFunction: 'Replace with `{{name}}` from `@ocavue/utils`.',
    },
    schema: packageRuleSchema,
  },
  create(context) {
    if (!isPackageAvailable(context, UTILS_PACKAGE)) {
      return {}
    }

    function check(node: FunctionNode): void {
      const value = getConstantFunctionValue(node)
      const name = value && FUNCTION_NAMES[value]
      if (!name) {
        return
      }

      // `returnFalse` returns the literal type `false`, while `() => false`
      // returns `boolean`. The swap can narrow inferred types, for example
      // `useState(() => false)`, so it is a suggestion and not an autofix.
      const fix = createImportFix({
        context,
        node,
        name,
        packageName: UTILS_PACKAGE,
        replace: (local) => local,
      })
      context.report({
        node,
        messageId: 'preferConstantFunction',
        data: { name },
        suggest: fix ? [{ messageId: 'replaceWithConstantFunction', data: { name }, fix }] : [],
      })
    }

    return {
      ArrowFunctionExpression: check,
      FunctionExpression: check,
    }
  },
}

export default rule
