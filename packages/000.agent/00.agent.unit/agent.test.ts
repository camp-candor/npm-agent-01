import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initagent, testagent, listagent } from './buz/agent.buzz.js'
import { AgentModel } from './agent.model.js'
import { getRepoIdentity } from '../src/identity.js'

describe('agent unit buzzers (Local Offline Mode)', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('should return local identity status on initagent', () => {
        const model = new AgentModel()
        const state = {} as any
        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any
        const identity = getRepoIdentity()

        initagent(model, bal, state)

        expect(slv).toHaveBeenCalledWith({
            intBit: {
                idx: 'init-agent',
                dat: expect.objectContaining({
                    status: 'local',
                    service: identity.name,
                }),
            },
        })
    })

    it('should handle testagent buzzer with val 1', () => {
        const model = new AgentModel()
        const slv = vi.fn()
        testagent(model, { idx: 'test', slv } as any, {} as any)
        expect(slv).toHaveBeenCalledWith({
            mytBit: { idx: 'test-agent', val: 1 },
        })
    })

    it('should list local agent models', async () => {
        const model = new AgentModel()
        const slv = vi.fn()
        await listagent(model, { idx: 'list', slv } as any, {} as any)
        expect(slv).toHaveBeenCalledWith({
            olmBit: {
                idx: 'list-agent',
                lst: ['local-cockpit', 'terminal-curses'],
            },
        })
    })
})
