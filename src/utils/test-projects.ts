import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll } from 'vitest'

function createProject(packageJson: object): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eslint-plugin-ocavue-'))
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson))
  return dir
}

/**
 * Creates temporary projects for rules that depend on `@ocavue/utils`, and
 * removes them after the tests. Each property is the path of a file inside
 * one project.
 */
export function useUtilsProjects(extension: string) {
  const withUtilsDir = createProject({ dependencies: { '@ocavue/utils': '^1.0.0' } })
  const withoutUtilsDir = createProject({ dependencies: { lodash: '^4.0.0' } })
  const utilsRepoDir = createProject({ name: '@ocavue/utils' })

  afterAll(() => {
    for (const dir of [withUtilsDir, withoutUtilsDir, utilsRepoDir]) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  const file = `src/index.${extension}`
  return {
    /** A file in a project that depends on `@ocavue/utils`. */
    withUtils: path.join(withUtilsDir, file),
    /** A file in a project that does not depend on `@ocavue/utils`. */
    withoutUtils: path.join(withoutUtilsDir, file),
    /** A file in the `@ocavue/utils` package itself. */
    utilsRepo: path.join(utilsRepoDir, file),
  }
}
