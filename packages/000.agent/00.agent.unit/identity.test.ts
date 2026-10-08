import { describe, it, expect } from 'vitest'
import { getRepoIdentity, resolveRootPackageJson } from '../src/identity.js'

describe('Dynamic Repository Identity Resolver (000.agent)', () => {
    it('discovers root package.json and extracts dynamic identity', () => {
        const { pkg } = resolveRootPackageJson()
        expect(pkg.name).toBeDefined()
        expect(pkg.version).toBeDefined()
    })

    it('formats title banner as <UPPERCASE_NAME> V<VERSION>', () => {
        const identity = getRepoIdentity()
        expect(identity.label).not.toContain('REPO-BOT')
        expect(identity.label).toBe('NPM-AGENT-01')
        expect(identity.titleBanner).toMatch(/^NPM-AGENT-01 V\d+\.\d+\.\d+$/)
    })

    it('dynamically adapts if run against a mock package manifest', () => {
        const mockIdentity = getRepoIdentity(process.cwd())
        expect(mockIdentity.titleBanner).toContain(mockIdentity.label)
    })
})
