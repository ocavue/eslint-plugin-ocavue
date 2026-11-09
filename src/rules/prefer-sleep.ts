import type { Rule, Scope } from 'eslint'
import type {
  ArrowFunctionExpression,
  CallExpression,
  Expression,
  FunctionExpression,
  Node,
  SpreadElement,
} from 'estree'

import {
  createImportFix,
  findVariable,
  isPackageAvailable,
  packageRuleSchema,
  UTILS_PACKAGE,
} from '../utils/package-import'

type FunctionNode = ArrowFunctionExpression | FunctionExpression

function isFunction(node: Node): node is FunctionNode {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression'
}

/**
 * Returns true when `name` refers to a global variable, not a local binding.
 */
function isGlobal(scope: Scope.Scope, name: string): boolean {
  const variable = findVariable(scope, name)
  return !variable || variable.defs.length === 0
}

/**
 * Returns the only expression that a function body evaluates, for bodies
 * such as `x`, `{ x }` and `{ return x }`.
 */
function getOnlyExpression(node: FunctionNode): Expression | undefined {
  const body = node.body
  if (body.type !== 'BlockStatement') {
    return body
  }
  if (body.body.length !== 1) {
    return undefined
  }
  const statement = body.body[0]
  if (statement.type === 'ExpressionStatement') {
    return statement.expression
  }
  if (statement.type === 'ReturnStatement' && statement.argument) {
    return statement.argument
  }
  return undefined
}

function isIdentifier(node: Node | SpreadElement, name: string): boolean {
  return node.type === 'Identifier' && node.name === name
}

/**
 * Returns true for `setTimeout`, `globalThis.setTimeout` and
 * `window.setTimeout`.
 */
function isSetTimeout(node: Expression, scope: Scope.Scope): boolean {
  if (node.type === 'Identifier') {
    return node.name === 'setTimeout' && isGlobal(scope, 'setTimeout')
  }
  return (
    node.type === 'MemberExpression' &&
    !node.computed &&
    isIdentifier(node.property, 'setTimeout') &&
    node.object.type === 'Identifier' &&
    (node.object.name === 'globalThis' || node.object.name === 'window') &&
    isGlobal(scope, node.object.name)
  )
}

/**
 * Returns true for `resolve` and `() => resolve()`.
 */
function isResolveCallback(node: Expression | SpreadElement, resolve: string): boolean {
  if (isIdentifier(node, resolve)) {
    return true
  }
  if (!isFunction(node) || node.async || node.generator || node.params.length > 0) {
    return false
  }
  const expression = getOnlyExpression(node)
  return (
    expression?.type === 'CallExpression' &&
    isIdentifier(expression.callee, resolve) &&
    expression.arguments.length === 0
  )
}

/**
 * Returns true for no type argument, `<void>` and `<undefined>`.
 */
function hasVoidTypeArgument(node: Node): boolean {
  const typeArguments = (node as { typeArguments?: { params: { type: string }[] } }).typeArguments
  if (!typeArguments) {
    return true
  }
  return (
    typeArguments.params.length === 1 &&
    (typeArguments.params[0].type === 'TSVoidKeyword' ||
      typeArguments.params[0].type === 'TSUndefinedKeyword')
  )
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'enforce `sleep` from `@ocavue/utils` instead of `new Promise` with `setTimeout`',
      url: 'https://github.com/ocavue/eslint-plugin-ocavue#prefer-sleep',
    },
    messages: {
      preferSleep: 'Use `sleep` from `@ocavue/utils` instead of `new Promise` with `setTimeout`.',
    },
    schema: packageRuleSchema,
  },
  create(context) {
    if (!isPackageAvailable(context, UTILS_PACKAGE)) {
      return {}
    }

    const sourceCode = context.sourceCode

    /**
     * Returns the delay expression of `new Promise((resolve) =>
     * setTimeout(resolve, delay))`, or `undefined` when the node does not
     * match.
     */
    function getDelay(node: Node): Expression | undefined {
      if (
        node.type !== 'NewExpression' ||
        !isIdentifier(node.callee, 'Promise') ||
        node.arguments.length !== 1 ||
        !hasVoidTypeArgument(node)
      ) {
        return undefined
      }
      if (!isGlobal(sourceCode.getScope(node), 'Promise')) {
        return undefined
      }

      const executor = node.arguments[0]
      if (!isFunction(executor) || executor.async || executor.generator) {
        return undefined
      }
      if (!executor.params.every((param) => param.type === 'Identifier')) {
        return undefined
      }
      const resolveParam = executor.params[0]
      if (resolveParam?.type !== 'Identifier') {
        return undefined
      }

      const call = getOnlyExpression(executor)
      if (call?.type !== 'CallExpression' || call.optional) {
        return undefined
      }
      const executorScope = sourceCode.getScope(executor)
      if (!isSetTimeout(call.callee as Expression, executorScope)) {
        return undefined
      }

      const [callback, delay] = (call as CallExpression).arguments
      if (call.arguments.length !== 2 || !delay || delay.type === 'SpreadElement') {
        return undefined
      }
      if (!isResolveCallback(callback, resolveParam.name)) {
        return undefined
      }

      // The delay moves out of the executor, so it must not use the
      // executor's parameters, `this` or `arguments`.
      const usesExecutorParams = executorScope.variables.some((variable) => {
        return variable.references.some((reference) => {
          const range = reference.identifier.range!
          return range[0] >= delay.range![0] && range[1] <= delay.range![1]
        })
      })
      if (usesExecutorParams) {
        return undefined
      }
      if (
        executor.type === 'FunctionExpression' &&
        sourceCode.getTokens(delay).some((token) => {
          return token.value === 'this' || token.value === 'arguments'
        })
      ) {
        return undefined
      }

      return delay
    }

    return {
      NewExpression(node) {
        const delay = getDelay(node)
        if (!delay) {
          return
        }
        const delayText = sourceCode.getText(delay)
        context.report({
          node,
          messageId: 'preferSleep',
          fix: createImportFix({
            context,
            node,
            name: 'sleep',
            packageName: UTILS_PACKAGE,
            replace: (local) => {
              return delay.type === 'SequenceExpression'
                ? `${local}((${delayText}))`
                : `${local}(${delayText})`
            },
          }),
        })
      },
    }
  },
}

export default rule
