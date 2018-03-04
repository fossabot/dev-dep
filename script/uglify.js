import { resolve as resolvePath } from 'path'
import { runMain } from 'source/__utils__'
import { getLogger } from 'source/logger'
import { LIBRARY_OPTION, minifyWithUglifyEs } from 'source/uglify'

import { binary, time, padTable } from 'dr-js/module/common/format'
import { clock } from 'dr-js/module/common/time'
import { getFileList } from 'dr-js/module/node/file/Directory'

const PATH_OUTPUT = resolvePath(__dirname, '../output-gitignore')
const fromOutput = (...args) => resolvePath(PATH_OUTPUT, ...args)

runMain(async (logger) => {
  logger.padLog(`minify with uglify-es`)

  const minifyFileList = [
    ...await getFileList(fromOutput('bin')),
    ...await getFileList(fromOutput('library'))
  ].filter((path) => path.endsWith('.js') && !path.endsWith('.test.js'))

  logger.log(`file count: ${minifyFileList.length}`)

  const resultTable = []
  let totalTimeStart = clock()
  let totalSizeSource = 0
  let totalSizeDelta = 0
  for (const filePath of minifyFileList) {
    const { sizeSource, sizeOutput, timeStart, timeEnd } = minifyWithUglifyEs({ filePath, option: LIBRARY_OPTION, logger })
    const sizeDelta = sizeOutput - sizeSource
    resultTable.push([
      `∆ ${(100 * sizeDelta / sizeSource).toFixed(2)}% (${binary(sizeDelta)}B)`,
      time(timeEnd - timeStart),
      `${filePath}`
    ])
    totalSizeSource += sizeSource
    totalSizeDelta += sizeDelta
  }
  resultTable.push([
    `∆ ${(100 * totalSizeDelta / totalSizeSource).toFixed(2)}% (${binary(totalSizeDelta)}B)`,
    time(clock() - totalTimeStart),
    `TOTAL of ${minifyFileList.length} file (${binary(totalSizeSource)}B)`
  ])

  logger.log(`\n  ${padTable({
    table: resultTable,
    cellPad: ' | ',
    rowPad: '\n  ',
    padFuncList: [ (delta, width) => delta.padEnd(width), undefined, (filePath) => filePath ]
  })}`)
}, getLogger(`uglify`))
