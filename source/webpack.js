import webpack from 'webpack'
import { binary, time } from 'dr-js/module/common/format'

const compileWithWebpack = async ({ config, isWatch, logger }) => {
  const compiler = webpack(config)

  const logStats = (stats) => {
    const { compilation: { assets }, startTime, endTime } = stats
    isWatch && logger.padLog(`watch`)
    Object.entries(assets).forEach(([ name, sourceInfo ]) => sourceInfo.emitted && logger.log(`emitted asset: ${name} [${binary(sourceInfo.size())}B]`))
    logger.log(`compile time: ${time(endTime - startTime)}`)
  }

  if (isWatch) {
    compiler.watch(
      { aggregateTimeout: 300, poll: undefined },
      getStatsCheck((error) => logger.log(`error: ${error}`), logStats)
    )
  } else {
    const stats = await new Promise((resolve, reject) => compiler.run(getStatsCheck(reject, resolve)))
    logStats(stats)
  }
}

const getStatsCheck = (onError, onStats) => (error, stats) => {
  if (error) return onError(error)
  if (stats.hasErrors() || stats.hasWarnings()) {
    const { errors = [], warnings = [] } = stats.toJson()
    errors.forEach((message) => console.error(message))
    warnings.forEach((message) => console.warn(message))
    if (stats.hasErrors()) return onError(new Error('webpack stats Error'))
  }
  onStats(stats)
}

export { compileWithWebpack }
