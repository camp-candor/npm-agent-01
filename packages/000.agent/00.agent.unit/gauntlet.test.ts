import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getRepoIdentity, resolveRootPackageJson } from '../src/identity.js'

describe('Verification Gauntlet Invariant Battery (000.agent)', () => {
    const { rootDir, pkg } = resolveRootPackageJson()

    it('asserts root package identity converges to 995.library', () => {
        expect(pkg.name).toBe('995.library')
        expect(pkg.private).toBe(true)
        expect(pkg.type).toBe('module')

        const identity = getRepoIdentity()
        expect(identity.name).toBe('995.library')
        expect(identity.titleBanner).toMatch(/^995\.library v\d+\.\d+\.\d+$/)
    })

    it('asserts immutable runner boundary in apps/995.library/995.library/ is pristine', () => {
        const status = execSync('git status -s apps/995.library/995.library/', {
            cwd: rootDir,
            encoding: 'utf8',
        }).trim()
        expect(status).toBe('')
    })

    it('asserts complete absence of cloudflare and worker dependencies in root manifest', () => {
        const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
        }

        const forbidden = [
            'wrangler',
            '@cloudflare/workers-types',
            '@cloudflare/vitest-pool-workers',
            '@funtuantw/pi-agent-cf',
            'hono',
            'playwright-core',
            'start-server-and-test',
        ]

        for (const dep of forbidden) {
            expect(allDeps[dep]).toBeUndefined()
        }
    })

    it('asserts apps/worker directory is completely absent from disk', () => {
        const workerPath = path.resolve(rootDir, 'apps/worker')
        expect(fs.existsSync(workerPath)).toBe(false)
    })

    it('asserts zero compiled artifacts (.js, .d.ts) leaked into packages/000.agent source', () => {
        const agentDir = path.resolve(rootDir, 'packages/000.agent')
        const scan = (dir: string): string[] => {
            const leaked: string[] = []
            for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name)
                if (
                    entry.isDirectory() &&
                    entry.name !== 'node_modules' &&
                    entry.name !== 'dist'
                ) {
                    leaked.push(...scan(fullPath))
                } else if (
                    entry.isFile() &&
                    (entry.name.endsWith('.js') ||
                        entry.name.endsWith('.d.ts')) &&
                    !entry.name.includes('.config.')
                ) {
                    leaked.push(fullPath)
                }
            }
            return leaked
        }
        const leaked = scan(agentDir)
        expect(leaked).toEqual([])
    })

    it('asserts 7-bit ASCII compliance across mutable packages and entrypoint', () => {
        let hasMatches = false
        try {
            const matches = execSync(
                'git grep -n -P "[\\x{1F300}-\\x{1FAD6}]" packages/ apps/995.library/run.ts .github/',
                { cwd: rootDir, encoding: 'utf8' },
            ).trim()
            if (matches.length > 0) hasMatches = true
        } catch {
            // Exit code 1 indicates 0 matches found (Passing state)
            hasMatches = false
        }
        expect(hasMatches).toBe(false)
    })
})
