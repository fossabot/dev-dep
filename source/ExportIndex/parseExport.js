import { sep } from 'path'
import { readFileSync } from 'fs'
import { parse as parseAST } from 'babylon'
import { FILE_TYPE, getPathType } from 'dr-js/module/node/file/File'

const getExportListFromParsedAST = (fileString, sourceFilename) => {
  const resultAST = parseAST(fileString, {
    sourceFilename,
    sourceType: 'module',
    plugins: [
      'objectRestSpread',
      'classProperties',
      'exportDefaultFrom',
      'exportNamespaceFrom'
    ]
  })
  const exportNodeList = resultAST.program.body.filter(({ type }) => type === 'ExportNamedDeclaration')
  return [].concat(...exportNodeList.map(({ specifiers, declaration }) => declaration
    ? declaration.declarations.map(({ id: { name } }) => name)
    : specifiers.map(({ exported: { name } }) => name)))
}

const createExportParser = ({ logger }) => {
  const sourceRouteMap = {
    // 'source/route': {
    //   routeList: [ 'source' ],
    //   directoryList: [ /* name */ ],
    //   fileList: [ /* { name, exportList } */ ]
    // }
  }

  const getRoute = (routeList) => {
    const key = routeList.join('/')
    if (!sourceRouteMap[ key ]) sourceRouteMap[ key ] = { routeList, directoryList: [], fileList: [] }
    return sourceRouteMap[ key ]
  }

  const parseExport = async (path) => {
    const fileType = await getPathType(path)
    const routeList = path.split(sep)
    const name = routeList.pop()

    if (FILE_TYPE.Directory === fileType) {
      getRoute(routeList).directoryList.push(name)

      logger.devLog(`[directory] ${path}`)
    } else if (FILE_TYPE.File === fileType && name.endsWith('.js') && !name.endsWith('.test.js')) {
      const fileString = readFileSync(path, { encoding: 'utf8' })
      const exportList = getExportListFromParsedAST(fileString, path)
      getRoute(routeList).fileList.push({ name: name.slice(0, -3), exportList }) // remove `.js` from name

      logger.devLog(`[file] ${path}`)
      logger.devLog(`  export [${exportList.length}]: ${exportList.join(', ')}`)
    } else logger.devLog(`[skipped] ${path} (${fileType})`)
  }

  return {
    parseExport,
    getSourceRouteMap: () => sourceRouteMap
  }
}

export { createExportParser }
