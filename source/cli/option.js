import { Common } from 'dr-js/library/Dr.node'
const { createOptionParser, OPTION_CONFIG_PRESET } = Common.Module

const __DEV__ = true

const OPTION_CONFIG = {
  prefixENV: 'packager',
  formatList: [
    {
      name: 'mode',
      shortName: 'm',
      description: `should be 'pack' or 'check-outdated'`,
      ...OPTION_CONFIG_PRESET.OneOfString([ 'pack', 'check-outdated' ])
    },
    {
      name: 'config',
      shortName: 'c',
      optional: true,
      description: `# from JSON: set to path relative process.cwd()\n# from ENV: set to 'env' to collect from process.env`,
      ...OPTION_CONFIG_PRESET.SingleString
    },
    { name: 'path-entry', shortName: 'e', optional: true, description: `starting path to 'package.json', or directory with 'package.json' inside`, ...OPTION_CONFIG_PRESET.SingleString },
    { name: 'path-output', shortName: 'o', optional: true, description: `output path`, ...OPTION_CONFIG_PRESET.SingleString },
    { name: 'output-name', shortName: 'n', optional: true, description: `output package name`, ...OPTION_CONFIG_PRESET.SingleString },
    { name: 'output-version', shortName: 'v', optional: true, description: `output package version`, ...OPTION_CONFIG_PRESET.SingleString },
    { name: 'output-description', shortName: 'd', optional: true, description: `output package description`, ...OPTION_CONFIG_PRESET.SingleString }
  ]
}

const {
  parseCLI,
  parseENV,
  parseJSON,
  processOptionMap,
  formatUsage
} = createOptionParser(OPTION_CONFIG)

const exitWithError = (error) => {
  __DEV__ && console.warn(error)
  console.warn(formatUsage(error.message || error.toString()))
  process.exit(1)
}

export {
  parseCLI,
  parseENV,
  parseJSON,
  processOptionMap,
  exitWithError
}
