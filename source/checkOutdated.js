import nodeModulePath from 'path'
import nodeModuleFs from 'fs'
import { Common, Node } from 'dr-js/library/Dr.node'

const { Format } = Common
const { Module: { runCommand, withCwd }, File: { FILE_TYPE, getDirectoryContent, walkDirectoryContent } } = Node

const PATH_RESOURCE = nodeModulePath.resolve(__dirname, '../resource')

// check
const checkOutdated = async () => walkDirectoryContent(
  await getDirectoryContent(PATH_RESOURCE),
  async (path, name, fileType) => {
    if (fileType !== FILE_TYPE.Directory) return
    if (!nodeModuleFs.existsSync(nodeModulePath.join(path, name, 'package.json'))) return
    console.log(`[checkOutdated] checking '${nodeModulePath.join(path, name)}'`)
    const { code, status, stdoutString, stderrString } = await withCwd(nodeModulePath.join(path, name), runCommand)('npm outdated').catch((error) => error)
    code && console.log(Format.stringIndentLine(`code: ${code}, status: ${status}`, '  '))
    stdoutString && console.log(Format.stringIndentLine(stdoutString, '  '))
    stderrString && console.log(Format.stringIndentLine(stderrString, '  '))
  }
)

export { checkOutdated }
