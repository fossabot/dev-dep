module.exports = {
  env: {
    library: {
      presets: [ [ '@babel/env', { targets: '>= 5%' } ], [ '@babel/react' ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ]
      ],
      comments: false
    },
    module: {
      presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ], [ '@babel/react' ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ]
      ],
      comments: false
    }
  }
}
