import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { Common, Node } from 'dr-js/library/Dr.node'

const { Format } = Common
const { Module: { runCommand, withCwd }, File: { FILE_TYPE, createDirectory, getDirectoryContent, walkDirectoryContent, modify } } = Node

const readFileAsync = promisify(nodeModuleFs.readFile)
const writeFileAsync = promisify(nodeModuleFs.writeFile)

const PATH_RESOURCE = nodeModulePath.resolve(__dirname, '../resource')
const PATH_TEMP = nodeModulePath.resolve(__dirname, '../check-outdated-gitignore')
const REGEXP_OUTDATED_OUTPUT = /(\S+)\s+MISSING\s+\S+\s+(\S+)\s+\S+/

// check
const checkOutdated = async () => {
  const packageInfoList = []
  const packageInfoMap = {}

  const collectPackage = (name, version, source) => {
    const packageInfo = { name, version, source }
    if (packageInfoMap[ name ]) {
      console.log('[collectPackage] duplicate package:', packageInfo)
      return
    }
    packageInfoMap[ name ] = packageInfo
    packageInfoList.push(packageInfo)
  }

  const collectDependencyObject = (dependencyObject, source) => {
    for (const [ key, value ] of Object.entries(dependencyObject)) collectPackage(key, value, source)
  }

  await walkDirectoryContent(
    await getDirectoryContent(PATH_RESOURCE),
    async (path, name, fileType) => {
      if (fileType !== FILE_TYPE.Directory) return
      if (!nodeModuleFs.existsSync(nodeModulePath.join(path, name, 'package.json'))) return

      const {
        dependencies,
        devDependencies,
        peerDependencies,
        optionalDependencies
      } = JSON.parse(await readFileAsync(nodeModulePath.join(path, name, 'package.json'), 'utf8'))

      const source = nodeModulePath.relative(PATH_RESOURCE, nodeModulePath.join(path, name))

      dependencies && collectDependencyObject(dependencies, source)
      devDependencies && collectDependencyObject(devDependencies, source)
      peerDependencies && collectDependencyObject(peerDependencies, source)
      optionalDependencies && collectDependencyObject(optionalDependencies, source)
    }
  )
  // console.log(packageInfoList)
  await createDirectory(PATH_TEMP)
  await writeFileAsync(nodeModulePath.join(PATH_TEMP, 'package.json'), JSON.stringify({
    private: true,
    name: 'check-outdated',
    version: '0.0.0',
    author: 'dr-js',
    license: 'MIT',
    dependencies: packageInfoList.reduce((o, { name, version }) => {
      o[ name ] = version
      return o
    }, {})
  }))

  console.log(`[checkOutdated] checking '${PATH_TEMP}'`)
  const { code, status, stdoutString, stderrString } = await withCwd(PATH_TEMP, runCommand)('npm outdated --registry=https://registry.npm.taobao.org --disturl=https://npm.taobao.org/dist').catch((error) => error)
  code && console.log(Format.stringIndentLine(`code: ${code}, status: ${status}`, '  '))
  // stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
  stderrString && console.log(Format.stringIndentLine(stderrString, '  '))

  const outdatedList = []
  const sameList = []
  const lengthMax = { name: 0, version: 0, versionLatest: 0, source: 0 }
  stdoutString.split('\n').forEach((outputLine) => {
    const [ , name, versionLatest ] = REGEXP_OUTDATED_OUTPUT.exec(outputLine) || []
    if (!packageInfoMap[ name ]) return
    const { version, source } = packageInfoMap[ name ]
    lengthMax.name = Math.max(lengthMax.name, name.length)
    lengthMax.source = Math.max(lengthMax.source, source.length)
    lengthMax.version = Math.max(lengthMax.version, version.length)
    lengthMax.versionLatest = Math.max(lengthMax.versionLatest, versionLatest.length)
    if (version.includes(versionLatest)) sameList.push({ name, source, version, versionLatest })
    else outdatedList.push({ name, source, version, versionLatest })
  })

  const total = outdatedList.length + sameList.length
  outdatedList.length && console.warn(`OUTDATED[${outdatedList.length}/${total}]:`)
  outdatedList.forEach(({ name, source, version, versionLatest }) => console.warn(`${name.padStart(lengthMax.name)} | ${version.padStart(lengthMax.version)} => ${versionLatest.padEnd(lengthMax.versionLatest)} | ${source}`))
  sameList.length && console.warn(`SAME[${sameList.length}/${total}]:`)
  sameList.forEach(({ name, source, version, versionLatest }) => console.log(`${name.padStart(lengthMax.name)} | ${version.padStart(lengthMax.version)} == ${versionLatest.padEnd(lengthMax.versionLatest)} | ${source}`))

  await modify.delete(PATH_TEMP)
  process.exit(outdatedList.length)
}

export { checkOutdated }
