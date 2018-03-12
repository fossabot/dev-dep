module.exports = {
  presets: [ [ '@babel/env', { targets: { node: 8 } } ] ],
  plugins: [
    [ '@babel/proposal-class-properties' ],
    [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ],
    [ 'module-resolver', { root: [ './' ], alias: { 'dr-js/module/(.+)': 'dr-js/library/' } } ]
  ],
  comments: false
}
