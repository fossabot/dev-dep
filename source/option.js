import { Common, Node } from 'dr-js/module/Dr.node'

const { createOptionParser, OPTION_CONFIG_PRESET } = Common.Module
const {
  parseOptionMap,
  getOptionOptional, getSingleOptionOptional,
  getOption, getSingleOption
} = Node.Module

const PackPathFormat = { ...OPTION_CONFIG_PRESET.SingleString, isPath: true, optional: (optionMap) => optionMap[ 'mode' ].argumentList[ 0 ] !== 'pack' }

const OPTION_CONFIG = {
  prefixENV: 'packager',
  formatList: [ {
    ...OPTION_CONFIG_PRESET.SingleString,
    name: 'config',
    shortName: 'c',
    optional: true,
    description: `# from JSON: set to 'path/to/config.json'\n# from ENV: set to 'env'`
  }, {
    ...OPTION_CONFIG_PRESET.OneOfString([ 'pack', 'p', 'check-outdated', 'co' ]),
    name: 'mode',
    shortName: 'm',
    extendFormatList: [
      { ...PackPathFormat, name: 'path-entry', shortName: 'e', description: `starting path to 'package.json', or directory with 'package.json' inside` },
      { ...PackPathFormat, name: 'path-output', shortName: 'o', description: `output path` },
      { ...OPTION_CONFIG_PRESET.SingleString, name: 'output-name', shortName: 'n', optional: true, description: `output package name` },
      { ...OPTION_CONFIG_PRESET.SingleString, name: 'output-version', shortName: 'v', optional: true, description: `output package version` },
      { ...OPTION_CONFIG_PRESET.SingleString, name: 'output-description', shortName: 'd', optional: true, description: `output package description` }
    ]
  } ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => ({
  optionMap: await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }),
  getOption,
  getOptionOptional,
  getSingleOption,
  getSingleOptionOptional
})

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export { parseOption, exitWithError }
