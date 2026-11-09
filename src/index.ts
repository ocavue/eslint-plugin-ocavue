import type { ESLint } from 'eslint'

import { version } from '../package.json'

import noImplicitArrowLinebreak from './rules/no-implicit-arrow-linebreak'
import preferConstantFunction from './rules/prefer-constant-function'
import preferNoop from './rules/prefer-noop'
import preferWhileTrue from './rules/prefer-while-true'

const plugin = {
  meta: {
    name: 'eslint-plugin-ocavue',
    version,
  },
  rules: {
    'no-implicit-arrow-linebreak': noImplicitArrowLinebreak,
    'prefer-constant-function': preferConstantFunction,
    'prefer-noop': preferNoop,
    'prefer-while-true': preferWhileTrue,
  },
} satisfies ESLint.Plugin

export default plugin
