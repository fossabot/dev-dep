import { loadEnvKey, saveEnvKey, __VERBOSE__ } from './__utils__'

const getLogger = (title = 'dev-dep', padWidth = 160) => {
  const envTitle = loadEnvKey('__DEV_LOGGER_TITLE__')
  title = envTitle ? `${title}|${envTitle}` : title
  saveEnvKey('__DEV_LOGGER_TITLE__', title)

  const padTitle = ` [${title}]`
  const padLog = (...args) => console.log(`\n## ${args.join(' ')} `.padEnd(padWidth - padTitle.length, '-') + padTitle)
  const log = (...args) => console.log(`- ${args.join(' ')}`)
  const devLog = __VERBOSE__ ? log : () => {}
  return { padLog, log, devLog }
}

export { getLogger }
