import { resolve } from 'path'
import { writeFileSync } from 'fs'

import { getDirectoryContent, walkDirectoryContent } from 'dr-js/module/node/file/Directory'

import { runMain } from 'source/__utils__'
import { getLogger } from 'source/logger'
import { createExportParser } from 'source/ExportIndex/parseExport'
import { generateExportInfo } from 'source/ExportIndex/generateInfo'
import { renderMarkdownExportPath } from 'source/ExportIndex/renderMarkdown'

const PATH_ROOT = resolve(__dirname, '..')
const fromRoot = (...args) => resolve(PATH_ROOT, ...args)

const collectSourceRouteMap = async ({ logger }) => {
  const { parseExport, getSourceRouteMap } = createExportParser({ logger })
  await walkDirectoryContent(await getDirectoryContent(fromRoot('source')), (path, name) => parseExport(resolve(path, name)))
  return getSourceRouteMap()
}

runMain(async (logger) => {
  logger.log(`collect sourceRouteMap`)
  const sourceRouteMap = await collectSourceRouteMap({ logger })

  logger.log(`generate exportInfo`)
  const exportInfoMap = generateExportInfo({ sourceRouteMap })

  logger.log(`output: EXPORT_INFO.md`)
  writeFileSync(fromRoot('EXPORT_INFO.md'), [
    '# Export Info',
    '',
    '#### Export Path',
    ...renderMarkdownExportPath({ exportInfoMap, rootPath: PATH_ROOT })
  ].join('\n'))
}, getLogger('generate-export'))
