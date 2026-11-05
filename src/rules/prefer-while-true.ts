import type { Rule } from 'eslint'

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'enforce `while (true)` instead of `for (;;)` for infinite loops',
      url: 'https://github.com/ocavue/eslint-plugin-ocavue#prefer-while-true',
    },
    messages: {
      preferWhileTrue: 'Use `while (true)` instead of `for (;;)`.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    return {
      ForStatement(node) {
        if (node.init || node.test || node.update) {
          return
        }

        const forToken = sourceCode.getFirstToken(node)
        const closingParen = sourceCode.getTokenBefore(node.body)
        if (!forToken || !closingParen) {
          return
        }

        // Bail out of fixing (but still report) if the loop head contains
        // comments, so the fix never drops a comment.
        const canFix = !sourceCode.commentsExistBetween(forToken, closingParen)

        context.report({
          node,
          loc: { start: forToken.loc.start, end: closingParen.loc.end },
          messageId: 'preferWhileTrue',
          fix: canFix
            ? (fixer) => {
                return fixer.replaceTextRange(
                  [forToken.range[0], closingParen.range[1]],
                  'while (true)',
                )
              }
            : undefined,
        })
      },
    }
  },
}

export default rule
