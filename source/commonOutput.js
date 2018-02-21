import { statSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { binary as formatBinary } from 'dr-js/module/common/format'
import { createDirectory } from 'dr-js/module/node/file/File'
import { modify } from 'dr-js/module/node/file/Modify'

const initOutput = async ({
  fromRoot,
  fromOutput,
  logger,
  deleteKeyList = [ 'private', 'scripts', 'engines', 'devDependencies' ],
  copyPathList = [ 'LICENSE', 'README.md' ]
}) => {
  logger.padLog('reset output')
  await modify.delete(fromOutput()).catch(() => {})
  await createDirectory(fromOutput())

  logger.padLog(`init output package.json`)
  const packageJSON = require(fromRoot('package.json'))
  for (const deleteKey of deleteKeyList) delete packageJSON[ deleteKey ]
  logger.log(`dropped ${JSON.stringify(deleteKeyList)} from package.json`)
  writeFileSync(fromOutput('package.json'), JSON.stringify(packageJSON))

  logger.padLog(`init output file from root: ${JSON.stringify(copyPathList)}`)
  for (const copyPath of copyPathList) await modify.copy(fromRoot(copyPath), fromOutput(copyPath))

  return packageJSON
}

const packOutput = async ({
  fromRoot,
  fromOutput,
  logger
}) => {
  logger.padLog('run pack output')
  execSync('npm pack', { cwd: fromOutput(), stdio: 'inherit', shell: true })

  logger.padLog('move to root path')
  const packageJSON = require(fromOutput('package.json'))
  const packName = `${packageJSON.name}-${packageJSON.version}.tgz`
  await modify.move(fromOutput(packName), fromRoot(packName))
  logger.log(`pack size: ${formatBinary(statSync(fromRoot(packName)).size)}B`)
}

export { initOutput, packOutput }
