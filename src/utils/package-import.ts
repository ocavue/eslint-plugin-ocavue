import type { Rule, Scope } from 'eslint'
import type { ImportDeclaration, ImportSpecifier, Node, Program } from 'estree'

import { hasDependency } from './has-dependency'

export const UTILS_PACKAGE = '@ocavue/utils'

interface PackageRuleOptions {
  checkDependency?: boolean
}

export const packageRuleSchema: Rule.RuleMetaData['schema'] = [
  {
    type: 'object',
    properties: {
      checkDependency: { type: 'boolean' },
    },
    additionalProperties: false,
  },
]

function getImportKind(node: ImportDeclaration | ImportSpecifier): string | undefined {
  return (node as { importKind?: string }).importKind
}

function getImportedName(specifier: ImportSpecifier): string {
  const imported = specifier.imported
  return imported.type === 'Identifier' ? imported.name : String(imported.value)
}

/**
 * Returns the value `import` declarations of `packageName` in the program.
 */
function getPackageImports(program: Program, packageName: string): ImportDeclaration[] {
  return program.body.filter((statement): statement is ImportDeclaration => {
    return (
      statement.type === 'ImportDeclaration' &&
      statement.source.value === packageName &&
      getImportKind(statement) !== 'type'
    )
  })
}

/**
 * Returns true when the linted file can import from `packageName`: the
 * nearest `package.json` depends on it, or the file already imports it. The
 * `checkDependency: false` option skips the check.
 */
export function isPackageAvailable(context: Rule.RuleContext, packageName: string): boolean {
  const options = (context.options[0] ?? {}) as PackageRuleOptions
  if (options.checkDependency === false) {
    return true
  }
  return (
    hasDependency(context.physicalFilename, packageName) ||
    getPackageImports(context.sourceCode.ast, packageName).length > 0
  )
}

export function findVariable(scope: Scope.Scope | null, name: string): Scope.Variable | undefined {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name)
    if (variable) {
      return variable
    }
  }
  return undefined
}

interface ImportFixOptions {
  context: Rule.RuleContext
  /** The node to replace. */
  node: Node
  /** The named export to import from `packageName`. */
  name: string
  packageName: string
  /** Returns the replacement text, given the local name of the import. */
  replace: (local: string) => string
}

/**
 * Creates a fix that replaces `node` and makes sure `name` is imported from
 * `packageName`. Returns `undefined` when the fix is not safe: the file is
 * not an ES module, the node holds comments, or another binding already uses
 * the name.
 */
export function createImportFix({
  context,
  node,
  name,
  packageName,
  replace,
}: ImportFixOptions): Rule.ReportFixer | undefined {
  const sourceCode = context.sourceCode
  const program = sourceCode.ast as Program

  if (context.languageOptions.sourceType !== 'module') {
    return undefined
  }
  if (sourceCode.getCommentsInside(node).length > 0) {
    return undefined
  }

  const scope = sourceCode.getScope(node)
  const packageImports = getPackageImports(program, packageName)

  // Reuse an existing import, including an aliased one, when it is visible
  // from the node.
  for (const declaration of packageImports) {
    for (const specifier of declaration.specifiers) {
      if (
        specifier.type !== 'ImportSpecifier' ||
        getImportKind(specifier) === 'type' ||
        getImportedName(specifier) !== name
      ) {
        continue
      }
      const local = specifier.local.name
      const variable = findVariable(scope, local)
      if (variable?.defs[0]?.node === specifier) {
        return (fixer) => fixer.replaceText(node, replace(local))
      }
    }
  }

  // Another binding with the same name is in scope.
  if (findVariable(scope, name)) {
    return undefined
  }
  // An undeclared global with the same name is used somewhere in the file.
  const globalScope = sourceCode.scopeManager.globalScope
  if (globalScope?.through.some((reference) => reference.identifier.name === name)) {
    return undefined
  }

  const replacement = replace(name)

  const namedImport = packageImports.find((declaration) => {
    return declaration.specifiers.some((specifier) => specifier.type === 'ImportSpecifier')
  })
  if (namedImport) {
    const lastSpecifier = namedImport.specifiers.at(-1)!
    return (fixer) => [
      fixer.replaceText(node, replacement),
      fixer.insertTextAfter(lastSpecifier, `, ${name}`),
    ]
  }

  const importText = `import { ${name} } from '${packageName}'`
  const lastImport = program.body.findLast((statement) => statement.type === 'ImportDeclaration')
  if (lastImport) {
    const semicolon = sourceCode.getText(lastImport).endsWith(';') ? ';' : ''
    return (fixer) => [
      fixer.replaceText(node, replacement),
      fixer.insertTextAfter(lastImport, `\n${importText}${semicolon}`),
    ]
  }

  // Insert the import after directives such as 'use client'.
  const firstStatement = program.body.find((statement) => {
    // typescript-eslint sets `directive: undefined` on every expression statement.
    return !(
      statement.type === 'ExpressionStatement' &&
      typeof (statement as { directive?: unknown }).directive === 'string'
    )
  })
  if (!firstStatement) {
    return undefined
  }
  return (fixer) => [
    fixer.replaceText(node, replacement),
    fixer.insertTextBefore(firstStatement, `${importText}\n`),
  ]
}
