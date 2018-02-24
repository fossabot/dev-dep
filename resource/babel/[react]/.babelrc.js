const getReplaceDEV = (value) => ({ replacements: [ { identifierName: '__DEV__', replacement: { type: 'booleanLiteral', value } } ] })

module.exports = {
  env: {
    dev: { // __DEV__ = true, use require()
      presets: [ [ 'env', { targets: { node: 8 } } ], [ 'react' ] ],
      plugins: [
        [ 'proposal-class-properties' ],
        [ 'proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(true) ]
      ]
    },
    library: { // __DEV__ = false, use require()
      presets: [ [ 'env', { targets: '>= 5%' } ], [ 'react' ] ],
      plugins: [
        [ 'proposal-class-properties' ],
        [ 'proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    },
    module: { // __DEV__ = false, use import from, remove unused code & comment
      presets: [ [ 'env', { targets: '>= 5%', modules: false } ], [ 'react' ] ],
      plugins: [
        [ 'proposal-class-properties' ],
        [ 'proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    }
  }
}
