import { ok } from 'assert'
import { resolve } from 'path'
import { execSync, spawnSync } from 'child_process'

import { binary as formatBinary, stringIndentLine } from 'dr-js/module/common/format'
import { getFileList } from 'dr-js/module/node/file/Directory'

import { runMain } from '../source-tool/__utils__'
import { getLogger } from '../source-tool/logger'
import { wrapFileProcessor, fileProcessorBabel } from '../source-tool/fileProcessor'
import { initOutput, packOutput } from '../source-tool/commonOutput'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }

const argvList = process.argv.slice(2)
const logger = getLogger([ 'dev-dep-tool', ...argvList ].join('|'))
const { padLog, log } = logger

const processSource = async ({ packageJSON }) => {
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })

  padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)
  padLog(`process bin`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) sizeCodeReduceBin += await processBabel(filePath)
  log(`bin size reduce: ${formatBinary(sizeCodeReduceBin)}B`)

  padLog(`build tool`)
  execSync('npm run build-tool', execOptionRoot)
  padLog(`process tool`)
  let sizeCodeReduceTool = 0
  for (const filePath of await getFileList(fromOutput('tool'))) sizeCodeReduceTool += await processBabel(filePath)
  log(`module size reduce: ${formatBinary(sizeCodeReduceTool)}B`)

  padLog(`build library`)
  execSync('npm run build-library', execOptionRoot)
  padLog(`process library`)
  let sizeCodeReduceLibrary = 0
  for (const filePath of await getFileList(fromOutput('library'))) sizeCodeReduceLibrary += await processBabel(filePath)
  log(`library-babel size reduce: ${formatBinary(sizeCodeReduceLibrary)}B`)

  padLog(`total size reduce: ${formatBinary(sizeCodeReduceBin + sizeCodeReduceTool + sizeCodeReduceLibrary)}B`)

  padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  log(`bin test output: \n${stringIndentLine(outputBinTest, '  ')}`)
  for (const testString of [ packageJSON.name, packageJSON.version ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

const DEV_DEP_LIST = [
  'dev-dep-babel',
  'dev-dep-babel-react',
  'dev-dep-web',
  'dev-dep-web-react',
  'dev-dep-web-react-postcss'
]
const packPackage = ({ packageJSON }) => {
  padLog('run pack-check-outdated')
  execSync(`npm run pack-check-outdated`, execOptionRoot)

  padLog('run pack-clear')
  execSync(`npm run pack-clear`, execOptionRoot)

  DEV_DEP_LIST.forEach((devDep) => {
    padLog(`pack package ${devDep}`)
    spawnSync('node', [
      './output-gitignore/bin',
      '--config', `./config/${devDep}.json`,
      '--pack',
      '--output-version', packageJSON.version,
      ...(
        argvList.includes('publish-dev') ? [ 'publish-dev' ]
          : argvList.includes('publish') ? [ 'publish' ] : []
      )
    ], execOptionRoot)
  })
}

runMain(async () => {
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!argvList.includes('pack')) return
  await processSource({ packageJSON })
  await packOutput({ fromRoot, fromOutput, logger })

  if (argvList.includes('pack-package')) {
    await packPackage({ packageJSON })
    return
  }
  argvList.includes('publish') && execSync('npm publish', execOptionOutput)
  argvList.includes('publish-dev') && execSync('npm publish --tag dev', execOptionOutput)
}, logger)
