import nodeModulePath from 'path'
import { parseOption, exitWithError } from './option'
import { doPack } from './pack'
import { doCheckOutdated } from './checkOutdated'

const main = async () => {
  const { getSingleOption, getSingleOptionOptional } = await parseOption()
  const mode = getSingleOption('mode')
  try {
    switch (mode) {
      case 'check-outdated':
      case 'co':
        await doCheckOutdated({
          pathResource: nodeModulePath.resolve(__dirname, '../resource'),
          pathTemp: nodeModulePath.resolve(__dirname, '../check-outdated-gitignore')
        })
        break
      case 'pack-only':
      case 'pack-publish':
        await doPack({
          pathEntry: getSingleOption('path-entry'),
          pathOutput: getSingleOption('path-output'),
          outputName: getSingleOptionOptional('output-name'),
          outputVersion: getSingleOptionOptional('output-version'),
          outputDescription: getSingleOptionOptional('output-description'),
          isPublish: mode === 'pack-publish'
        })
        break
    }
  } catch (error) {
    console.warn(`[Error] in mode: ${mode}:`)
    console.warn(error)
    process.exit(2)
  }
}

main().catch(exitWithError)
