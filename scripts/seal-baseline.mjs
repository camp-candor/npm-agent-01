// scripts/seal-baseline.mjs
import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

console.log(
    '>> [SEAL] Starting Phase 5 Baseline Verification & Release Sealing...',
)

const cwd = process.cwd()
const rootPkgPath = path.join(cwd, 'package.json')

// 1. Root Anchor Check
if (!fs.existsSync(rootPkgPath)) {
    console.error(':: [FAIL] Root package.json not found in current directory.')
    process.exit(1)
}

// Helper for executing commands with clean ASCII telemetry
const runCheck = (label, cmd) => {
    console.log(`>> [CHECK] Running: ${label} (${cmd})...`)
    try {
        execSync(cmd, { stdio: 'inherit' })
        console.log(`>> [OK] ${label} passed.`)
    } catch (err) {
        console.error(`:: [FAIL] ${label} failed: ${err.message}`)
        process.exit(1)
    }
}

// 2. Pre-Seal Quality Gates
runCheck('TypeScript Project References', 'npm run check:types')
runCheck('Immutable Harness Boundary', 'npm run check:boundary')
runCheck('Sequential Monorepo Test Gauntlet', 'npm test')

// 3. Verify Remote Lineage (Origin must exist)
let remotes = ''
try {
    remotes = execSync('git remote -v', { encoding: 'utf8' }).trim()
} catch (err) {
    console.error(':: [FAIL] Failed to query git remotes:', err.message)
    process.exit(1)
}

if (!remotes.includes('origin')) {
    console.error(
        ':: [FAIL] Remote "origin" is not configured. Run Phase 2 remote remapping first.',
    )
    process.exit(1)
}
console.log('>> [OK] Git remotes configured.')

// 4. Working Tree Cleanliness Check
let status = ''
try {
    status = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
} catch (err) {
    console.error(':: [FAIL] Failed to evaluate git status:', err.message)
    process.exit(1)
}

// If there are uncommitted modifications in tracked files, commit them
if (status.length > 0) {
    console.log('>> [STAGE] Staging certified setup deliverables...')
    try {
        execSync(
            'git add .gitattributes package.json package-lock.json scripts/',
            { stdio: 'inherit' },
        )
        const remainingStatus = execSync('git status --porcelain', {
            encoding: 'utf8',
        }).trim()

        // Assert no credentials or harness files are staged
        const stagedFiles = execSync('git diff --name-only --cached', {
            encoding: 'utf8',
        }).trim()
        if (stagedFiles.includes('.env') || stagedFiles.includes('.dev.vars')) {
            console.error(
                ':: [FAIL] CRITICAL LEAK: Credential files detected in staging area!',
            )
            process.exit(1)
        }
        if (stagedFiles.includes('apps/995.library/995.library/')) {
            console.error(
                ':: [FAIL] IMMUTABLE HARNESS BREACH: apps/995.library/995.library/ detected in staging area!',
            )
            process.exit(1)
        }

        execSync(
            'git commit -m "chore(release): seal v0.1.0 baseline for 955.library"',
            { stdio: 'inherit' },
        )
        console.log('>> [OK] Sealed release commit minted.')
    } catch (err) {
        console.error(
            ':: [FAIL] Failed to commit certified setup deliverables:',
            err.message,
        )
        process.exit(1)
    }
} else {
    console.log('>> [OK] Working tree already clean.')
}

// 5. Mint Annotated Release Tag v0.1.0
const tagName = 'v0.1.0'
let tagExists = false
try {
    const existingTags = execSync('git tag', { encoding: 'utf8' })
        .trim()
        .split('\n')
    tagExists = existingTags.includes(tagName)
} catch {
    tagExists = false
}

if (tagExists) {
    console.log(`>> [INFO] Release tag ${tagName} already exists on HEAD.`)
} else {
    console.log(`>> [TAG] Creating annotated release tag ${tagName}...`)
    const tagMessage =
        '955.library v0.1.0: Certified Edge DevOps Control Plane and Terminal Agent Boilerplate'
    try {
        execSync(`git tag -a ${tagName} -m "${tagMessage}"`, {
            stdio: 'inherit',
        })
        console.log(`>> [OK] Annotated tag ${tagName} successfully created.`)
    } catch (err) {
        console.error(
            `:: [FAIL] Failed to create git tag ${tagName}:`,
            err.message,
        )
        process.exit(1)
    }
}

// 6. Post-Tag Working Tree Cleanliness Assertion
const postStatus = execSync('git status -s', { encoding: 'utf8' }).trim()
if (postStatus.length > 0) {
    console.error(':: [FAIL] Working tree dirty after release sealing:')
    console.error(postStatus)
    process.exit(1)
}
console.log('>> [OK] Working tree is 100% clean post-seal (0 dirty lines).')

console.log('>> ==============================================================')
console.log(
    '>> [SUCCESS] Phase 5 Baseline Verification & Release Sealing Complete!',
)
console.log(
    '>> Run the following commands to push your sovereign trunk and tag:',
)
console.log('>>   git push origin main')
console.log(`>>   git push origin ${tagName}`)
console.log('>> ==============================================================')

process.exit(0)
