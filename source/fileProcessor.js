import { statSync, unlinkSync, readFileSync, writeFileSync } from 'fs'
import { binary as formatBinary } from 'dr-js/module/common/format'

const wrapFileProcessor = ({ processor, logger }) => async (filePath) => {
  const inputString = readFileSync(filePath, 'utf8')
  const outputString = await processor(inputString, filePath)

  if (inputString === outputString) {
    logger.log(`process skipped ${filePath}`)
    return 0 // size reduce
  }

  const { size: inputSize } = statSync(filePath)
  outputString ? writeFileSync(filePath, outputString) : unlinkSync(filePath)
  const { size: outputSize } = outputString ? statSync(filePath) : { size: 0 }

  const sizeChange = outputSize - inputSize

  logger.devLog(
    `∆${(outputSize / inputSize).toFixed(2)}(${formatBinary(sizeChange)}B)`,
    `${formatBinary(inputSize)}B → ${formatBinary(outputSize)}B`,
    `${filePath}`
  )

  return outputSize - inputSize
}

const fileProcessorBabel = (inputString) => inputString
  .replace(/['"]use strict['"];?\s*/g, '')
  .replace(/Object\.defineProperty\(exports,\s*['"]__esModule['"],\s*{\s*value:\s*(true|!0)\s*}\);?\s*/g, '')
  .replace(/(exports\.\w+\s*=\s*)+(undefined|void 0);?\s*/g, '')
  .replace(/[\n\r]{2,}/g, '\n') // remove multi-blank lines // TODO: may also change `` strings
  .replace(/^[\n\r]+/, '') // remove leading blank line
const fileProcessorWebpack = (inputString) => inputString
  .replace(/function\(\){return\s*([\w$]+)}/g, '()=>$1')

export {
  wrapFileProcessor,
  fileProcessorBabel,
  fileProcessorWebpack
}
