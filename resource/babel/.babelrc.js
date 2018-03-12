module.exports = {
  env: {
    library: {
      presets: [ [ '@babel/env', { targets: { node: 8 } } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ]
      ],
      comments: false
    },
    module: {
      presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ] ],
      plugins: [
        [ '@babel/proposal-class-properties' ],
        [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
        [ 'module-resolver', { root: [ './' ] } ]
      ],
      comments: false
    }
  }
}
