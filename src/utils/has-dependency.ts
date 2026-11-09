import fs from 'node:fs'
import path from 'node:path'

interface PackageJson {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

// Maps a directory to its nearest `package.json`, or `null` when there is none.
const cache = new Map<string, PackageJson | null>()

function readPackageJson(dir: string): PackageJson | undefined {
  let text: string
  try {
    text = fs.readFileSync(path.join(dir, 'package.json'), 'utf8')
  } catch {
    return undefined
  }
  try {
    const json: unknown = JSON.parse(text)
    return json && typeof json === 'object' ? json : {}
  } catch {
    return {}
  }
}

function findNearestPackageJson(startDir: string): PackageJson | null {
  const visited: string[] = []
  let dir = startDir
  let result: PackageJson | null = null

  while (true) {
    const cached = cache.get(dir)
    if (cached !== undefined) {
      result = cached
      break
    }
    visited.push(dir)

    const pkg = readPackageJson(dir)
    if (pkg) {
      result = pkg
      break
    }

    const parent = path.dirname(dir)
    if (parent === dir) {
      break
    }
    dir = parent
  }

  for (const visitedDir of visited) {
    cache.set(visitedDir, result)
  }
  return result
}

/**
 * Returns true when the nearest `package.json` of `filename` lists
 * `packageName` in `dependencies`, `devDependencies` or `peerDependencies`.
 *
 * A package never depends on itself, so this returns false inside the
 * package named `packageName`.
 */
export function hasDependency(filename: string, packageName: string): boolean {
  if (!path.isAbsolute(filename)) {
    return false
  }

  const pkg = findNearestPackageJson(path.dirname(filename))
  if (!pkg || pkg.name === packageName) {
    return false
  }

  return [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies].some(
    (deps) => deps != null && typeof deps === 'object' && Object.hasOwn(deps, packageName),
  )
}
