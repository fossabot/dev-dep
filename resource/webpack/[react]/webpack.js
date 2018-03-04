import { resolve as resolvePath } from 'path'
import { DefinePlugin, HashedModuleIdsPlugin } from 'webpack'
import ManifestPlugin from 'webpack-manifest-plugin'

import { argvFlag, runMain } from 'dev-dep-tool/library/__utils__'
import { compileWithWebpack } from 'dev-dep-tool/library/webpack'
import { getLogger } from 'dev-dep-tool/library/logger'

const PATH_ROOT = resolvePath(__dirname, '..')
const fromRoot = (...args) => resolvePath(PATH_ROOT, ...args)

runMain(async (logger) => {
  const mode = argvFlag('development', 'production') || 'production'
  const profileOutput = argvFlag('profile') ? fromRoot('profile-stat-gitignore.json') : null
  const isWatch = argvFlag('watch')
  const isProduction = mode === 'production'

  const babelOption = {
    babelrc: false,
    cacheDirectory: isProduction,
    presets: [ [ '@babel/env', { targets: { node: 8 }, modules: false } ], [ '@babel/react' ] ],
    plugins: [ [ '@babel/proposal-class-properties' ], [ '@babel/proposal-object-rest-spread', { useBuiltIns: true } ] ]
  }

  const config = {
    mode,
    bail: isProduction,
    output: { path: fromRoot('output-gitignore/'), filename: isProduction ? '[name].[chunkhash:8].js' : '[name].js', library: 'PACKAGE_NAME', libraryTarget: 'umd' },
    entry: { 'index': 'source/index' },
    resolve: { alias: { source: fromRoot('source') } },
    module: { rules: [ { test: /\.js$/, exclude: /node_modules/, use: [ { loader: 'babel-loader', options: babelOption } ] } ] },
    plugins: [
      new DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(mode), '__DEV__': !isProduction }),
      new HashedModuleIdsPlugin(),
      new ManifestPlugin({ fileName: 'manifest.json' })
    ]
  }

  logger.padLog(`compile with webpack mode: ${mode}`)
  await compileWithWebpack({ config, isWatch: !isProduction, logger })

  logger.padLog(`compile with webpack mode: ${mode}, isWatch: ${Boolean(isWatch)}`)
  await compileWithWebpack({ config, isWatch, profileOutput, logger })
}, getLogger(`webpack`))
