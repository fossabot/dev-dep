import { resolve, relative, dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { FILE_TYPE, createDirectory, getPathType } from 'dr-js/module/node/file/File'
import { getFileList } from 'dr-js/module/node/file/Directory'
import { modify } from 'dr-js/module/node/file/Modify'
import { logCheckOutdatedResult } from './logResult'

const loadPackage = (pathInput, path, collectDependency) => {
  const packageSource = relative(pathInput, path)
  __DEV__ && console.log(`[loadPackage] ${packageSource}`)
  const {
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies
  } = JSON.parse(readFileSync(path, 'utf8'))
  dependencies && collectDependency(dependencies, packageSource)
  devDependencies && collectDependency(devDependencies, packageSource)
  peerDependencies && collectDependency(peerDependencies, packageSource)
  optionalDependencies && collectDependency(optionalDependencies, packageSource)
}

const withPathTemp = async ({ pathTemp, packageInfoMap, dependencyMap }) => {
  await createDirectory(pathTemp)
  writeFileSync(resolve(pathTemp, 'package.json'), JSON.stringify({ dependencies: dependencyMap }))

  let result, resultError
  try {
    result = await logCheckOutdatedResult(packageInfoMap, pathTemp)
  } catch (error) {
    resultError = error
  }

  await modify.delete(pathTemp)

  if (resultError) throw resultError
  return result
}

const doCheckOutdated = async ({ pathInput, pathTemp }) => {
  const packageInfoMap = {} // [name]: { name, version, source }
  const dependencyMap = {} // [name]: version
  const collectDependency = (dependencyObject, source) => Object.entries(dependencyObject).forEach(([ name, version ]) => {
    if (packageInfoMap[ name ]) return console.warn(`[collectDependency] dropped duplicate package: ${name} at ${source} with version: ${version}, checking: ${packageInfoMap[ name ].version}`)
    packageInfoMap[ name ] = { name, version, source }
    dependencyMap[ name ] = version
  })

  let outdatedCount

  if (await getPathType(pathInput) === FILE_TYPE.Directory) {
    if (!pathTemp) pathTemp = resolve(pathInput, 'check-outdated-gitignore')
    console.log(`[checkOutdated] create and checking '${pathTemp}'`)
    const fileList = await getFileList(pathInput)
    fileList
      .filter((path) => path.endsWith('package.json'))
      .forEach((path) => loadPackage(pathInput, path, collectDependency))
    outdatedCount = await withPathTemp({ pathTemp, packageInfoMap, dependencyMap })
  } else {
    console.log(`[checkOutdated] direct checking '${pathInput}'`)
    loadPackage(pathInput, pathInput, collectDependency)
    outdatedCount = await logCheckOutdatedResult(packageInfoMap, dirname(pathInput))
  }

  process.exit(outdatedCount)
}

export { doCheckOutdated }
