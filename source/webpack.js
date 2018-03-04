import { writeFileSync } from 'fs'
import webpack from 'webpack'
import { binary, time } from 'dr-js/module/common/format'
import { setProcessExitListener } from 'dr-js/module/node/system/ProcessExitListener'

const getStatsCheck = (onError, onStats) => (error, statsData) => {
  if (error) return onError(error)
  if (statsData.hasErrors() || statsData.hasWarnings()) {
    const { errors = [], warnings = [] } = statsData.toJson()
    errors.forEach((message) => console.error(message))
    warnings.forEach((message) => console.warn(message))
    if (statsData.hasErrors()) return onError(new Error('webpack stats Error'))
  }
  onStats(statsData)
}

const getLogStats = (isWatch, logger) => {
  const logSingleStats = ({ compilation: { assets }, startTime, endTime }) => {
    isWatch && logger.padLog(`watch`)
    Object.entries(assets).forEach(([ name, sourceInfo ]) => sourceInfo.emitted && logger.log(`emitted asset: ${name} [${binary(sourceInfo.size())}B]`))
    startTime && endTime && logger.log(`compile time: ${time(endTime - startTime)}`)
  }

  return (statsData) => {
    if (statsData.compilation) logSingleStats(statsData) // Stats
    else if (statsData.stats) statsData.stats.map(logSingleStats) // MultiStats
    else {
      console.warn(`[getLogStats] unexpected statData`, statsData)
      throw new Error(`[getLogStats] unexpected statData`)
    }
  }
}

const compileWithWebpack = async ({ config, isWatch, profileOutput, logger }) => {
  if (profileOutput && isWatch) logger.log(`[watch] warning: skipped generate profileOutput`)
  if (profileOutput) config.profile = true

  const compiler = webpack(config)
  const logStats = getLogStats(isWatch, logger)

  if (isWatch) {
    logger.log(`[watch] start`)
    const { eventType, code } = await new Promise((resolve) => {
      compiler.watch(
        { aggregateTimeout: 300, poll: undefined },
        getStatsCheck((error) => logger.log(`error: ${error}`), logStats)
      )
      setProcessExitListener({ listenerSync: resolve })
    })
    logger.log(`[watch] exit with eventType: ${eventType}, code: ${code}`)
    return null
  }

  const statsData = await new Promise((resolve, reject) => compiler.run(getStatsCheck(reject, resolve)))
  logStats(statsData)
  if (profileOutput) {
    writeFileSync(profileOutput, JSON.stringify(statsData.toJson()))
    logger.log(`generated profileOutput: ${profileOutput}`)
  }
  return statsData
}

export { compileWithWebpack }
