// scripts/audit-ingress.mjs
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

console.log('>> [INGRESS] Starting Phase 1 Workspace & Remote Audit...')

// 1. Verify Working Directory Root
const cwd = process.cwd()
const rootPkg = path.join(cwd, 'package.json')
if (!fs.existsSync(rootPkg)) {
    console.error(':: [FAIL] Root package.json not found in current directory.')
    process.exit(1)
}
console.log('>> [OK] Anchored at repository root:', cwd)

// 2. Audit Git Remotes
let remotes = ''
try {
    remotes = execSync('git remote -v', { encoding: 'utf8' }).trim()
} catch (err) {
    console.error(':: [FAIL] Failed to execute git remote -v:', err.message)
    process.exit(1)
}

console.log('>> Active Git Remotes:\n' + remotes)

const hasUpstreamOrigin =
    remotes.includes('camp-candor/npm-agent-01') ||
    remotes.includes('camp-candor/995.library')
if (!hasUpstreamOrigin) {
    console.warn(
        ':: [WARN] Remote origin does not point to camp-candor/npm-agent-01.',
    )
} else {
    console.log('>> [OK] Cloned remote points to upstream boilerplate.')
}

// 3. Assert Harness Immutability
let harnessStatus = ''
try {
    harnessStatus = execSync('git status -s apps/995.library/995.library/', {
        encoding: 'utf8',
    }).trim()
} catch (err) {
    console.error(':: [FAIL] Failed to assert harness boundary:', err.message)
    process.exit(1)
}

if (harnessStatus.length > 0) {
    console.error(
        ':: [FAIL] Immutable runner boundary violated in apps/995.library/995.library/:',
    )
    console.error(harnessStatus)
    process.exit(1)
}
console.log('>> [OK] Immutable harness boundary held firm (0 lines modified).')

// 4. Inspect Working Tree Cleanliness
let status = ''
try {
    status = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
} catch (err) {
    console.error(':: [FAIL] Failed to execute git status:', err.message)
    process.exit(1)
}

// Allow scripts/audit-ingress.mjs and package.json if currently modified/untracked during phase execution
const dirtyLines = status
    .split('\n')
    .map((line) => line.trim())
    .filter(
        (line) =>
            line.length > 0 &&
            !line.endsWith('scripts/audit-ingress.mjs') &&
            !line.endsWith('package.json'),
    )

if (dirtyLines.length > 0) {
    console.error(':: [FAIL] Working tree contains uncommitted changes:')
    dirtyLines.forEach((l) => console.error('   ' + l))
    process.exit(1)
}
console.log('>> [OK] Working tree is clean (zero uncommitted state).')

console.log(
    '>> [OK] Phase 1 Ingress Audit complete. Ready for remote remapping.',
)
process.exit(0)
