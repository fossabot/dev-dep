const { execSync } = require('child_process')

const tryExec = (command, option) => {
  try {
    return execSync(command, option).toString()
  } catch (error) {
    console.warn(`[tryExec] failed for: ${command}, error: ${error}`)
    return ''
  }
}

const getGitBranch = () => tryExec('git symbolic-ref --short HEAD', { stdio: 'pipe' }).replace('\n', '')
const getGitCommitHash = () => tryExec('git log -1 --format="%H"', { stdio: 'pipe' }).replace('\n', '')

export {
  tryExec,
  getGitBranch,
  getGitCommitHash
}
