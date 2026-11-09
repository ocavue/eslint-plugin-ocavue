import type { Rule } from 'eslint'

import { getConstantFunctionValue, type FunctionNode } from '../utils/constant-function'
import {
  createImportFix,
  isPackageAvailable,
  packageRuleSchema,
  UTILS_PACKAGE,
} from '../utils/package-import'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'enforce `noop` from `@ocavue/utils` instead of inline empty functions',
      url: 'https://github.com/ocavue/eslint-plugin-ocavue#prefer-noop',
    },
    messages: {
      preferNoop: 'Use `noop` from `@ocavue/utils` instead of an inline empty function.',
    },
    schema: packageRuleSchema,
  },
  create(context) {
    if (!isPackageAvailable(context, UTILS_PACKAGE)) {
      return {}
    }

    function check(node: FunctionNode): void {
      if (getConstantFunctionValue(node) !== 'undefined') {
        return
      }
      context.report({
        node,
        messageId: 'preferNoop',
        fix: createImportFix({
          context,
          node,
          name: 'noop',
          packageName: UTILS_PACKAGE,
          replace: (local) => local,
        }),
      })
    }

    return {
      ArrowFunctionExpression: check,
      FunctionExpression: check,
    }
  },
}

export default rule
