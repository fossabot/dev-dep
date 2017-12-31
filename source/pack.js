import nodeModulePath from 'path'
import { statSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { stringIndentLine, binary as formatBinary } from 'dr-js/module/common/format'
import { objectMergeDeep, objectSortKey } from 'dr-js/module/common/data/__utils__'
import { createDirectory, modify } from 'dr-js/module/node/file'

const GET_INITIAL_PACKAGE_INFO = () => ({
  packageJSON: {},
  exportFilePairList: [],
  installFilePairList: []
})

const loadPackage = (packagePath, packageInfo = GET_INITIAL_PACKAGE_INFO(), loadedSet = new Set()) => {
  const packageFile = packagePath.endsWith('.json')
    ? packagePath
    : nodeModulePath.join(packagePath, 'package.json')
  if (packagePath.endsWith('.json')) packagePath = nodeModulePath.dirname(packagePath)
  if (loadedSet.has(packageFile)) return packageInfo
  loadedSet.add(packageFile)

  const {
    IMPORT: importList,
    EXPORT: exportList,
    INSTALL: installList,
    ...mergePackageJSON
  } = require(packageFile)
  const { packageJSON, exportFilePairList, installFilePairList } = packageInfo

  importList && importList.forEach((importPackagePath) => loadPackage(nodeModulePath.resolve(packagePath, importPackagePath), packageInfo, loadedSet))

  console.log(`[loadPackage] load: ${packageFile}`)
  installList && installList.forEach((filePath) => installFilePairList.push(parseResourcePath(filePath, packagePath)))
  exportList && exportList.forEach((filePath) => exportFilePairList.push(parseResourcePath(filePath, packagePath)))
  mergePackageJSON && objectMergeDeep(packageJSON, mergePackageJSON)
  return packageInfo
}

const parseResourcePath = (resourcePath, packagePath) => typeof (resourcePath) === 'object'
  ? [ nodeModulePath.resolve(packagePath, resourcePath.from), resourcePath.to ]
  : [ nodeModulePath.resolve(packagePath, resourcePath), resourcePath ]

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

const doPack = async ({ pathEntry, pathOutput, outputName, outputVersion, outputDescription, isPublish }) => {
  const pathOutputInstall = nodeModulePath.resolve(pathOutput, 'install')

  const { packageJSON, exportFilePairList, installFilePairList } = loadPackage(pathEntry)
  if (outputName) packageJSON.name = outputName
  if (outputVersion) packageJSON.version = outputVersion
  if (outputDescription) packageJSON.description = outputDescription

  await modify.delete(pathOutput).catch(() => {})
  await createDirectory(pathOutput)
  await createDirectory(pathOutputInstall)
  await writePackageJSON(packageJSON, nodeModulePath.join(pathOutput, 'package.json'))
  for (const [ source, targetRelative ] of exportFilePairList) await modify.copy(source, nodeModulePath.join(pathOutput, targetRelative))
  for (const [ source, targetRelative ] of installFilePairList) await modify.copy(source, nodeModulePath.join(pathOutputInstall, targetRelative))

  execSync('npm pack', { cwd: pathOutput, stdio: 'inherit', shell: true })
  const outputFileName = `${packageJSON.name}-${packageJSON.version}.tgz`
  console.log(`done pack: ${outputFileName} [${formatBinary(statSync(nodeModulePath.join(pathOutput, outputFileName)).size)}B]`)

  isPublish && execSync('npm publish', { cwd: pathOutput, stdio: 'inherit', shell: true })
  isPublish && console.log(`done publish: ${outputFileName}`)
}

export { doPack }
