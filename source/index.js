import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { promisify } from 'util'
import { Common, Node } from 'dr-js/library/Dr.node'

import { checkOutdated } from './checkOutdated'
import { GET_INITIAL_PACKAGE_INFO, loadPackage, writePackageJSON } from './pack'
import { parseCLI, parseENV, parseJSON, processOptionMap, exitWithError } from './option'

const __DEV__ = false

const readFileAsync = promisify(nodeModuleFs.readFile)
const { Format } = Common
const { Module: { runCommand, withCwd }, File: { createDirectory, modify } } = Node

const main = async () => {
  let optionMap = optionMapResolvePath(parseCLI(process.argv), process.cwd())

  const getSingleOption = (name) => getSingleOptionOptional(name) || exitWithError(new Error(`[option] missing option ${name}`))
  const getSingleOptionOptional = (name) => optionMap[ name ] && optionMap[ name ].argumentList[ 0 ]

  const config = getSingleOptionOptional('config')
  if (config && config.toLowerCase() === 'env') {
    const envOptionMap = optionMapResolvePath(parseENV(process.env), process.cwd())
    optionMap = { ...envOptionMap, ...optionMap }
  } else if (config) {
    const jsonOptionMap = optionMapResolvePath(parseJSON(JSON.parse(await readFileAsync(config, 'utf8'))), nodeModulePath.dirname(config))
    optionMap = { ...jsonOptionMap, ...optionMap }
  }

  __DEV__ && console.log('[option]')
  __DEV__ && Object.keys(optionMap).forEach((name) => console.log(`  - [${name}] ${getSingleOption(name)}`))

  optionMap = processOptionMap(optionMap)
  __DEV__ && console.log('processOptionMap PASS')

  const mode = getSingleOption('mode')
  if (mode === 'check-outdated' || mode === 'co') return checkOutdated()
  if (mode === 'pack' || mode === 'p') {
    const pathEntry = getSingleOption('path-entry')
    const pathOutput = getSingleOption('path-output')
    const pathOutputInstall = nodeModulePath.resolve(pathOutput, 'install')
    const outputName = getSingleOptionOptional('output-name')
    const outputVersion = getSingleOptionOptional('output-version')
    const outputDescription = getSingleOptionOptional('output-description')

    const { packageObject, exportFilePairList, installFilePairList } = loadPackage(GET_INITIAL_PACKAGE_INFO(), pathEntry)

    if (outputName) packageObject.name = outputName
    if (outputVersion) packageObject.version = outputVersion
    if (outputDescription) packageObject.description = outputDescription

    await modify.delete(pathOutput).catch(() => {})
    await createDirectory(pathOutput)
    await createDirectory(pathOutputInstall)
    await writePackageJSON(packageObject, nodeModulePath.join(pathOutput, 'package.json'))
    for (const [ source, targetRelative ] of exportFilePairList) await modify.copy(source, nodeModulePath.join(pathOutput, targetRelative))
    for (const [ source, targetRelative ] of installFilePairList) await modify.copy(source, nodeModulePath.join(pathOutputInstall, targetRelative))

    const { code, status, stdoutString, stderrString } = await withCwd(nodeModulePath.join(pathOutput), runCommand)('npm pack').catch((error) => error)
    code && console.log(Format.stringIndentLine(`code: ${code}, status: ${status}`, '  '))
    stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
    stderrString && console.log(Format.stringIndentLine(stderrString, '  '))
  }
}

const optionMapResolvePath = (optionMap, pathRelative) => {
  Object.values(optionMap).forEach(({ format: { isPath }, argumentList }) => isPath && argumentList.forEach((v, i) => (argumentList[ i ] = nodeModulePath.resolve(pathRelative, v))))
  return optionMap
}

main().catch(exitWithError)
