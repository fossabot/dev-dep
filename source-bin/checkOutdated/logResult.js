import { spawnSync } from 'child_process'
import { stringIndentLine, padTable } from 'dr-js/module/common/format'
import { compareSemver } from './semver'

const checkNpmOutdated = (pathPackage) => {
  const { stdout, status, signal, error } = spawnSync('npm', [ 'outdated' ], { cwd: pathPackage, stdio: 'pipe', shell: true })
  __DEV__ && console.log(`  status: ${status}, signal: ${signal}`)
  __DEV__ && console.log(stringIndentLine(stdout.toString(), '  '))
  if (error) throw error
  return stdout.toString()
}

const processResult = async (packageInfoMap, npmOutdatedOutputString) => {
  const sameTable = []
  const outdatedTable = []
  npmOutdatedOutputString.split('\n').forEach((outputLine) => {
    const [ , name, versionWanted, versionLatest ] = REGEXP_NPM_OUTDATED_OUTPUT.exec(outputLine.replace(REGEXP_ANSI_ESCAPE_CODE, '')) || []
    if (!packageInfoMap[ name ]) return
    const versionTarget = compareSemver(versionWanted, versionLatest) <= 0 ? versionLatest : versionWanted
    const { version, source } = packageInfoMap[ name ]
    const rowList = [ name, version, versionTarget, source ] // must match PAD_FUNC_LIST
    version.endsWith(versionTarget) ? sameTable.push(rowList) : outdatedTable.push(rowList)
  })
  const total = sameTable.length + outdatedTable.length
  __DEV__ && console.log(`Total: ${total} | Same: ${sameTable.length} | Outdated: ${outdatedTable.length}`)

  sameTable.sort(sortTableRow)
  sameTable.length && console.log(`SAME[${sameTable.length}/${total}]:\n${formatPadTable(sameTable)}`)
  outdatedTable.sort(sortTableRow)
  outdatedTable.length && console.log(`OUTDATED[${outdatedTable.length}/${total}]:\n${formatPadTable(outdatedTable)}`)
  return outdatedTable.length
}
const REGEXP_ANSI_ESCAPE_CODE = /\033\[[0-9;]*[a-zA-Z]/g // Match the terminal color code, Check: https://superuser.com/a/380778
const REGEXP_NPM_OUTDATED_OUTPUT = /(\S+)\s+\S+\s+(\S+)\s+(\S+)/ // Will Match: `(Package) Current (Wanted) (Latest) Location`
const sortTableRow = ([ nameA, , , sourceA ], [ nameB, , , sourceB ]) => (sourceA !== sourceB) ? sourceA.localeCompare(sourceB) : nameA.localeCompare(nameB)
const PAD_FUNC_LIST = [
  (name, maxWidth) => `  ${name.padStart(maxWidth)}`, // name
  undefined, // version
  undefined, // versionLatest
  (source) => source // source
]
const formatPadTable = (table) => padTable({ table, cellPad: ' | ', padFuncList: PAD_FUNC_LIST })

const logCheckOutdatedResult = async (packageInfoMap, pathPackage) => processResult(packageInfoMap, checkNpmOutdated(pathPackage))

export { logCheckOutdatedResult }
