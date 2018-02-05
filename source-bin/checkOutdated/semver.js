const REGEXP_SEMVER = /(\d+)\.(\d+)\.(\d+)(.*)/ // simple match

const parseSemver = (versionString) => {
  const [ , major, minor, patch, label = '' ] = REGEXP_SEMVER.exec(versionString)
  return { major, minor, patch, label }
}

const compareSemver = (stringA, stringB) => { // basically (a - b)
  const a = parseSemver(stringA)
  const b = parseSemver(stringB)
  return parseInt(a.major) - parseInt(b.major) ||
    parseInt(a.minor) - parseInt(b.minor) ||
    parseInt(a.patch) - parseInt(b.patch) ||
    a.label.localeCompare(b.label)
}

export { compareSemver }
