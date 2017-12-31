import { createOptionParser, OPTION_CONFIG_PRESET } from 'dr-js/module/common/module/OptionParser'
import { parseOptionMap, createOptionGetter } from 'dr-js/module/node/module/ParseOption'

const { SingleString, OneOfString } = OPTION_CONFIG_PRESET
const PackPath = { ...SingleString, optional: (optionMap) => optionMap[ 'mode' ] && ![ 'pack-only', 'pack-publish' ].includes(optionMap[ 'mode' ].argumentList[ 0 ]), isPath: true }

const OPTION_CONFIG = {
  prefixENV: 'dev-dep',
  formatList: [ {
    ...SingleString,
    optional: true,
    name: 'config',
    shortName: 'c',
    description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`
  }, {
    ...OneOfString([
      'check-outdated', 'co',
      'pack-only', 'pack-publish'
    ]),
    name: 'mode',
    shortName: 'm',
    extendFormatList: [
      { ...PackPath, name: 'path-entry', shortName: 'e', description: `starting path to 'package.json', or directory with 'package.json' inside` },
      { ...PackPath, name: 'path-output', shortName: 'o', description: `output path` },
      { ...SingleString, optional: true, name: 'output-name', shortName: 'n', description: `output package name` },
      { ...SingleString, optional: true, name: 'output-version', shortName: 'v', description: `output package version` },
      { ...SingleString, optional: true, name: 'output-description', shortName: 'd', description: `output package description` }
    ]
  } ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  !__DEV__ && console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export { parseOption, exitWithError }
