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
  .replace(/['"]use strict['"];\s+/g, '')
  .replace(/Object\.defineProperty\(exports, ['"]__esModule['"], {\s+value: true\s+}\);\s+/g, '')
  .replace(/(exports\.\w+ = )+undefined;\s+/g, '')
  .replace(/[\n\r]{2,}/g, '\n')
const fileProcessorWebpack = (inputString) => inputString
  .replace(/function\(\){return (\w+)}/g, '()=>$1')

export {
  wrapFileProcessor,
  fileProcessorBabel,
  fileProcessorWebpack
}
