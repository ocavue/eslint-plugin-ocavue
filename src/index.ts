import noImplicitArrowLinebreak from './rules/no-implicit-arrow-linebreak'

const plugin = {
  meta: {
    name: 'eslint-plugin-ocavue',
  },
  rules: {
    'no-implicit-arrow-linebreak': noImplicitArrowLinebreak,
  },
}

export default plugin
