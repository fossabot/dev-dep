import { relative, sep } from 'path'
import { HOIST_LIST_KEY, EXPORT_LIST_KEY, EXPORT_HOIST_LIST_KEY } from './generateInfo'

const renderMarkdownExportPath = ({ exportInfoMap, rootPath }) => Object.entries(exportInfoMap)
  .reduce((textList, [ path, value ]) => {
    path = relative(rootPath, path).split(sep).join('/')
    value[ EXPORT_LIST_KEY ] && textList.push(
      `+ 📄 [${path.replace(/_/g, '\\_')}.js](${path}.js)`,
      `  - ${value[ EXPORT_LIST_KEY ].map((text) => `\`${text}\``).join(', ')}`
    )
    return textList
  }, [])

const renderMarkdownExportTree = ({ exportInfo, routeList }) => Object.entries(exportInfo)
  .reduce((textList, [ key, value ]) => {
    if (key === HOIST_LIST_KEY) {
      // skip
    } else if (key === EXPORT_LIST_KEY || key === EXPORT_HOIST_LIST_KEY) {
      textList.push(`- ${value.map((text) => `\`${text}\``).join(', ')}`)
    } else {
      const childTextList = renderMarkdownExportTree({ exportInfo: value, routeList: [ ...routeList, key ] })
      childTextList.length && textList.push(`- **${key}**`, ...childTextList.map((text) => `  ${text}`))
    }
    return textList
  }, [])

export {
  renderMarkdownExportPath,
  renderMarkdownExportTree
}
