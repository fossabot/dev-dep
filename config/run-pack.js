const nodeModulePath = require('path')
const { execSync } = require('child_process')
const { Verify } = require('dr-js/library/common')

const PATH_ROOT = nodeModulePath.resolve(__dirname, '..')

const getLogger = (title) => {
  const log = (...args) => console.log(`- ${args.join(' ')}`)
  const padTitle = ` [${title}]`
  const padLog = (...args) => console.log(`## ${args.join(' ')} `.padEnd(160 - padTitle.length, '-') + padTitle)
  return { log, padLog }
}

const DEV_DEP_LIST = [
  'dev-dep-babel',
  'dev-dep-babel-react',
  'dev-dep-web',
  'dev-dep-web-react',
  'dev-dep-web-react-postcss'
]

const main = async () => {
  const { log, padLog } = getLogger('run-pack')

  const [ , , MODE = 'pack-only' ] = process.argv
  Verify.oneOf(MODE, [ 'pack-only', 'pack-publish' ])
  log(`MODE: ${MODE}`)

  const execOptionRoot = { cwd: PATH_ROOT, stdio: 'inherit', shell: true }

  padLog('run build')
  execSync(`npm run build`, execOptionRoot)

  padLog('run pack-check-outdated')
  execSync(`npm run pack-check-outdated`, execOptionRoot)

  padLog('run pack-clear')
  execSync(`npm run pack-clear`, execOptionRoot)

  DEV_DEP_LIST.forEach((devDep) => {
    padLog(`[${MODE}] ${devDep}`)
    execSync(`node ./library -c ./config/${devDep}.json -m ${MODE}`, execOptionRoot)
  })
  padLog(`done`)
}

main().catch((error) => {
  console.warn(error)
  process.exit(-1)
})
