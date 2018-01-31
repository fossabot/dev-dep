import { join as joinPath, resolve, dirname } from 'path'
import { statSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

import { stringIndentLine, binary as formatBinary } from 'dr-js/module/common/format'
import { objectMergeDeep, objectSortKey } from 'dr-js/module/common/data/__utils__'
import { createDirectory } from 'dr-js/module/node/file/File'
import { modify } from 'dr-js/module/node/file/Modify'

const GET_INITIAL_PACKAGE_INFO = () => ({
  packageJSON: {},
  exportFilePairList: [],
  installFilePairList: []
})

const loadPackage = (packagePath, packageInfo = GET_INITIAL_PACKAGE_INFO(), loadedSet = new Set()) => {
  const packageFile = packagePath.endsWith('.json')
    ? packagePath
    : joinPath(packagePath, 'package.json')
  if (packagePath.endsWith('.json')) packagePath = dirname(packagePath)
  if (loadedSet.has(packageFile)) return packageInfo
  loadedSet.add(packageFile)

  const {
    IMPORT: importList,
    EXPORT: exportList,
    INSTALL: installList,
    ...mergePackageJSON
  } = require(packageFile)
  const { packageJSON, exportFilePairList, installFilePairList } = packageInfo

  importList && importList.forEach((importPackagePath) => loadPackage(resolve(packagePath, importPackagePath), packageInfo, loadedSet))

  console.log(`[loadPackage] load: ${packageFile}`)
  installList && installList.forEach((filePath) => installFilePairList.push(parseResourcePath(filePath, packagePath)))
  exportList && exportList.forEach((filePath) => exportFilePairList.push(parseResourcePath(filePath, packagePath)))
  mergePackageJSON && objectMergeDeep(packageJSON, mergePackageJSON)
  return packageInfo
}

const parseResourcePath = (resourcePath, packagePath) => typeof (resourcePath) === 'object'
  ? [ resolve(packagePath, resourcePath.from), resourcePath.to ]
  : [ resolve(packagePath, resourcePath), resourcePath ]

const PACKAGE_KEY_SORT_REQUIRED = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'bundledDependencies'
]

const PACKAGE_KEY_ORDER = [
  'private',
  'name', 'version', 'description',
  'author', 'contributors',
  'license', 'keywords',
  'repository', 'homepage', 'bugs',
  'os', 'cpu', 'engines', 'engineStrict', 'preferGlobal',
  'main', 'bin', 'man', 'files', 'directories',
  'scripts', 'config', 'publishConfig',
  ...PACKAGE_KEY_SORT_REQUIRED
]

const writePackageJSON = async (packageJSON, path) => {
  PACKAGE_KEY_SORT_REQUIRED.forEach((key) => { packageJSON[ key ] && objectSortKey(packageJSON[ key ]) })
  const jsonFileStringList = Object.keys(packageJSON)
    .sort((a, b) => PACKAGE_KEY_ORDER.indexOf(a) - PACKAGE_KEY_ORDER.indexOf(b))
    .map((key) => stringIndentLine(`${JSON.stringify(key)}: ${JSON.stringify(packageJSON[ key ], null, 2)}`))
  const packageBuffer = Buffer.from(`{\n${jsonFileStringList.join(',\n')}\n}\n`)
  writeFileSync(path, packageBuffer)
  console.log(`[writePackageJSON] ${path} [${formatBinary(packageBuffer.length)}B]`)
}

const doPack = async ({ pathInput, pathOutput, outputName, outputVersion, outputDescription, isPublish, isPublishDev }) => {
  const pathOutputInstall = resolve(pathOutput, 'install')

  const { packageJSON, exportFilePairList, installFilePairList } = loadPackage(pathInput)
  if (outputName) packageJSON.name = outputName
  if (outputVersion) packageJSON.version = outputVersion
  if (outputDescription) packageJSON.description = outputDescription

  await modify.delete(pathOutput).catch(() => {})
  await createDirectory(pathOutput)
  await createDirectory(pathOutputInstall)
  await writePackageJSON(packageJSON, joinPath(pathOutput, 'package.json'))
  for (const [ source, targetRelative ] of exportFilePairList) await modify.copy(source, joinPath(pathOutput, targetRelative))
  for (const [ source, targetRelative ] of installFilePairList) await modify.copy(source, joinPath(pathOutputInstall, targetRelative))

  execSync('npm pack', { cwd: pathOutput, stdio: 'inherit', shell: true })
  const outputFileName = `${packageJSON.name}-${packageJSON.version}.tgz`
  console.log(`done pack: ${outputFileName} [${formatBinary(statSync(joinPath(pathOutput, outputFileName)).size)}B]`)

  isPublish && execSync('npm publish', { cwd: pathOutput, stdio: 'inherit', shell: true })
  isPublishDev && execSync('npm publish --tag dev', { cwd: pathOutput, stdio: 'inherit', shell: true })
}

export { doPack }
