const loadEnvKey = (key) => {
  try {
    return JSON.parse(process.env[ key ])
  } catch (error) { return null }
}
const saveEnvKey = (key, value) => {
  try {
    process.env[ key ] = JSON.stringify(value)
  } catch (error) {}
}
const syncEnvKey = (key, defaultValue) => {
  const value = loadEnvKey(key) || defaultValue
  saveEnvKey(key, value)
  return value
}

const __VERBOSE__ = syncEnvKey('__DEV_VERBOSE__', process.argv.includes('verbose'))

const checkFlag = (flagList, checkFlagList) => flagList.find((flag) => checkFlagList.includes(flag))

const argvFlag = (...checkFlagList) => checkFlag(process.argv, checkFlagList)

const runMain = (main, logger, ...args) => main(logger, ...args).then(
  () => { logger.padLog(`done`) },
  (error) => {
    logger.padLog(`error`)
    console.warn(error)
    process.exit(-1)
  }
)

export {
  loadEnvKey,
  saveEnvKey,
  syncEnvKey,

  __VERBOSE__,
  checkFlag,
  argvFlag,
  runMain
}
