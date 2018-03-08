import { relative } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import UglifyEs from 'uglify-es'
import { clock } from 'dr-js/module/common/time'
import { binary, time, padTable } from 'dr-js/module/common/format'

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

const minifyFileListWithUglifyEs = async ({ fileList, option = LIBRARY_OPTION, rootPath = '', logger }) => {
  logger.padLog(`minify ${fileList.length} file with uglify-es`)

  const resultTable = []
  let totalTimeStart = clock()
  let totalSizeSource = 0
  let totalSizeDelta = 0
  for (const filePath of fileList) {
    const { sizeSource, sizeOutput, timeStart, timeEnd } = minifyWithUglifyEs({ filePath, option, logger })
    const sizeDelta = sizeOutput - sizeSource
    resultTable.push([
      `∆ ${(100 * sizeDelta / sizeSource).toFixed(2)}% (${binary(sizeDelta)}B)`,
      time(timeEnd - timeStart),
      `${relative(rootPath, filePath)}`
    ])
    totalSizeSource += sizeSource
    totalSizeDelta += sizeDelta
  }
  resultTable.push([ '--', '--', '--' ])
  resultTable.push([
    `∆ ${(100 * totalSizeDelta / totalSizeSource).toFixed(2)}% (${binary(totalSizeDelta)}B)`,
    time(clock() - totalTimeStart),
    `TOTAL of ${fileList.length} file (${binary(totalSizeSource)}B)`
  ])

  logger.log(`result:\n  ${padTable({
    table: resultTable,
    cellPad: ' | ',
    rowPad: '\n  ',
    padFuncList: [ (delta, width) => delta.padEnd(width), undefined, (filePath) => filePath ]
  })}`)
}

export {
  MODULE_OPTION,
  LIBRARY_OPTION,
  minifyWithUglifyEs,
  minifyFileListWithUglifyEs
}
