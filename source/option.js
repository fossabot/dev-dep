import { createOptionParser } from 'dr-js/module/common/module/Option/Parser'
import { ConfigPreset } from 'dr-js/module/common/module/Option/Preset'
import { parseOptionMap, createOptionGetter } from 'dr-js/module/node/module/Option'

const { SingleString, BooleanFlag, Config } = ConfigPreset
const getOptionalFormatFlag = (...formatNameList) => (optionMap) => !formatNameList.some((formatName) => Boolean(optionMap[ formatName ]))

const OPTION_CONFIG = {
  prefixENV: 'dev-dep',
  formatList: [
    Config,
    { ...BooleanFlag, name: 'help', shortName: 'h' },
    { ...BooleanFlag, name: 'version', shortName: 'v' },
    {
      ...SingleString,
      isPath: true,
      optional: getOptionalFormatFlag('check-outdated', 'pack'),
      name: 'path-input',
      shortName: 'i',
      description: `path to 'package.json', or directory with 'package.json' inside`
    },
    {
      ...BooleanFlag,
      name: 'check-outdated',
      shortName: 'C',
      extendFormatList: [
        { ...SingleString, isPath: true, optional: true, name: 'path-temp' }
      ]
    },
    {
      ...BooleanFlag,
      name: 'pack',
      shortName: 'P',
      extendFormatList: [
        { ...SingleString, isPath: true, name: 'path-output', shortName: 'o', description: `output path` },
        { ...SingleString, optional: true, name: 'output-name', description: `output package name` },
        { ...SingleString, optional: true, name: 'output-version', description: `output package version` },
        { ...SingleString, optional: true, name: 'output-description', description: `output package description` },
        { ...BooleanFlag, name: 'publish', description: `run npm publish` },
        { ...BooleanFlag, name: 'publish-dev', description: `run npm publish-dev` }
      ]
    }
  ]
}

const { parseCLI, parseENV, parseJSON, processOptionMap, formatUsage } = createOptionParser(OPTION_CONFIG)

const parseOption = async () => createOptionGetter(await parseOptionMap({ parseCLI, parseENV, parseJSON, processOptionMap }))

export { parseOption, formatUsage }
