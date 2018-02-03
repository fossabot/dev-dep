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

const loadFlag = (flagList) => {
  const flagMap = {
    ...loadEnvKey('__DEV_FLAG_MAP__'),
    ...process.argv.slice(2).reduce((o, flag) => {
      if (flagList.includes(flag)) o[ flag ] = true
      return o
    }, {})
  }
  saveEnvKey('__DEV_FLAG_MAP__', flagMap)
  return flagMap
}

const runMain = (main, logger) => main().then(() => {
  logger.padLog(`done`)
}, (error) => {
  logger.padLog(`error`)
  console.warn(error)
  process.exit(-1)
})

export {
  loadEnvKey,
  saveEnvKey,
  syncEnvKey,

  __VERBOSE__,

  loadFlag,

  runMain
}
