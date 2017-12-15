import nodeModulePath from 'path'
import { Common, Node } from 'dr-js/module/Dr.node'

import { checkOutdated } from './checkOutdated'
import { GET_INITIAL_PACKAGE_INFO, loadPackage, writePackageJSON } from './pack'
import { parseOption, exitWithError } from './option'

const { Format } = Common
const { Module: { runCommand, withCwd }, File: { createDirectory, modify } } = Node

const main = async () => {
  const { optionMap, getSingleOption, getSingleOptionOptional } = await parseOption()

  try {
    switch (getSingleOption(optionMap, 'mode')) {
      case 'check-outdated':
      case 'co':
        await checkOutdated()
        break
      case 'pack':
      case 'p':
        const pathEntry = getSingleOption(optionMap, 'path-entry')
        const pathOutput = getSingleOption(optionMap, 'path-output')
        const pathOutputInstall = nodeModulePath.resolve(pathOutput, 'install')
        const outputName = getSingleOptionOptional(optionMap, 'output-name')
        const outputVersion = getSingleOptionOptional(optionMap, 'output-version')
        const outputDescription = getSingleOptionOptional(optionMap, 'output-description')

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
        break
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${getSingleOption(optionMap, 'mode')}:`)
    console.warn(error)
    process.exit(2)
  }
}

main().catch(exitWithError)
