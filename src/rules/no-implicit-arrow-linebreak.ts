import type { Rule } from 'eslint'

const rule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'code',
    docs: {
      description:
        'disallow a linebreak between `=>` and an implicit arrow function body, fixing it to a block body with `return`',
      url: 'https://github.com/ocavue/eslint-plugin-ocavue#no-implicit-arrow-linebreak',
    },
    messages: {
      linebreak:
        'Implicit arrow body must not start on a new line. Use a block body with `return` instead.',
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode
    return {
      ArrowFunctionExpression(node) {
        if (node.body.type === 'BlockStatement') {
          return
        }

        const arrowToken = sourceCode.getTokenBefore(node.body, {
          filter: (token) => token.type === 'Punctuator' && token.value === '=>',
        })
        if (!arrowToken) {
          return
        }
        const firstBodyToken = sourceCode.getTokenAfter(arrowToken)
        // The last token of the arrow function. When the body is wrapped in
        // parentheses, this is the closing `)`, so the fix keeps the parens.
        const lastToken = sourceCode.getLastToken(node)
        if (!firstBodyToken || !lastToken) {
          return
        }
        if (arrowToken.loc.end.line === firstBodyToken.loc.start.line) {
          return
        }

        // The fix rewrites the region between `=>` and the body, so bail out
        // of fixing (but still report) if that region contains comments.
        const canFix = !sourceCode.commentsExistBetween(arrowToken, firstBodyToken)

        context.report({
          node: node.body,
          messageId: 'linebreak',
          fix: canFix
            ? (fixer) => {
                const bodyText = sourceCode.text.slice(firstBodyToken.range[0], lastToken.range[1])
                return fixer.replaceTextRange(
                  [arrowToken.range[1], lastToken.range[1]],
                  ` { return ${bodyText} }`,
                )
              }
            : undefined,
        })
      },
    }
  },
}

export default rule
