import { ok } from 'assert'
import { resolve } from 'path'
import { execSync, spawnSync } from 'child_process'

import { binary as formatBinary, stringIndentLine } from 'dr-js/module/common/format'
import { getFileList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'

import { runMain } from '../source/__utils__'
import { getLogger } from '../source/logger'
import { wrapFileProcessor, fileProcessorBabel } from '../source/fileProcessor'
import { initOutput, packOutput } from '../source/commonOutput'

const PATH_ROOT = resolve(__dirname, '..')
const PATH_OUTPUT = resolve(__dirname, '../output-gitignore')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)
const fromOutput = (...args) => resolve(PATH_OUTPUT, ...args)
const execOptionRoot = { cwd: fromRoot(), stdio: 'inherit', shell: true }
const execOptionOutput = { cwd: fromOutput(), stdio: 'inherit', shell: true }

const ARGV_LIST = process.argv.slice(2)

const processSource = async ({ packageJSON, logger }) => {
  const processBabel = wrapFileProcessor({ processor: fileProcessorBabel, logger })

  logger.padLog(`build bin`)
  execSync('npm run build-bin', execOptionRoot)
  logger.padLog(`process bin`)
  let sizeCodeReduceBin = 0
  for (const filePath of await getFileList(fromOutput('bin'))) sizeCodeReduceBin += await processBabel(filePath)
  logger.log(`bin size reduce: ${formatBinary(sizeCodeReduceBin)}B`)

  logger.padLog(`build library`)
  execSync('npm run build-library', execOptionRoot)
  logger.padLog(`process library`)
  let sizeCodeReduceLibrary = 0
  for (const filePath of await getFileList(fromOutput('library'))) sizeCodeReduceLibrary += await processBabel(filePath)
  logger.log(`library-babel size reduce: ${formatBinary(sizeCodeReduceLibrary)}B`)

  logger.padLog(`total size reduce: ${formatBinary(sizeCodeReduceBin + sizeCodeReduceLibrary)}B`)

  logger.padLog('run script-generate-export')
  execSync(`npm run script-generate-export`, execOptionRoot)

  logger.padLog('verify output bin working')
  const outputBinTest = execSync('node bin --version', { ...execOptionOutput, stdio: 'pipe' }).toString()
  logger.log(`bin test output: \n${stringIndentLine(outputBinTest, '  ')}`)
  for (const testString of [ packageJSON.name, packageJSON.version ]) ok(outputBinTest.includes(testString), `should output contain: ${testString}`)
}

const DEV_DEP_LIST = [
  'dev-dep-babel',
  'dev-dep-babel-react',
  'dev-dep-web',
  'dev-dep-web-react',
  'dev-dep-web-react-postcss'
]
const packPackage = async ({ packageJSON, logger }) => {
  if (ARGV_LIST.includes('unsafe')) {
    logger.padLog(`[unsafe] skipped check-outdated`)
  } else {
    logger.padLog('run check-outdated')
    execSync(`npm run check-outdated`, execOptionRoot)
  }

  logger.padLog('clear pack')
  await modify.delete(fromRoot('output-package-gitignore'))

  DEV_DEP_LIST.forEach((devDep) => {
    logger.padLog(`pack package ${devDep}`)
    spawnSync('node', [
      './output-gitignore/bin',
      '--config', `./config/${devDep}.json`,
      '--pack',
      '--output-version', packageJSON.version,
      ...(
        ARGV_LIST.includes('publish-dev') ? [ '--publish-dev' ]
          : ARGV_LIST.includes('publish') ? [ '--publish' ] : []
      )
    ], execOptionRoot)
  })
}

runMain(async (logger) => {
  const packageJSON = await initOutput({ fromRoot, fromOutput, logger })

  if (!ARGV_LIST.includes('pack')) return
  await processSource({ packageJSON, logger })
  await packOutput({ fromRoot, fromOutput, logger })

  if (ARGV_LIST.includes('pack-package')) {
    await packPackage({ packageJSON, logger })
    return
  }

  // TODO: should allow publish both?
  ARGV_LIST.includes('publish') && execSync('npm publish', execOptionOutput)
  ARGV_LIST.includes('publish-dev') && execSync('npm publish --tag dev', execOptionOutput)
}, getLogger(ARGV_LIST.join('+')))
