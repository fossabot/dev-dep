const nodeModulePath = require('path')
const webpack = require('webpack')
const { DefinePlugin, BannerPlugin, optimize: { ModuleConcatenationPlugin } } = webpack

const NODE_ENV = process.env.NODE_ENV
const PRODUCTION = NODE_ENV === 'production'

const BABEL_OPTIONS = {
  babelrc: false,
  presets: [ [ 'env', { targets: { node: 8 }, modules: false } ] ],
  plugins: [ 'transform-object-rest-spread', 'transform-class-properties' ]
}

module.exports = {
  entry: {
    'index': [ nodeModulePath.join(__dirname, '../source/index') ]
  },
  resolve: {
    alias: { source: nodeModulePath.resolve(__dirname, '../source') }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: BABEL_OPTIONS }
      }
    ]
  },
  target: 'node', // support node main modules like 'fs'
  plugins: [].concat(
    new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(NODE_ENV), '__DEV__': !PRODUCTION }),
    PRODUCTION ? [
      new ModuleConcatenationPlugin(),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false })
    ] : []
  )
}
