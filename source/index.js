import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { Common, Node } from 'dr-js/library/Dr.node'
import {
  parseCLI,
  parseENV,
  parseJSON,
  processOptionMap,
  exitWithError
} from './cli'

const __DEV__ = false

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)

const { Format, Mutable: { MutableOperation: { objectMergeDeep } } } = Common
const {
  Module: { runCommand, withCwd },
  File: { FILE_TYPE, getDirectoryContent, walkDirectoryContentShallow, createDirectory, modify }
} = Node
const getDirectoryContentShallow = (path, pathType) => getDirectoryContent(path, pathType, true)

const PATH_RESOURCE = nodeModulePath.resolve(__dirname, '../resource')

// check
const checkOutdated = async () => walkDirectoryContentShallow(
  await getDirectoryContentShallow(PATH_RESOURCE),
  async (path, name, fileType) => {
    if (fileType !== FILE_TYPE.Directory) return
    console.log(`[checkOutdated] checking '${nodeModulePath.join(path, name)}'`)
    // let resultObject
    // try { resultObject = await withCwd(nodeModulePath.join(path, name), runCommand)('npm outdated') } catch (error) { resultObject = error }
    // const { stdoutString, stderrString } = resultObject
    const { code, status, stdoutString, stderrString } = await withCwd(nodeModulePath.join(path, name), runCommand)('npm outdated').catch((error) => error)
    code && console.log(Format.stringIndentLine(`code: ${code}, status: ${status}`, '  '))
    stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
    stderrString && console.log(Format.stringIndentLine(stderrString, '  '))
  }
)

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

// main

const main = async () => {
  let optionMap = parseCLI(process.argv)
  const getOption = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]

  const OPTION_CONFIG = getOption('config')

  let pathRelative
  if (!OPTION_CONFIG) {
    __DEV__ && console.log('all cli')
    pathRelative = process.cwd() // relative to the path cwd
  } else if (OPTION_CONFIG.toLowerCase() === 'env') {
    __DEV__ && console.log('merge env')
    optionMap = { ...parseENV(process.env), ...optionMap }
    pathRelative = process.cwd() // relative to the path cwd
  } else {
    __DEV__ && console.log('merge json', OPTION_CONFIG)
    optionMap = { ...parseJSON(JSON.parse(await readFileAsync(OPTION_CONFIG, 'utf8'))), ...optionMap }
    pathRelative = nodeModulePath.dirname(OPTION_CONFIG) // relative to packager-config.json
  }

  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`[${name}] ${getOption(name)}`))
  optionMap = processOptionMap(optionMap)
  __DEV__ && console.log('processOptionMap PASS')

  const OPTION_MODE = getOption('mode')

  if (OPTION_MODE === 'check-outdated') return checkOutdated()

  if (OPTION_MODE === 'pack') {
    const PATH_ENTRY = getOption('path-entry')
    const PATH_OUTPUT = nodeModulePath.resolve(pathRelative, getOption('path-output'))
    const PATH_OUTPUT_INSTALL = nodeModulePath.resolve(PATH_OUTPUT, 'install')
    const OUTPUT_NAME = getOption('output-name')
    const OUTPUT_VERSION = getOption('output-version')
    const OUTPUT_DESCRIPTION = getOption('output-description')

    const { packageObject, exportFilePairList, installFilePairList } = loadPackage(GET_INITIAL_PACKAGE_INFO(), nodeModulePath.join(PATH_RESOURCE, PATH_ENTRY))

    if (OUTPUT_NAME) packageObject.name = OUTPUT_NAME
    if (OUTPUT_VERSION) packageObject.version = OUTPUT_VERSION
    if (OUTPUT_DESCRIPTION) packageObject.description = OUTPUT_DESCRIPTION

    await modify.delete(PATH_OUTPUT).catch(() => {})
    await createDirectory(PATH_OUTPUT)
    await createDirectory(PATH_OUTPUT_INSTALL)
    await writePackageJSON(packageObject, nodeModulePath.join(PATH_OUTPUT, 'package.json'))
    for (const [ source, targetRelative ] of exportFilePairList) await modify.copy(source, nodeModulePath.join(PATH_OUTPUT, targetRelative))
    for (const [ source, targetRelative ] of installFilePairList) await modify.copy(source, nodeModulePath.join(PATH_OUTPUT_INSTALL, targetRelative))

    const { code, status, stdoutString, stderrString } = await withCwd(nodeModulePath.join(PATH_OUTPUT), runCommand)('npm pack').catch((error) => error)
    code && console.log(Format.stringIndentLine(`code: ${code}, status: ${status}`, '  '))
    stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
    stderrString && console.log(Format.stringIndentLine(stderrString, '  '))
  }
}

main().catch(exitWithError)
