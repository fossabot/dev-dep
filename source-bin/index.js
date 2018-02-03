#!/usr/bin/env node

import { parseOption, formatUsage } from './option'
import { doCheckOutdated } from './checkOutdated'
import { doPack } from './pack'
import { name as packageName, version as packageVersion } from '../package.json'

const main = async () => {
  const { getSingleOption, getSingleOptionOptional } = await parseOption()
  try {
    if (getSingleOptionOptional('version')) return console.log(JSON.stringify({ packageName, packageVersion }, null, '  '))

    const isCheckOutdated = getSingleOptionOptional('check-outdated')
    const isPack = getSingleOptionOptional('pack')

    isCheckOutdated && await doCheckOutdated({
      pathInput: getSingleOption('path-input'),
      pathTemp: getSingleOptionOptional('path-temp')
    })

    isPack && await doPack({
      pathInput: getSingleOption('path-input'),
      pathOutput: getSingleOption('path-output'),
      outputName: getSingleOptionOptional('output-name'),
      outputVersion: getSingleOptionOptional('output-version'),
      outputDescription: getSingleOptionOptional('output-description'),
      isPublish: getSingleOptionOptional('publish'),
      isPublishDev: getSingleOptionOptional('publish-dev')
    })

    !isCheckOutdated && !isPack && console.log(formatUsage())
  } catch (error) {
    console.warn(`[Error]`, error)
    process.exit(2)
  }
}

main().catch((error) => {
  console.warn(formatUsage(error.stack || error.message || error.toString()))
  process.exit(1)
})
