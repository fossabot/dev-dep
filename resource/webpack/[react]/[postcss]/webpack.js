import { resolve as resolvePath } from 'path'
import { DefinePlugin, HashedModuleIdsPlugin } from 'webpack'
import ManifestPlugin from 'webpack-manifest-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { compileWithWebpack } from 'dev-dep-tool/library/webpack'
import { getLogger } from 'dev-dep-tool/library/logger'

const PATH_ROOT = resolvePath(__dirname, '..')
const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)

runMain(async (logger) => {
  const MODE = argvFlag('development', 'production') || 'production'
  const IS_PRODUCTION = MODE === 'production'
  const OPTIONS = {
    BABEL_LOADER: {
      babelrc: false,
      cacheDirectory: IS_PRODUCTION,
      presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ], [ '@babel/react' ] ],
      plugins: [ [ '@babel/proposal-class-properties' ], [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ] ]
    },
    CSS_LOADER: { importLoaders: 1, localIdentName: IS_PRODUCTION ? '[hash:base64:12]' : '[name]_[local]_[hash:base64:5]' },
    POSTCSS_LOADER: { plugins: () => [ require('postcss-cssnext') ] }
  }
  const EXTRACT_TEXT_OPTION = {
    use: [
      { loader: 'css-loader', options: OPTIONS.CSS_LOADER },
      { loader: 'postcss-loader', options: OPTIONS.POSTCSS_LOADER }
    ]
  }

  const config = {
    mode: MODE,
    output: { path: fromRoot('output-gitignore/'), filename: IS_PRODUCTION ? '[name].[chunkhash:8].js' : '[name].js', library: 'PACKAGE_NAME', libraryTarget: 'umd' },
    entry: { 'index': 'source/index' },
    resolve: { alias: { source: fromRoot('source') } },
    module: {
      rules: [
        { test: /\.js$/, exclude: /node_modules/, use: [ { loader: 'babel-loader', options: OPTIONS.BABEL_LOADER } ] },
        { test: /\.pcss$/, use: ExtractTextPlugin.extract(EXTRACT_TEXT_OPTION) }
      ]
    },
    plugins: [
      new ExtractTextPlugin(IS_PRODUCTION ? '[name].[contenthash:8].css' : '[name].css'),
      new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(MODE), '__DEV__': !IS_PRODUCTION }),
      new HashedModuleIdsPlugin(),
      new ManifestPlugin({ fileName: 'manifest.json' })
    ]
  }

  logger.padLog(`compile with webpack mode: ${MODE}`)
  await compileWithWebpack({ config, isWatch: !IS_PRODUCTION, logger })
}, getLogger(`webpack`))
