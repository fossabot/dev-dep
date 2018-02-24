const { resolve } = require('path')
const { DefinePlugin, BannerPlugin } = require('webpack')

const MODE = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const IS_PRODUCTION = MODE === 'production'

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [ [ 'env', { targets: { node: 8 }, modules: false } ] ],
  plugins: [ [ 'transform-class-properties' ], [ 'transform-object-rest-spread', { useBuiltIns: true } ] ]
}

module.exports = {
  mode: MODE,
  output: {
    path: resolve(__dirname, './library/'),
    filename: '[name].js',
    library: 'PACKAGE_NAME',
    libraryTarget: 'umd'
  },
  entry: { 'index': [ 'source/index' ] },
  resolve: { alias: { source: resolve(__dirname, './source/') } },
  module: {
    rules: [ {
      test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: BABEL_OPTIONS }
    } ]
  },
  plugins: [
    new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(MODE), '__DEV__': !IS_PRODUCTION }),
    ...(IS_PRODUCTION ? [
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false })
    ] : [])
  ]

}
