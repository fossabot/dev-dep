import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { Common } from 'dr-js/library/Dr.node'
const writeFileAsync = promisify(nodeModuleFs.writeFile)
const { Format, Mutable: { MutableOperation: { objectMergeDeep } } } = Common

// load && merge
const GET_INITIAL_PACKAGE_INFO = () => ({ packageObject: {}, exportFilePairList: [], installFilePairList: [] })
const loadPackage = (packageInfo, packagePath, loadedSet = new Set()) => {
  const packageFile = packagePath.endsWith('.json') ? packagePath : nodeModulePath.join(packagePath, 'package.json')
  if (packagePath.endsWith('.json')) packagePath = nodeModulePath.dirname(packagePath)

  if (loadedSet.has(packageFile)) return packageInfo
  loadedSet.add(packageFile)

  const {
    IMPORT: importList,
    EXPORT: exportList,
    INSTALL: installList,
    ...mergePackageObject
  } = require(packageFile)
  const { packageObject, exportFilePairList, installFilePairList } = packageInfo

  importList && importList.forEach((importPackagePath) => loadPackage(packageInfo, nodeModulePath.resolve(packagePath, importPackagePath), loadedSet))

  console.log(`[loadPackage] load: ${packageFile}`)
  installList && installList.forEach((filePath) => installFilePairList.push([ nodeModulePath.resolve(packagePath, filePath), filePath ]))
  exportList && exportList.forEach((filePath) => exportFilePairList.push([ nodeModulePath.resolve(packagePath, filePath), filePath ]))
  mergePackageObject && objectMergeDeep(packageObject, mergePackageObject)
  return packageInfo
}

const PACKAGE_KEY_ORDER = [
  'private',
  'name', 'version', 'description',
  'author', 'contributors',
  'license', 'keywords',
  'repository', 'homepage', 'bugs',
  'os', 'cpu', 'engines', 'engineStrict', 'preferGlobal',
  'main', 'bin', 'man', 'files', 'directories',
  'scripts', 'config', 'publishConfig',
  'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies'
]

// write
const writePackageJSON = async (packageObject, path) => {
  const jsonFileString = Object.entries(packageObject)
    .sort(([ a ], [ b ]) => PACKAGE_KEY_ORDER.indexOf(a) - PACKAGE_KEY_ORDER.indexOf(b))
    .map(([ key, value ]) => Format.stringIndentLine(`${JSON.stringify(key)}: ${JSON.stringify(value, null, 2)}`))
    .join(',\n')
  const packageBuffer = Buffer.from(`{\n${jsonFileString}\n}\n`)
  await writeFileAsync(path, packageBuffer)
  console.log(`[writePackageJSON] ${path} [${Format.binary(packageBuffer.length)}B]`)
}

export {
  GET_INITIAL_PACKAGE_INFO,
  loadPackage,
  writePackageJSON
}