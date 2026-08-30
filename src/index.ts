import type { ESLint } from 'eslint'

import { version } from '../package.json'

import noImplicitArrowLinebreak from './rules/no-implicit-arrow-linebreak'

const plugin = {
  meta: {
    name: 'eslint-plugin-ocavue',
    version,
  },
  rules: {
    'no-implicit-arrow-linebreak': noImplicitArrowLinebreak,
  },
} satisfies ESLint.Plugin

export default plugin
