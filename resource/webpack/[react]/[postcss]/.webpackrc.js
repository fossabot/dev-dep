const { resolve } = require('path')
const { HashedModuleIdsPlugin, DefinePlugin, BannerPlugin, optimize: { CommonsChunkPlugin, ModuleConcatenationPlugin } } = require('webpack')
const ManifestPlugin = require('webpack-manifest-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BabelMinifyPlugin = require('babel-minify-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

const NODE_ENV = process.env.NODE_ENV
const IS_PRODUCTION = NODE_ENV === 'production'

const OPTIONS = {
  BABEL_LOADER: {
    babelrc: false,
    presets: [ [ 'env', { targets: IS_PRODUCTION ? '>= 5%' : { browser: 'last 2 Chrome versions' }, modules: false } ], [ 'react' ] ],
    plugins: [ [ 'transform-class-properties' ], [ 'transform-object-rest-spread', { useBuiltIns: true } ] ]
  },
  CSS_LOADER: { importLoaders: 1, localIdentName: IS_PRODUCTION ? '[hash:base64:12]' : '[name]_[local]_[hash:base64:5]' },
  POSTCSS_LOADER: { plugins: () => [ require('postcss-cssnext') ] }
}

module.exports = {
  entry: {
    vendor: [],
    index: 'pack/index'
  },
  output: {
    path: resolve(__dirname, '../../library/pack'),
    filename: IS_PRODUCTION ? '[name].[chunkhash:8].js' : '[name].js'
  },
  resolve: { alias: { pack: resolve(__dirname, '..') } },
  bail: IS_PRODUCTION, // Don't attempt to continue if there are any errors.
  devtool: IS_PRODUCTION ? 'source-map' : false,
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: [ { loader: 'babel-loader', options: OPTIONS.BABEL_LOADER } ] },
      {
        test: /\.pcss$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader', options: OPTIONS.CSS_LOADER },
            { loader: 'postcss-loader', options: OPTIONS.POSTCSS_LOADER }
          ]
        })
      }
    ]
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
      new BabelMinifyPlugin(),
      new BannerPlugin({ banner: '/* eslint-disable */', raw: true, test: /\.js$/, entryOnly: false }),
      new BannerPlugin({ banner: '/* stylelint-disable */', raw: true, test: /\.css$/, entryOnly: false }),
      new CompressionPlugin({ test: /\.(js|css)$/, minRatio: 1 })
    ] : [])
  ]
}
