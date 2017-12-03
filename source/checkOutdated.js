import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { Common, Node } from 'dr-js/module/Dr.node'

const { Format } = Common
const {
  Module: { runCommand, withCwd },
  File: { FILE_TYPE, createDirectory, getDirectoryContent, walkDirectoryContent, modify }
} = Node

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)

// TODO: use option from CLI/JSON?
const PATH_RESOURCE = nodeModulePath.resolve(__dirname, '../resource')
const PATH_TEMP = nodeModulePath.resolve(__dirname, '../check-outdated-gitignore')

// check
const checkOutdated = async () => {
  const { packageInfoMap, dependencyMap } = await collectPackageDependency(PATH_RESOURCE)
  const npmOutdatedOutputString = await checkOutdatedWithNpm(dependencyMap, PATH_TEMP)
  const outdatedCount = logCheckOutdatedResult(packageInfoMap, npmOutdatedOutputString)
  process.exit(outdatedCount)
}

const collectPackageDependency = async (pathResource) => {
  const packageInfoMap = {} // [name]: { name, version, source }
  const dependencyMap = {} // [name]: version
  const collectPackage = (name, version, source) => {
    if (packageInfoMap[ name ]) throw new Error(`[collectPackage] duplicate package: ${JSON.stringify({ name, version, source })}`)
    packageInfoMap[ name ] = { name, version, source }
    dependencyMap[ name ] = version
  }
  const collectDependencyObject = (dependencyObject, source) => Object.entries(dependencyObject).forEach(([ key, value ]) => collectPackage(key, value, source))
  await walkDirectoryContent(await getDirectoryContent(pathResource), async (path, name, fileType) => {
    if (fileType !== FILE_TYPE.Directory) return
    if (!nodeModuleFs.existsSync(nodeModulePath.join(path, name, 'package.json'))) return
    const packageSource = nodeModulePath.relative(pathResource, nodeModulePath.join(path, name))
    __DEV__ && console.log(`[checkOutdated] loading '${packageSource}'`)
    const {
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies
    } = JSON.parse(await readFileAsync(nodeModulePath.join(path, name, 'package.json'), 'utf8'))
    dependencies && collectDependencyObject(dependencies, packageSource)
    devDependencies && collectDependencyObject(devDependencies, packageSource)
    peerDependencies && collectDependencyObject(peerDependencies, packageSource)
    optionalDependencies && collectDependencyObject(optionalDependencies, packageSource)
  })
  return { packageInfoMap, dependencyMap }
}

const checkOutdatedWithNpm = async (dependencies, pathTemp) => {
  console.log(`[checkOutdated] create and checking '${pathTemp}'`)
  await createDirectory(pathTemp)
  await writeFileAsync(nodeModulePath.join(pathTemp, 'package.json'), JSON.stringify({ dependencies }))
  const { code, status, stdoutString, stderrString } = await withCwd(pathTemp, runCommand)('npm outdated --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/dist').catch((error) => error)
  code && console.log(`  code: ${code}, status: ${status}`)
  __DEV__ && stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
  stderrString && console.warn(Format.stringIndentLine(stderrString, '  '))
  await modify.delete(pathTemp)
  return stdoutString
}

const REGEXP_ANSI_ESCAPE_CODE = /\033\[[0-9;]*[a-zA-Z]/g // Match the terminal color code, Check: https://superuser.com/a/380778
const REGEXP_NPM_OUTDATED_OUTPUT = /(\S+)\s+MISSING\s+\S+\s+(\S+)/ // Will Match: `(Package) Current Wanted (Latest) Location`
const logCheckOutdatedResult = (packageInfoMap, npmOutdatedOutputString) => {
  const sameTable = []
  const outdatedTable = []
  npmOutdatedOutputString.split('\n').forEach((outputLine) => {
    const [ , name, versionLatest ] = REGEXP_NPM_OUTDATED_OUTPUT.exec(outputLine.replace(REGEXP_ANSI_ESCAPE_CODE, '')) || []
    if (!packageInfoMap[ name ]) return
    const { version, source } = packageInfoMap[ name ]
    const rowList = [ name, version, versionLatest, source ] // must match PAD_FUNC_LIST
    version.endsWith(versionLatest) ? sameTable.push(rowList) : outdatedTable.push(rowList)
  })
  sameTable.sort(sortTableRow)
  outdatedTable.sort(sortTableRow)
  const total = outdatedTable.length + sameTable.length
  __DEV__ && console.log(`Total: ${total} | Same: ${sameTable.length} | Outdated: ${outdatedTable.length}`)
  outdatedTable.length && console.warn(`OUTDATED[${outdatedTable.length}/${total}]:\n${formatPadTable(outdatedTable)}`)
  sameTable.length && console.log(`SAME[${sameTable.length}/${total}]:\n${formatPadTable(sameTable)}`)
  return outdatedTable.length
}

const sortTableRow = ([ nameA, , , sourceA ], [ nameB, , , sourceB ]) => (sourceA !== sourceB) ? sourceA.localeCompare(sourceB) : nameA.localeCompare(nameB)

const PAD_FUNC_LIST = [
  (name, maxWidth) => `  ${name.padStart(maxWidth)}`, // name
  undefined, // version
  undefined, // versionLatest
  (source, maxWidth) => source // source
]
const formatPadTable = (table) => Format.formatPadTable({ table, cellPad: ' | ', padFuncList: PAD_FUNC_LIST })

export { checkOutdated }
