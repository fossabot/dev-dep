const getReplaceDEV = (value) => ({ replacements: [ { identifierName: '__DEV__', replacement: { type: 'booleanLiteral', value } } ] })

module.exports = {
  env: {
    dev: { // __DEV__ = true, use require()
      presets: [ [ '@babel/env', { targets: { node: 8 } } ], [ '@babel/react' ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(true) ]
      ]
    },
    library: { // __DEV__ = false, use require()
      presets: [ [ '@babel/env', { targets: '>= 5%' } ], [ '@babel/react' ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    },
    module: { // __DEV__ = false, use import from, remove unused code & comment
      presets: [ [ '@babel/env', { targets: '>= 5%', modules: false } ], [ '@babel/react' ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ],
        [ 'minify-replace', getReplaceDEV(false) ],
        [ 'minify-guarded-expressions' ],
        [ 'minify-dead-code-elimination' ]
      ],
      comments: false
    }
  }
}
