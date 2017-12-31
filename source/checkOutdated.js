import nodeModulePath from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { stringIndentLine, padTable } from 'dr-js/module/common/format'
import { FILE_TYPE, createDirectory, getDirectoryContent, walkDirectoryContent, modify } from 'dr-js/module/node/file'

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
    if (!existsSync(nodeModulePath.join(path, name, 'package.json'))) return
    const packageSource = nodeModulePath.relative(pathResource, nodeModulePath.join(path, name))
    __DEV__ && console.log(`[checkOutdated] loading '${packageSource}'`)
    const {
      dependencies,
      devDependencies,
      peerDependencies,
      optionalDependencies
    } = JSON.parse(readFileSync(nodeModulePath.join(path, name, 'package.json'), 'utf8'))
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
  writeFileSync(nodeModulePath.join(pathTemp, 'package.json'), JSON.stringify({ dependencies }))
  const { stdout, status, signal, error } = spawnSync(
    'npm',
    [ 'outdated', '--registry=https://registry.npm.taobao.org', '--disturl=https://npm.taobao.org/dist' ],
    { cwd: pathTemp, stdio: [ 'pipe', 'pipe', 'inherit' ], shell: true }
  )
  await modify.delete(pathTemp)
  __DEV__ && console.log(`  status: ${status}, signal: ${signal}`)
  __DEV__ && console.log(stringIndentLine(stdout.toString(), '  '))
  if (error) throw error
  return stdout.toString()
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
  const total = sameTable.length + outdatedTable.length
  __DEV__ && console.log(`Total: ${total} | Same: ${sameTable.length} | Outdated: ${outdatedTable.length}`)
  sameTable.sort(sortTableRow)
  sameTable.length && console.log(`SAME[${sameTable.length}/${total}]:\n${formatPadTable(sameTable)}`)
  outdatedTable.sort(sortTableRow)
  outdatedTable.length && console.log(`OUTDATED[${outdatedTable.length}/${total}]:\n${formatPadTable(outdatedTable)}`)
  return outdatedTable.length
}

const sortTableRow = ([ nameA, , , sourceA ], [ nameB, , , sourceB ]) => (sourceA !== sourceB) ? sourceA.localeCompare(sourceB) : nameA.localeCompare(nameB)

const PAD_FUNC_LIST = [
  (name, maxWidth) => `  ${name.padStart(maxWidth)}`, // name
  undefined, // version
  undefined, // versionLatest
  (source, maxWidth) => source // source
]
const formatPadTable = (table) => padTable({ table, cellPad: ' | ', padFuncList: PAD_FUNC_LIST })

const doCheckOutdated = async ({ pathResource, pathTemp }) => {
  const { packageInfoMap, dependencyMap } = await collectPackageDependency(pathResource)
  const npmOutdatedOutputString = await checkOutdatedWithNpm(dependencyMap, pathTemp)
  const outdatedCount = logCheckOutdatedResult(packageInfoMap, npmOutdatedOutputString)
  process.exit(outdatedCount)
}

export { doCheckOutdated }
