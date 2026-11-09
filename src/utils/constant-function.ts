import type { Rule } from 'eslint'
import type { ArrowFunctionExpression, Expression, FunctionExpression, Node } from 'estree'

export type FunctionNode = (ArrowFunctionExpression | FunctionExpression) & Rule.NodeParentExtension

/**
 * The value that a constant function returns.
 */
export type ConstantValue = 'undefined' | 'true' | 'false' | 'null'

function getConstantValue(node: Expression): ConstantValue | undefined {
  if (node.type === 'Literal') {
    switch (node.raw) {
      case 'true':
      case 'false':
      case 'null':
        return node.raw
    }
    return undefined
  }
  if (node.type === 'Identifier' && node.name === 'undefined') {
    return 'undefined'
  }
  if (
    node.type === 'UnaryExpression' &&
    node.operator === 'void' &&
    node.argument.type === 'Literal'
  ) {
    return 'undefined'
  }
  return undefined
}

function getReturnedValue(node: FunctionNode): ConstantValue | undefined {
  const body = node.body
  if (body.type !== 'BlockStatement') {
    return getConstantValue(body)
  }
  if (body.body.length === 0) {
    return 'undefined'
  }
  if (body.body.length === 1) {
    const statement = body.body[0]
    if (statement.type === 'ReturnStatement') {
      return statement.argument ? getConstantValue(statement.argument) : 'undefined'
    }
  }
  return undefined
}

/**
 * Returns true when the function can be swapped with a function reference
 * without changing runtime behavior.
 */
function isReplaceable(node: FunctionNode): boolean {
  if (node.async || node.generator) {
    return false
  }
  if ((node as { typeParameters?: unknown }).typeParameters) {
    return false
  }

  // Every parameter must be a plain identifier. Default values may have side
  // effects, and destructuring may throw.
  const hasPlainParams = node.params.every((param) => {
    return (
      param.type === 'Identifier' ||
      (param.type === 'RestElement' && param.argument.type === 'Identifier')
    )
  })
  if (!hasPlainParams) {
    return false
  }

  if (node.type === 'FunctionExpression') {
    if (node.id) {
      return false
    }
    const parent: Node = node.parent
    if (parent.type === 'Property' && (parent.method || parent.kind !== 'init')) {
      return false
    }
    if (parent.type === 'MethodDefinition') {
      return false
    }
    if (parent.type === 'NewExpression' && parent.callee === node) {
      return false
    }
  }

  return true
}

/**
 * Returns the value that an inline function always returns, such as
 * `'true'` for `() => true` or `'undefined'` for `() => {}`. Returns
 * `undefined` when the function does more than that, or when replacing it
 * could change runtime behavior.
 */
export function getConstantFunctionValue(node: FunctionNode): ConstantValue | undefined {
  return isReplaceable(node) ? getReturnedValue(node) : undefined
}
