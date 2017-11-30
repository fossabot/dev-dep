import { Common, Node } from 'dr-js/library/Dr.node'

const { createOptionParser, OPTION_CONFIG_PRESET } = Common.Module
const {
  parseOptionMap,
  getOptionOptional, getSingleOptionOptional,
  getOption, getSingleOption
} = Node.Module

const checkModePackOption = (optionMap, optionFormatSet, format) => optionMap[ 'mode' ].argumentList[ 0 ] !== 'pack'

const OPTION_CONFIG = {
  prefixENV: 'packager',
  formatList: [ {
    name: 'config',
    shortName: 'c',
    optional: true,
    description: `# from JSON: set to path relative process.cwd()\n# from ENV: set to 'env' to collect from process.env`,
    ...OPTION_CONFIG_PRESET.SingleString
  }, {
    name: 'mode',
    shortName: 'm',
    description: `should be 'pack', 'check-outdated' or 'p', 'co' in short`,
    ...OPTION_CONFIG_PRESET.OneOfString([ 'pack', 'check-outdated', 'p', 'co' ]),
    extendFormatList: [
      { name: 'path-entry', shortName: 'e', optional: checkModePackOption, description: `starting path to 'package.json', or directory with 'package.json' inside`, ...OPTION_CONFIG_PRESET.SingleString, isPath: true },
      { name: 'path-output', shortName: 'o', optional: checkModePackOption, description: `output path`, ...OPTION_CONFIG_PRESET.SingleString, isPath: true },
      { name: 'output-name', shortName: 'n', optional: true, description: `output package name`, ...OPTION_CONFIG_PRESET.SingleString },
      { name: 'output-version', shortName: 'v', optional: true, description: `output package version`, ...OPTION_CONFIG_PRESET.SingleString },
      { name: 'output-description', shortName: 'd', optional: true, description: `output package description`, ...OPTION_CONFIG_PRESET.SingleString }
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
