import { readFileSync, writeFileSync } from 'fs'
import UglifyEs from 'uglify-es'
import { clock } from 'dr-js/module/common/time'

const ecma = 8 // specify one of: 5, 6, 7 or 8
const toplevel = true // enable top level variable and function name mangling and to drop unused variables and functions
const MODULE_OPTION = {
  ecma,
  toplevel,
  parse: { ecma },
  compress: { ecma, toplevel, join_vars: false, sequences: false },
  mangle: false,
  output: { ecma, beautify: true, indent_level: 2, width: 240 },
  sourceMap: false
}
const LIBRARY_OPTION = {
  ...MODULE_OPTION,
  mangle: { toplevel },
  output: { ecma, beautify: false, semicolons: false }
}

const minifyWithUglifyEs = ({ filePath, option, logger }) => {
  const timeStart = clock()
  const scriptSource = readFileSync(filePath, { encoding: 'utf8' })
  const { error, code: scriptOutput } = UglifyEs.minify(scriptSource, option)
  if (error) {
    logger.log(`[minifyWithUglifyEs] failed to minify file: ${filePath}`)
    throw error
  }
  writeFileSync(filePath, scriptOutput)

  const timeEnd = clock()
  const sizeSource = Buffer.byteLength(scriptSource)
  const sizeOutput = Buffer.byteLength(scriptOutput)

  return {
    sizeSource,
    sizeOutput,
    timeStart,
    timeEnd
  }
}

export {
  MODULE_OPTION,
  LIBRARY_OPTION,
  minifyWithUglifyEs
}
