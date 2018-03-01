const toExportName = (name) => `${name[ 0 ].toUpperCase()}${name.slice(1)}`

const isLeadingUpperCase = (name) => (
  name.charAt(0) >= 'A' &&
  name.charAt(0) <= 'Z'
)

const compareFileName = ({ name: A }, { name: B }) => (
  (isLeadingUpperCase(A) ? A.charCodeAt(0) - 255 : A.charCodeAt(0)) -
  (isLeadingUpperCase(B) ? B.charCodeAt(0) - 255 : B.charCodeAt(0))
)

// for mixed content Directory or upper-case-named File
// merge export:
//   import * as Aaa from './aaa'
//   import * as Bbb from './Bbb'
//   export { Aaa, Bbb }
//
// for lower-cased-named File
// hoist export:
//   export { a1, a2 } from './aaa'
//   export { b1, b2 } from './Bbb'

const generateIndexScript = ({ sourceRouteMap }) => {
  const indexScriptMap = {
    // [ indexScriptPath ]: 'code'
  }

  Object.values(sourceRouteMap).forEach(({ routeList, directoryList, fileList }) => {
    const textList = []
    const importList = []

    directoryList.forEach((name) => {
      const exportName = toExportName(name)
      textList.push(`import * as ${exportName} from './${name}'`)
      importList.push(exportName)
    })

    fileList.sort(compareFileName).map(({ name, exportList }) => {
      const shouldMergeExport = directoryList.length || isLeadingUpperCase(name)

      if (shouldMergeExport) {
        const exportName = toExportName(name)
        textList.push(`import * as ${exportName} from './${name}'`)
        importList.push(exportName)
      } else {
        textList.push(`export { ${exportList.join(', ')} } from './${name}'`)
      }
    })

    importList.length && textList.push(`export { ${importList.join(', ')} }`)

    indexScriptMap[ [ ...routeList, 'index.js' ].join('/') ] = textList.join('\n')
  })

  return indexScriptMap
}

const HOIST_LIST_KEY = '@@|hoist'
const EXPORT_LIST_KEY = '@@|export'
const EXPORT_HOIST_LIST_KEY = '@@|export-hoist'

const generateExportInfo = ({ sourceRouteMap }) => {
  const exportInfoMap = {}
  const getExportInfo = (...routeList) => {
    const key = routeList.join('/')
    if (!exportInfoMap[ key ]) exportInfoMap[ key ] = {}
    return exportInfoMap[ key ]
  }

  Object.values(sourceRouteMap).forEach(({ routeList, directoryList, fileList }) => {
    const exportInfo = getExportInfo(...routeList)

    directoryList.forEach((name) => {
      exportInfo[ toExportName(name) ] = getExportInfo(...routeList, name)
    })

    fileList.sort(compareFileName).map(({ name, exportList }) => {
      const shouldMergeExport = directoryList.length || isLeadingUpperCase(name)

      if (shouldMergeExport) {
        exportInfo[ toExportName(name) ] = { [ EXPORT_LIST_KEY ]: exportList }
      } else {
        exportInfo[ name ] = { [ HOIST_LIST_KEY ]: exportList }
        exportInfo[ EXPORT_HOIST_LIST_KEY ] = [
          ...(exportInfo[ EXPORT_HOIST_LIST_KEY ] || []),
          ...exportList
        ]
      }

      getExportInfo(...routeList, name)[ EXPORT_LIST_KEY ] = exportList
    })
  })

  return exportInfoMap
}

export {
  generateIndexScript,
  HOIST_LIST_KEY,
  EXPORT_LIST_KEY,
  EXPORT_HOIST_LIST_KEY,
  generateExportInfo
}
