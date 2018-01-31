const { resolve } = require('path')
const { DefinePlugin, BannerPlugin, optimize: { ModuleConcatenationPlugin } } = require('webpack')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')

const NODE_ENV = process.env.NODE_ENV
const IS_PRODUCTION = NODE_ENV === 'production'

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [ [ 'env', { targets: { node: 8 }, modules: false } ] ],
  plugins: [ [ 'transform-class-properties' ], [ 'transform-object-rest-spread', { useBuiltIns: true } ] ]
}

module.exports = {
  output: {
    path: resolve(__dirname, './library/'),
    filename: '[name].js',
    library: 'PACKAGE_NAME',
    libraryTarget: 'umd'
  },
  entry: {
    'index': [ 'source/index' ]
  },
  resolve: { alias: { source: resolve(__dirname, './source/') } },
  target: 'node', // support node main modules like 'fs'
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: BABEL_OPTIONS } }
    ]
  },
  plugins: [
    new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(NODE_ENV), '__DEV__': !IS_PRODUCTION }),
    ...(IS_PRODUCTION ? [
      new ModuleConcatenationPlugin(),
      new BabelMinifyPlugin(),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false })
    ] : [])
  ]
}
