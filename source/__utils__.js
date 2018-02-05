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

const __VERBOSE__ = syncEnvKey('__DEV_VERBOSE__', process.argv.slice(2).includes('verbose'))

const loadFlag = (validFlagList) => {
  const rawFlagList = [
    ...(loadEnvKey('__DEV_FLAG_LIST__') || []),
    ...process.argv.slice(2)
  ]
  const flagList = validFlagList.filter((flag) => rawFlagList.includes(flag))
  saveEnvKey('__DEV_FLAG_LIST__', flagList)
  return flagList
}
const checkFlag = (flagList, checkFlagList, defaultFlag) => flagList.find((flag) => checkFlagList.includes(flag)) || defaultFlag

const runMain = (main, logger) => main(logger).then(
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

  loadFlag,
  checkFlag,

  runMain
}
