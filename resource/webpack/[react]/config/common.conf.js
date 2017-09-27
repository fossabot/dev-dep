const nodeModulePath = require('path')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const MinifyPlugin = require('babel-minify-webpack-plugin')
const { HashedModuleIdsPlugin, DefinePlugin, BannerPlugin, optimize: { CommonsChunkPlugin, ModuleConcatenationPlugin } } = webpack

const NODE_ENV = process.env.NODE_ENV
const IS_PRODUCTION = NODE_ENV === 'production'

const OPTIONS = {
  BABEL_LOADER: { presets: IS_PRODUCTION ? [ [ 'es2015', { modules: false } ], 'stage-0', 'react' ] : [ 'stage-0', 'react' ] },
  CSS_LOADER: { localIdentName: IS_PRODUCTION ? '[hash:base64:12]' : '[name]_[local]_[hash:base64:5]' }
}
module.exports = {
  entry: {
    vendor: [],
    index: 'pack/index'
  },
  resolve: { alias: { pack: nodeModulePath.resolve(__dirname, '..') } },
  module: {
    rules: [ {
      test: /\.js$/,
      exclude: /node_modules/,
      use: [ { loader: 'babel-loader', options: OPTIONS.BABEL_LOADER } ]
    }, {
      test: /\.pcss$/,
      use: ExtractTextPlugin.extract({ use: [ { loader: 'css-loader', options: OPTIONS.CSS_LOADER } ] })
    }, {
      exclude: [ /\.js$/, /\.json$/, /\.pcss$/ ],
      use: [ { loader: 'file-loader', options: { name: IS_PRODUCTION ? 'static/media/[name].[hash].[ext]' : 'static/media/[name].[ext]' } } ]
    } ]
  },
  plugins: [
    new ExtractTextPlugin(IS_PRODUCTION ? '[name].[contenthash:8].css' : '[name].css'),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      '__DEV__': !IS_PRODUCTION
    }),
    new HashedModuleIdsPlugin(),
    new CommonsChunkPlugin({ name: 'vendor', minChunks: 0 }),
    new CommonsChunkPlugin({ name: 'runtime' }),
    new ManifestPlugin({ fileName: 'manifest.json' }),
    ...(IS_PRODUCTION ? [
      new ModuleConcatenationPlugin(),
      new MinifyPlugin(),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false }),
      new BannerPlugin({ banner: '/* stylelint-disable */', raw: true, test: /\.css$/, entryOnly: false }),
      new CompressionPlugin({ minRatio: 1 })
    ] : [])
  ]
}
